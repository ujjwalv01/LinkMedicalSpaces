import { NextRequest, NextResponse } from 'next/server'
import stripe from '@/lib/stripe'
import prisma from '@/lib/prisma'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing stripe-signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error(`[Webhook Signature Verification Failed]`, err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      // 1. Checkout Session Completed (New Subscription Setup)
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId

        if (!userId) {
          console.warn('[Webhook] No userId found in checkout session metadata')
          break
        }

        const subscriptionId = session.subscription as string
        if (!subscriptionId) {
          console.warn('[Webhook] No subscriptionId found in checkout session')
          break
        }

        // Retrieve full subscription details from Stripe (cast to any to prevent TS wrapper errors)
        const stripeSubscription = (await stripe.subscriptions.retrieve(subscriptionId)) as any
        const parseDate = (v: any) => {
          if (!v) return new Date()
          if (typeof v === 'number') return new Date(v * 1000)
          const n = Number(v)
          return !isNaN(n) ? new Date(n * 1000) : new Date()
        }
        const startDate = parseDate(stripeSubscription.current_period_start || stripeSubscription.start_date || stripeSubscription.created)
        let endDate = parseDate(stripeSubscription.current_period_end)
        
        // Force 1-year renewal if Stripe didn't give us a distinct end date (common in Sandbox)
        if (endDate.getTime() === startDate.getTime() || !stripeSubscription.current_period_end) {
          endDate = new Date(startDate)
          endDate.setFullYear(endDate.getFullYear() + 1)
        }

        // Update database: Subscription table
        await prisma.subscription.upsert({
          where: { stripeSubscriptionId: subscriptionId },
          update: {
            stripeSubscriptionId: subscriptionId,
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

        // Update database: User table
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: 'ACTIVE',
            subscriptionId,
            subscriptionExpiry: endDate,
          },
        })

        console.log(`[Webhook] Subscription successfully activated for user ${userId}`)
        break
      }

      // 2. Customer Subscription Deleted (Cancellation / Expiration)
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const subscriptionId = subscription.id

        // Find database subscription
        const dbSubscription = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: subscriptionId },
        })

        if (dbSubscription) {
          // Deactivate subscription record
          await prisma.subscription.update({
            where: { stripeSubscriptionId: subscriptionId },
            data: { status: 'INACTIVE' },
          })

          // Deactivate user record
          await prisma.user.update({
            where: { id: dbSubscription.userId },
            data: {
              subscriptionStatus: 'INACTIVE',
            },
          })
          console.log(`[Webhook] Subscription ${subscriptionId} cancelled/deleted. User role updated to INACTIVE subscription.`)
        } else {
          console.warn(`[Webhook] Deleted subscription ${subscriptionId} not found in database.`)
        }
        break
      }

      // 3. Invoice Payment Failed (Failed Renewal)
      case 'invoice.payment_failed': {
        const invoice = event.data.object as any // Cast to any to prevent invoice.subscription compilation error
        const subscriptionId = invoice.subscription as string

        if (subscriptionId) {
          const dbSubscription = await prisma.subscription.findUnique({
            where: { stripeSubscriptionId: subscriptionId },
          })

          if (dbSubscription) {
            await prisma.subscription.update({
              where: { stripeSubscriptionId: subscriptionId },
              data: { status: 'INACTIVE' },
            })

            await prisma.user.update({
              where: { id: dbSubscription.userId },
              data: {
                subscriptionStatus: 'INACTIVE',
              },
            })
            console.log(`[Webhook] Subscription ${subscriptionId} renewal payment failed. Status updated to INACTIVE.`)
          }
        }
        break
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('[Webhook Processing Error]', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
