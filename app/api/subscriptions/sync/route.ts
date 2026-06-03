import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import stripe from '@/lib/stripe'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const sessionAuth = await getServerSession(authOptions)
    if (!sessionAuth?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { session_id } = body

    if (!session_id) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
    }

    // Retrieve checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(session_id)
    
    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not successful' }, { status: 400 })
    }

    const userId = checkoutSession.metadata?.userId || sessionAuth.user.id
    const subscriptionId = checkoutSession.subscription as string

    if (!subscriptionId) {
      return NextResponse.json({ error: 'No subscription found for this checkout' }, { status: 400 })
    }

    // Retrieve subscription details
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId) as any
    const startDate = new Date(stripeSubscription.current_period_start * 1000)
    const endDate = new Date(stripeSubscription.current_period_end * 1000)

    // Manually sync to DB (Same logic as webhook)
    await prisma.subscription.upsert({
      where: { stripeSubscriptionId: subscriptionId },
      update: {
        status: 'ACTIVE',
        planName: 'Annual',
        amount: 120.00,
        startDate,
        endDate,
      },
      create: {
        userId,
        stripeSubscriptionId: subscriptionId,
        status: 'ACTIVE',
        planName: 'Annual',
        amount: 120.00,
        startDate,
        endDate,
      },
    })

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'ACTIVE',
        subscriptionId,
        subscriptionExpiry: endDate,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[POST /api/subscriptions/sync]', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
