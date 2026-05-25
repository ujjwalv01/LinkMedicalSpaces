import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default stripe

// Subscription plans configuration
export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    priceId: null,
    listings: 0,
    features: ['Browse listings', 'Save favorites', 'Contact providers'],
  },
  BASIC: {
    name: 'Basic',
    price: 29,
    priceId: process.env.STRIPE_BASIC_PRICE_ID,
    listings: 1,
    features: [
      '1 Active Listing',
      'Basic analytics',
      'Email support',
      'Standard listing placement',
    ],
  },
  PRO: {
    name: 'Pro',
    price: 79,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    listings: -1, // Unlimited
    features: [
      'Unlimited Listings',
      'Advanced analytics',
      'Priority support',
      'Featured placement',
      'AI listing descriptions',
      'Custom branding',
    ],
  },
} as const

export type PlanKey = keyof typeof PLANS
