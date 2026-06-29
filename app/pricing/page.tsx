'use client'

import { useState, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Image as ImageIcon, User, CalendarCheck, Edit, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import Footer from '@/components/Footer'

function PricingPage() {
  const { status } = useSession()
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

  const handleBypass = () => {
    if (status !== 'authenticated') {
      router.push('/signup?callbackUrl=/add-listing?region=orlando')
      return
    }
    router.push('/add-listing?region=orlando')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans overflow-x-hidden">
      {/* Top Header */}
      <header className="flex justify-between items-center px-6 py-4 bg-white z-50">
        <img src="/logo-new.png" alt="Logo" className="h-8 w-auto object-contain cursor-pointer" onClick={() => router.push('/')} />
      </header>

      {/* Main Content — Split layout */}
      <main className="flex-1 flex items-start justify-center px-6 py-10 md:py-20">
        <div className="w-full max-w-[1100px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {redirectMessage && (
            <div className="w-full mx-auto mb-10 p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-2xl flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 animate-pulse" />
              <span className="font-medium">{redirectMessage}</span>
            </div>
          )}

          {error && (
            <div className="w-full mx-auto mb-10 p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-2xl">
              {error}
            </div>
          )}

          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-16 lg:gap-24">
            
            {/* Left Side */}
            <div className="flex-1 text-center lg:text-left pt-4 max-w-xl mx-auto lg:mx-0">
              <h1 className="text-4xl md:text-[42px] font-bold text-[#2D4566] leading-[1.2] mb-8">
                <span className="inline-block mr-2 text-[42px]">📣</span> 
                New, Simpler Pricing.<br />
                Just $120/Year.
              </h1>
              
              <div className="space-y-6 text-[#6B7280] text-[17px] md:text-[19px] leading-[1.6]">
                <p>
                  For less than the price of Netflix (at least the ad-free versions!), you can advertise your medical office to thousands of local healthcare professionals.
                </p>
                <p>
                  Whether you're leasing out a few exam rooms or listing an entire medical suite, we've made it easier (and more affordable) than ever to get your space in front of the right people.
                </p>
              </div>
            </div>

            {/* Right Side */}
            <div className="flex-1 w-full max-w-[440px] mx-auto lg:mx-0">
              {/* Pricing Card */}
              <div className="bg-white rounded-3xl border-2 border-[#1a2b49] shadow-xl p-8 md:p-10 flex flex-col justify-between relative overflow-hidden mb-8">
                <div className="absolute top-0 right-0 bg-[#E51D53] text-white font-bold text-xs uppercase px-4 py-1.5 rounded-bl-2xl shadow-sm">
                  Annual Listing
                </div>

                <div className="space-y-6">
                  <div>
                    <span className="inline-block bg-slate-100 text-[#1a2b49] font-bold px-3 py-1 rounded-lg text-xs uppercase tracking-wider">
                      For Space Owners
                    </span>
                    <h3 className="text-2xl font-extrabold text-[#1a2b49] mt-3">List Your Space</h3>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 py-6 border-y border-slate-100">
                    <span className="text-5xl font-black text-[#1a2b49]">$120</span>
                    <span className="text-slate-500 font-semibold text-base">/ year</span>
                    <span className="text-xs text-slate-400 ml-2">— That's it.</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-5 pt-2">
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#1a2b49]/5 border border-[#1a2b49]/10 flex items-center justify-center text-[#1a2b49] flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span className="text-slate-600 text-[15px] leading-relaxed">List one healthcare space</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#1a2b49]/5 border border-[#1a2b49]/10 flex items-center justify-center text-[#1a2b49] flex-shrink-0 mt-0.5">
                        <ImageIcon className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span className="text-slate-600 text-[15px] leading-relaxed">Unlimited photos & description</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#1a2b49]/5 border border-[#1a2b49]/10 flex items-center justify-center text-[#1a2b49] flex-shrink-0 mt-0.5">
                        <User className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span className="text-slate-600 text-[15px] leading-relaxed">Connect directly with medical & dental professionals</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#1a2b49]/5 border border-[#1a2b49]/10 flex items-center justify-center text-[#1a2b49] flex-shrink-0 mt-0.5">
                        <CalendarCheck className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span className="text-slate-600 text-[15px] leading-relaxed">Listings stay live and searchable for 12 months</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#1a2b49]/5 border border-[#1a2b49]/10 flex items-center justify-center text-[#1a2b49] flex-shrink-0 mt-0.5">
                        <Edit className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span className="text-slate-600 text-[15px] leading-relaxed">Edit or update anytime</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-10">
                  <button
                    onClick={handleSubscribe}
                    disabled={loading}
                    className="w-full bg-[#1a2b49] hover:bg-[#0f1d33] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#1a2b49]/20 transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-95"
                  >
                    {loading ? 'Processing...' : 'Create Your Listing →'}
                  </button>
                </div>
              </div>

              {/* Text Below Card */}
              <div className="text-center space-y-6 text-[15px] text-[#6B7280]">
                <p className="leading-relaxed">
                  We believe independent practices and small landlords deserve affordable tools to connect with quality tenants—<span className="font-semibold text-slate-700">without overpaying or overcomplicating.</span>
                </p>
                
                <div className="space-y-1">
                  <p className="font-semibold text-slate-700">You choose:</p>
                  <p>You can binge and chill... or <span className="font-semibold text-slate-700">post and chill.</span> 😎</p>
                </div>

                <div className="w-24 h-[1px] bg-slate-200 mx-auto my-8"></div>

                <div className="space-y-1">
                  <p>Still have questions?</p>
                  <p><Link href="/contact" className="text-[#DC3545] hover:underline font-medium">Contact us</Link> — we're happy to help.</p>
                </div>

                <div className="space-y-1">
                  <p>Have more than one office to list?</p>
                  <p><Link href="/contact" className="text-[#DC3545] hover:underline font-medium">Reach out to us directly.</Link></p>
                </div>
                
                <div className="pt-4">
                  <button
                    onClick={handleBypass}
                    className="text-[10px] text-slate-300 hover:text-slate-400 transition-colors"
                  >
                    Bypass payment (Dev only)
                  </button>
                </div>

              </div>

            </div>

          </div>
        </div>
      </main>
      <Footer />
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
