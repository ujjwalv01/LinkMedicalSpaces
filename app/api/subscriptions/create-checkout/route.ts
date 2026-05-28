import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import stripe, { getOrCreateAnnualPriceId } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    // TEMPORARY BYPASS FOR VIEWING WORKFLOW
    let userId = session?.user?.id || 'dummy_user_id'
    let email = session?.user?.email?.toLowerCase() || 'test@example.com'
    let name = session?.user?.name || 'Test User'

    // if (!session?.user?.id || !session?.user?.email) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // 1. Get or create the Stripe customer profile
    const customers = await stripe.customers.list({ email, limit: 1 })
    let customerId = customers.data[0]?.id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        name: name || undefined,
        metadata: { userId },
      })
      customerId = customer.id
    }

    // 2. Fetch or dynamically create the $120/year annual plan price ID
    const priceId = await getOrCreateAnnualPriceId(stripe)

    // 3. Create checkout session in subscription mode
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success?region=orlando`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/cancel`,
      metadata: { userId },
      subscription_data: {
        metadata: { userId },
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error('[POST /api/subscriptions/create-checkout]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to initiate Stripe Checkout Session' },
      { status: 500 }
    )
  }
}
