import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import stripe from '@/lib/stripe'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { session_id } = body

    if (!session_id) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
    }

    // Retrieve checkout session from Stripe (this is the source of truth)
    const checkoutSession = await stripe.checkout.sessions.retrieve(session_id)
    
    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed yet' }, { status: 400 })
    }

    const subscriptionId = checkoutSession.subscription as string
    if (!subscriptionId) {
      return NextResponse.json({ error: 'No subscription found for this checkout' }, { status: 400 })
    }

    // Check if already synced (idempotent)
    const existing = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscriptionId }
    })
    if (existing) {
      return NextResponse.json({ success: true, message: 'Already synced' })
    }

    // Determine the userId: from Stripe metadata first, then from current session
    let userId = checkoutSession.metadata?.userId
    
    // If userId from metadata is dummy or missing, try current auth session
    if (!userId || userId === 'dummy_user_id') {
      const sessionAuth = await getServerSession(authOptions)
      userId = sessionAuth?.user?.id || null
    }

    // If still no userId, try to find user by customer email from Stripe
    if (!userId) {
      const customerEmail = checkoutSession.customer_details?.email
      if (customerEmail) {
        const user = await prisma.user.findFirst({
          where: { email: { equals: customerEmail, mode: 'insensitive' } },
          select: { id: true }
        })
        userId = user?.id || null
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Could not determine user. Please sign in.' }, { status: 400 })
    }

    // Verify the user actually exists in DB
    const userExists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
    if (!userExists) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 400 })
    }

    // Retrieve full subscription details from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId) as any
    const startDate = new Date(stripeSubscription.current_period_start * 1000)
    const endDate = new Date(stripeSubscription.current_period_end * 1000)

    // Create subscription record in DB
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

    // Update user's subscription status
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'ACTIVE',
        subscriptionId,
        subscriptionExpiry: endDate,
      },
    })

    console.log(`[Sync] Subscription ${subscriptionId} synced for user ${userId}`)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[POST /api/subscriptions/sync]', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
