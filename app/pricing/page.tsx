'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check, Loader2, Building, ShieldCheck, HelpCircle, ArrowRight, User } from 'lucide-react'

export default function PricingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectMessage = searchParams.get('message')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = async () => {
    if (status !== 'authenticated') {
      router.push('/signup?callbackUrl=/pricing')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/subscriptions/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to initiate payment')

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during checkout initialization.')
      setLoading(false)
    }
  }

  const features = [
    'List one healthcare space (exam room, dental chair, surgical suite)',
    'Unlimited photos and detailed description',
    'Direct connection with medical and dental professionals',
    'Listings remain live and searchable for 12 months',
    'Edit or update your listing at any time',
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
              <Building className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-lg">
              LinkMedical<span className="text-teal-600">Spaces</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {status === 'authenticated' ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="text-sm font-semibold text-slate-600 hover:text-teal-600 transition-colors"
              >
                Dashboard
              </button>
            ) : (
              <button
                onClick={() => router.push('/signin')}
                className="text-sm font-semibold text-slate-600 hover:text-teal-600 transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Hero & Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 md:py-20 flex flex-col items-center">
        {redirectMessage && (
          <div className="w-full max-w-xl mb-8 p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-2xl flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 animate-pulse" />
            <span className="font-medium">{redirectMessage}</span>
          </div>
        )}

        {error && (
          <div className="w-full max-w-xl mb-8 p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-2xl">
            {error}
          </div>
        )}

        {/* Heading */}
        <div className="text-center space-y-4 max-w-2xl mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Simple, transparent <span className="text-teal-600">pricing</span>.
          </h1>
          <p className="text-slate-500 text-base md:text-lg">
            Establish your account for free. Pay only when you post a space.
          </p>
        </div>

        {/* Single Pricing Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl items-stretch">
          {/* Owner Plan Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-3xl border-2 border-teal-600 shadow-xl p-8 md:p-10 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-teal-600 text-white font-bold text-xs uppercase px-4 py-1.5 rounded-bl-2xl">
              Annual Listing
            </div>

            <div className="space-y-6">
              <div>
                <span className="inline-block bg-teal-50 text-teal-700 font-bold px-3 py-1 rounded-lg text-xs uppercase tracking-wider">
                  For Space Owners
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-3">List Your Space</h3>
                <p className="text-sm text-slate-500 mt-1">Rent exam rooms, dental chairs, or suites.</p>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-1 py-4 border-y border-slate-100">
                <span className="text-5xl font-black text-slate-900">$120</span>
                <span className="text-slate-500 font-semibold text-base">/ year</span>
                <span className="text-xs text-slate-400 ml-2">(per listing)</span>
              </div>

              {/* Features */}
              <ul className="space-y-4">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-slate-600 text-sm leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-teal-600/25 transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-98"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Redirecting to Secure Checkout...
                  </>
                ) : (
                  <>
                    Subscribe Now
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <p className="text-[10px] text-center text-slate-400 mt-3">
                Secure transaction processed via Stripe. Cancel subscription renewal at any time.
              </p>
            </div>
          </motion.div>

          {/* Seeker Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-10 flex flex-col justify-between"
          >
            <div className="space-y-6">
              <div>
                <span className="inline-block bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-lg text-xs uppercase tracking-wider">
                  For Space Seekers
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-3">Find Clinic Rooms</h3>
                <p className="text-sm text-slate-500 mt-1">Doctors, therapists, and dental specialists.</p>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-1 py-4 border-y border-slate-100">
                <span className="text-5xl font-black text-slate-900">Free</span>
                <span className="text-slate-500 font-semibold text-base">forever</span>
              </div>

              {/* Features */}
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-slate-600 text-sm leading-relaxed">
                    Browse hundreds of specialized medical office listings
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-slate-600 text-sm leading-relaxed">
                    Filter by space types (exam rooms, labs, surgical suites)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-slate-600 text-sm leading-relaxed">
                    Direct access to space owner details and booking agreements
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-slate-600 text-sm leading-relaxed">
                    Zero tenant booking platform commissions
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <button
                onClick={() => router.push(status === 'authenticated' ? '/dashboard' : '/signup')}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <span>Get Started Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[10px] text-center text-slate-400 mt-3">
                No credit card required to browse listings and connect.
              </p>
            </div>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <div className="w-full max-w-3xl mt-16 md:mt-24 space-y-6">
          <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-teal-600" />
            Frequently Asked Questions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800">What is the $120 fee for?</h4>
              <p className="text-slate-500 leading-relaxed">
                The annual subscription allows listing owners to publish a single listing on our platform. The subscription is per listing.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800">Can I update my listing details?</h4>
              <p className="text-slate-500 leading-relaxed">
                Yes! You can edit information, add photos, change hourly/monthly pricing, or suspend search indexing at any time during your 12-month period.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800">How do bookings work?</h4>
              <p className="text-slate-500 leading-relaxed">
                Renter prospects contact you directly. We do not intermediate communications or take transactional cuts, saving thousands in commissions.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800">Is there a contract?</h4>
              <p className="text-slate-500 leading-relaxed">
                No contract. Renewals run on a yearly cycle and you can turn off automatic renewal at any point from your stripe customer panel.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center">
        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} LinkMedicalSpaces. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
