import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import stripe from '@/lib/stripe'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { session_id } = body

    console.log('[Sync] Called with session_id:', session_id)

    if (!session_id) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
    }

    // 1. Retrieve checkout session from Stripe (this is the source of truth)
    let checkoutSession
    try {
      checkoutSession = await stripe.checkout.sessions.retrieve(session_id)
    } catch (stripeErr: any) {
      console.error('[Sync] Stripe retrieve failed:', stripeErr.message)
      return NextResponse.json({ error: 'Invalid Stripe session: ' + stripeErr.message }, { status: 400 })
    }

    console.log('[Sync] Stripe checkout status:', checkoutSession.payment_status, 'subscription:', checkoutSession.subscription)

    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed. Status: ' + checkoutSession.payment_status }, { status: 400 })
    }

    const subscriptionId = checkoutSession.subscription as string
    if (!subscriptionId) {
      return NextResponse.json({ error: 'No subscription found in checkout session' }, { status: 400 })
    }

    // 2. Check if already synced (idempotent)
    const existing = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscriptionId }
    })
    if (existing) {
      console.log('[Sync] Already synced:', subscriptionId)
      return NextResponse.json({ success: true, message: 'Already synced' })
    }

    // 3. Determine the userId using multiple strategies
    let userId: string | null = null

    // Strategy A: From Stripe metadata
    const metadataUserId = checkoutSession.metadata?.userId
    if (metadataUserId && metadataUserId !== 'dummy_user_id') {
      const userExists = await prisma.user.findUnique({ where: { id: metadataUserId }, select: { id: true } })
      if (userExists) {
        userId = metadataUserId
        console.log('[Sync] Found user via Stripe metadata:', userId)
      }
    }

    // Strategy B: From current auth session
    if (!userId) {
      const sessionAuth = await getServerSession(authOptions)
      if (sessionAuth?.user?.id) {
        userId = sessionAuth.user.id
        console.log('[Sync] Found user via auth session:', userId)
      }
    }

    // Strategy C: From Stripe customer email
    if (!userId) {
      const customerEmail = checkoutSession.customer_details?.email
      console.log('[Sync] Trying email lookup with:', customerEmail)
      if (customerEmail) {
        const user = await prisma.user.findFirst({
          where: { email: { equals: customerEmail, mode: 'insensitive' } },
          select: { id: true }
        })
        if (user) {
          userId = user.id
          console.log('[Sync] Found user via email:', userId)
        }
      }
    }

    // Strategy D: From Stripe customer object
    if (!userId && checkoutSession.customer) {
      try {
        const customer = await stripe.customers.retrieve(checkoutSession.customer as string) as any
        if (customer?.email) {
          const user = await prisma.user.findFirst({
            where: { email: { equals: customer.email, mode: 'insensitive' } },
            select: { id: true }
          })
          if (user) {
            userId = user.id
            console.log('[Sync] Found user via Stripe customer object:', userId)
          }
        }
      } catch (e) {
        console.error('[Sync] Failed to retrieve Stripe customer:', e)
      }
    }

    if (!userId) {
      console.error('[Sync] Could not determine user. Metadata:', checkoutSession.metadata, 'Customer email:', checkoutSession.customer_details?.email)
      return NextResponse.json({ 
        error: 'Could not determine user. Please make sure you are signed in with the same account you used to subscribe.' 
      }, { status: 400 })
    }

    // 4. Retrieve full subscription details from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId) as any
    
    console.log('[Sync] Raw Stripe period_start:', stripeSubscription.current_period_start, 'type:', typeof stripeSubscription.current_period_start)
    console.log('[Sync] Raw Stripe period_end:', stripeSubscription.current_period_end, 'type:', typeof stripeSubscription.current_period_end)
    
    // Safely parse dates - Stripe returns Unix timestamps in seconds
    const parseStripeDate = (val: any): Date => {
      if (!val) return new Date()
      if (typeof val === 'number') return new Date(val * 1000)
      if (typeof val === 'string') {
        const num = Number(val)
        if (!isNaN(num)) return new Date(num * 1000)
        const parsed = new Date(val)
        if (!isNaN(parsed.getTime())) return parsed
      }
      return new Date()
    }
    
    const startDate = parseStripeDate(stripeSubscription.current_period_start)
    const endDate = parseStripeDate(stripeSubscription.current_period_end)
    
    console.log('[Sync] Parsed startDate:', startDate.toISOString(), 'endDate:', endDate.toISOString())

    // 5. Create subscription record in DB
    await prisma.subscription.create({
      data: {
        userId,
        stripeSubscriptionId: subscriptionId,
        status: 'ACTIVE',
        planName: 'Annual',
        amount: 120.00,
        startDate,
        endDate,
      },
    })

    // 6. Update user's subscription status
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'ACTIVE',
        subscriptionId,
        subscriptionExpiry: endDate,
      },
    })

    console.log('[Sync] ✅ Subscription', subscriptionId, 'synced for user', userId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Sync] ❌ Unhandled error:', error.message, error.stack)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
