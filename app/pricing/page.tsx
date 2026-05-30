'use client'

import { useState, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check, ShieldCheck, ArrowRight, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'

function PricingPage() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectMessage = searchParams.get('message')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

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

  const handleBypass = () => {
    if (status !== 'authenticated') {
      router.push('/signup?callbackUrl=/add-listing?region=orlando')
      return
    }
    router.push('/add-listing?region=orlando')
  }

  const features = [
    'List one healthcare space (exam room, dental chair, surgical suite)',
    'Unlimited photos and detailed description',
    'Direct connection with medical and dental professionals',
    'Listings remain live and searchable for 12 months',
    'Edit or update your listing at any time',
  ]

  const faqs = [
    {
      q: 'What is the $120 fee for?',
      a: 'The annual subscription allows listing owners to publish a single listing on our platform. The subscription is per listing.'
    },
    {
      q: 'Can I update my listing details?',
      a: 'Yes! You can edit information, add photos, change hourly/monthly pricing, or suspend search indexing at any time during your 12-month period.'
    },
    {
      q: 'How do bookings work?',
      a: 'Renter prospects contact you directly. We do not intermediate communications or take transactional cuts, saving thousands in commissions.'
    },
    {
      q: 'Is there a contract?',
      a: 'No contract. Renewals run on a yearly cycle and you can turn off automatic renewal at any point from your Stripe customer panel.'
    }
  ]

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans overflow-x-hidden">
      {/* Top Header */}
      <header className="flex justify-between items-center px-6 py-4 bg-white border-b border-slate-100 z-50">
        <img src="/logo-new.png" alt="Logo" className="h-8 w-auto object-contain cursor-pointer" onClick={() => router.push('/')} />
        <button
          onClick={() => router.push('/list-your-space')}
          className="px-5 py-2 rounded-full text-sm font-semibold bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 transition-colors shadow-sm"
        >
          Back
        </button>
      </header>

      {/* Main Content — Split layout */}
      <main className="flex-1 flex items-start justify-center px-6 py-10 md:py-16">
        <div className="w-full max-w-[1200px] animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {redirectMessage && (
            <div className="w-full max-w-xl mx-auto mb-10 p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-2xl flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 animate-pulse" />
              <span className="font-medium">{redirectMessage}</span>
            </div>
          )}

          {error && (
            <div className="w-full max-w-xl mx-auto mb-10 p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-2xl">
              {error}
            </div>
          )}

          <div className="flex flex-col lg:flex-row justify-between gap-12 lg:gap-20">
            
            {/* Left Side — Heading & FAQs */}
            <div className="flex-1 lg:max-w-xl text-left pt-4">
              <h1 className="text-[44px] md:text-[54px] lg:text-[64px] font-semibold text-[#1a2b49] leading-[1.15] tracking-tight">
                Simple, transparent<br className="hidden lg:block" /> <span className="text-[#E51D53]">pricing</span>.
              </h1>
              <p className="text-slate-500 mt-6 leading-relaxed text-[17px]">
                Establish your account for free. Pay only when you are ready to publish your space.
              </p>

              {/* FAQs integrated into the left side */}
              <div className="mt-16 space-y-4">
                <h3 className="text-xl font-bold text-[#1a2b49] flex items-center gap-2 mb-6">
                  <HelpCircle className="w-5 h-5 text-[#E51D53]" />
                  Frequently Asked Questions
                </h3>
                
                {faqs.map((faq, index) => (
                  <div key={index} className="border-b border-slate-100 pb-4">
                    <button 
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      className="flex items-center justify-between w-full text-left py-2 group"
                    >
                      <span className="font-semibold text-slate-800 group-hover:text-[#E51D53] transition-colors">
                        {faq.q}
                      </span>
                      {openFaq === index ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                    {openFaq === index && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-slate-500 text-[15px] leading-relaxed pt-2 pb-2"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side — Pricing Card */}
            <div className="flex-1 w-full lg:max-w-[500px]">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-3xl border-2 border-[#1a2b49] shadow-xl p-8 md:p-10 flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 bg-[#E51D53] text-white font-bold text-xs uppercase px-4 py-1.5 rounded-bl-2xl shadow-sm">
                  Annual Listing
                </div>

                <div className="space-y-6">
                  <div>
                    <span className="inline-block bg-slate-100 text-[#1a2b49] font-bold px-3 py-1 rounded-lg text-xs uppercase tracking-wider">
                      For Space Owners
                    </span>
                    <h3 className="text-2xl font-extrabold text-[#1a2b49] mt-3">List Your Space</h3>
                    <p className="text-sm text-slate-500 mt-1">Rent exam rooms, dental chairs, or suites.</p>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 py-6 border-y border-slate-100">
                    <span className="text-5xl font-black text-[#1a2b49]">$120</span>
                    <span className="text-slate-500 font-semibold text-base">/ year</span>
                    <span className="text-xs text-slate-400 ml-2">(per listing)</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-5 pt-2">
                    {features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-[#1a2b49]/5 border border-[#1a2b49]/10 flex items-center justify-center text-[#1a2b49] flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className="text-slate-600 text-[15px] leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-10">
                  <button
                    onClick={handleSubscribe}
                    disabled={loading}
                    className="w-full bg-[#1a2b49] hover:bg-[#0f1d33] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#1a2b49]/20 transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-95"
                  >
                    Subscribe Now
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleBypass}
                    disabled={loading}
                    className="w-full mt-3 bg-white hover:bg-slate-50 text-slate-700 font-bold py-3.5 rounded-xl border border-slate-200 border-dashed flex items-center justify-center transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Continue without payment (for viewing workflow)
                  </button>
                  <p className="text-[11px] text-center text-slate-400 mt-4 leading-relaxed">
                    Secure transaction processed via Stripe.<br/>Cancel subscription renewal at any time.
                  </p>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}

export default function PricingPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PricingPage />
    </Suspense>
  )
}
