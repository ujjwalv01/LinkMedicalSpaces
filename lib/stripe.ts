import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default stripe

// Single annual subscription plan configuration
export const PLANS = {
  ANNUAL: {
    id: 'annual',
    name: 'Annual Listing Plan',
    price: 120,
    priceId: process.env.STRIPE_ANNUAL_PRICE_ID || null,
    features: [
      'List one healthcare space (exam room, dental chair, surgical suite)',
      'Unlimited photos and detailed description',
      'Direct connection with medical and dental professionals',
      'Listings remain live and searchable for 12 months',
      'Edit or update your listing at any time',
    ],
  },
} as const

export type PlanKey = keyof typeof PLANS

/**
 * Retrieves the configured Stripe Price ID for the Annual Plan.
 * If not defined in env, it searches the connected Stripe account for the
 * product and price, and creates them dynamically if they do not exist.
 */
export async function getOrCreateAnnualPriceId(stripeInstance: Stripe): Promise<string> {
  // If price ID is configured in environment, use it
  if (process.env.STRIPE_ANNUAL_PRICE_ID) {
    return process.env.STRIPE_ANNUAL_PRICE_ID
  }

  // Otherwise, look for product by name in the Stripe Sandbox account
  const products = await stripeInstance.products.list({ limit: 50 })
  let product = products.data.find((p) => p.name === 'LinkMedicalSpaces Annual Listing')

  if (!product) {
    product = await stripeInstance.products.create({
      name: 'LinkMedicalSpaces Annual Listing',
      description: 'Annual listing subscription for medical space owners to publish one listing.',
      metadata: { plan: 'annual' },
    })
  }

  // Look for active annual price of $120 associated with the product
  const prices = await stripeInstance.prices.list({ product: product.id, active: true })
  let price = prices.data.find(
    (p) => p.unit_amount === 12000 && p.recurring?.interval === 'year'
  )

  if (!price) {
    price = await stripeInstance.prices.create({
      product: product.id,
      unit_amount: 12000,
      currency: 'usd',
      recurring: { interval: 'year' },
    })
  }

  return price.id
}
