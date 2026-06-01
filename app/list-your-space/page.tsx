'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Loader2, Info, Globe, ArrowRight, Check } from 'lucide-react'

import AuthModal from '@/components/AuthModal'

function ListYourSpacePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status: authStatus } = useSession()

  const [currentStep, setCurrentStep] = useState(1)
  const [selectedRegion, setSelectedRegion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [prefetching, setPrefetching] = useState(false)

  // Prefetch Stripe URL when entering Step 2 as authenticated user
  useEffect(() => {
    if (currentStep === 2 && authStatus === 'authenticated' && !checkoutUrl && !prefetching && !error) {
      const prefetch = async () => {
        setPrefetching(true)
        try {
          const res = await fetch('/api/subscriptions/create-checkout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Failed to prepare checkout')
          if (data.url) {
            setCheckoutUrl(data.url)
          } else {
            throw new Error('No checkout URL received')
          }
        } catch (err: any) {
          setError('Failed to prepare secure checkout. Please try refreshing.')
        } finally {
          setPrefetching(false)
        }
      }
      prefetch()
    }
  }, [currentStep, authStatus, checkoutUrl, prefetching, error])

  // Auto-trigger if they just logged in via the modal and the page reloaded with ?region=orlando
  useEffect(() => {
    const regionParam = searchParams.get('region')
    if (regionParam === 'orlando' && authStatus === 'authenticated' && !selectedRegion && !loading) {
      setSelectedRegion('orlando')
      handleContinue('orlando')
    }
  }, [searchParams, authStatus, selectedRegion, loading])

  const handleContinue = async (region?: string) => {
    const targetRegion = region || selectedRegion
    if (!targetRegion) return
    setError(null)

    if (targetRegion === 'other') {
      return
    }

    if (targetRegion === 'orlando') {
      setCurrentStep(2)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSubscribe = async () => {
    if (authStatus !== 'authenticated') {
      router.push('/signup?callbackUrl=/list-your-space?region=orlando')
      return
    }

    if (checkoutUrl) {
      window.location.href = checkoutUrl
    } else {
      setError('Checkout is not ready yet. Please wait or refresh.')
    }
  }

  const handleBypass = () => {
    if (authStatus !== 'authenticated') {
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

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans overflow-x-hidden">
      {/* Top Header — minimal like the add-listing form */}
      <header className="flex justify-between items-center px-6 py-4 bg-white border-b border-slate-100 z-50">
        <img src="/logo-new.png" alt="Logo" className="h-8 w-auto object-contain cursor-pointer" onClick={() => router.push('/')} />
        <button
          onClick={() => router.push('/')}
          className="px-5 py-2 rounded-full text-sm font-semibold bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 transition-colors shadow-sm"
        >
          Exit
        </button>
      </header>

      {/* Main Content — vertical layout */}
      <main className="flex-1 flex flex-col items-center justify-start px-6 pt-8 md:pt-10 pb-10">
        <div className="w-full max-w-3xl flex flex-col items-center">
          
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="w-full flex flex-col items-center gap-12"
              >
                {/* Top Side — Heading */}
                <div className="text-center">
                  <h1 className="text-[44px] md:text-[54px] lg:text-[64px] font-semibold text-[#1a2b49] leading-[1.15] tracking-tight">
                    Where do you want to <span className="text-[#E51D53]">list</span> your space?
                  </h1>
                  <p className="text-slate-500 mt-6 leading-relaxed text-[17px] max-w-md mx-auto">
                    Select your listing region to get started. We're expanding to new areas soon.
                  </p>
                </div>

                {/* Bottom Side — Region selection cards */}
                <div className="w-full max-w-[550px] space-y-6">
                  <p className="text-2xl font-bold text-[#1a2b49] tracking-wide mb-2 text-center">Select your region</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Orlando Area Card */}
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setSelectedRegion('orlando')
                        setError(null)
                        handleContinue('orlando')
                      }}
                      disabled={loading}
                      className={`relative flex flex-col items-start gap-4 p-6 rounded-2xl border-2 transition-all text-left cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                        selectedRegion === 'orlando'
                          ? 'bg-[#1a2b49] border-[#1a2b49] text-white shadow-lg shadow-slate-900/10'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <MapPin className={`w-7 h-7 ${selectedRegion === 'orlando' ? 'text-white' : 'text-[#E51D53]'}`} />
                      <div>
                        <h3 className={`text-lg font-bold ${selectedRegion === 'orlando' ? 'text-white' : 'text-[#1a2b49]'}`}>Orlando Area</h3>
                        <p className={`text-xs mt-1 leading-relaxed ${selectedRegion === 'orlando' ? 'text-slate-300' : 'text-slate-500'}`}>
                          Orange, Seminole, Osceola & surrounding counties
                        </p>
                      </div>
                    </motion.button>

                    {/* Other Regions Card */}
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setSelectedRegion('other')
                        setError(null)
                        handleContinue('other')
                      }}
                      disabled={loading}
                      className={`relative flex flex-col items-start gap-4 p-6 rounded-2xl border-2 transition-all text-left cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                        selectedRegion === 'other'
                          ? 'bg-[#1a2b49] border-[#1a2b49] text-white shadow-lg shadow-slate-900/10'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <Globe className={`w-7 h-7 ${selectedRegion === 'other' ? 'text-white' : 'text-[#E51D53]'}`} />
                      <div>
                        <h3 className={`text-lg font-bold ${selectedRegion === 'other' ? 'text-white' : 'text-[#1a2b49]'}`}>Other Regions</h3>
                        <p className={`text-xs mt-1 leading-relaxed ${selectedRegion === 'other' ? 'text-slate-300' : 'text-slate-500'}`}>
                          More cities & areas coming soon
                        </p>
                      </div>
                    </motion.button>
                  </div>

                  {/* Loading indicator */}
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-center gap-3 p-4 bg-teal-50 border border-teal-100 rounded-xl"
                    >
                      <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
                      <span className="text-sm font-semibold text-teal-700">
                        Redirecting...
                      </span>
                    </motion.div>
                  )}

                  {/* Error message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl"
                    >
                      {error}
                    </motion.div>
                  )}

                  {/* "Other" region message */}
                  {selectedRegion === 'other' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1.5">
                          <p className="text-sm text-slate-700 leading-relaxed">
                            Sorry, we are not serving regions outside of Central Florida. <a href="#" className="text-[#E51D53] font-semibold hover:underline">Join the waitlist here</a>. We hope to be in your area soon and you'll be the first to know!
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="w-full flex flex-col items-center gap-6"
              >
                {/* Step 2 Heading */}
                <div className="text-center">
                  <h1 className="text-[36px] md:text-[44px] font-semibold text-[#1a2b49] leading-[1.15] tracking-tight">
                    Choose your <span className="text-[#E51D53]">listing plan</span>
                  </h1>
                </div>

                {/* Subscription Card mimicking reference image */}
                <div className="w-full max-w-[420px] bg-[#f5f6f8] rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden pt-8">
                  
                  {/* Badge */}
                  <div className="absolute top-0 right-0 bg-[#E51D53] text-white font-bold text-xs uppercase px-4 py-1.5 rounded-bl-2xl shadow-sm tracking-wider">
                    ANNUAL LISTING
                  </div>
                  
                  <h2 className="text-2xl font-bold text-[#1a2b49]">Standard</h2>
                  <p className="text-slate-500 text-sm mt-1">For Space Owners</p>

                  {/* Price */}
                  <div className="mt-4 flex items-end gap-1">
                    <span className="text-5xl font-black text-[#1a2b49] tracking-tight">$120</span>
                    <span className="text-slate-500 font-medium pb-1.5 text-sm">per<br/>year</span>
                  </div>
                  <p className="text-[13px] text-slate-400 mt-1 font-medium">Billed annually</p>

                  {/* Subscribe Button */}
                  <button
                    onClick={handleSubscribe}
                    disabled={(authStatus === 'authenticated' && !checkoutUrl) || prefetching || loading}
                    className="w-full bg-[#E51D53] hover:bg-rose-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl mt-5 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                  >
                    {(authStatus === 'authenticated' && (!checkoutUrl || prefetching)) ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Subscribe'
                    )}
                  </button>

                  <div className="mt-5">
                    <p className="text-slate-700 font-medium mb-3 text-[15px]">This includes:</p>
                    <ul className="space-y-2.5">
                      {features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-slate-200/60 flex items-center justify-center">
                            <Check className="w-3 h-3 text-slate-500 stroke-[3]" />
                          </div>
                          <span className="text-slate-600 text-sm leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={handleBypass}
                    disabled={loading}
                    className="w-full mt-4 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 font-medium py-2 rounded-xl transition-all disabled:opacity-50 text-xs border border-transparent"
                  >
                    Continue without payment (for viewing workflow)
                  </button>

                </div>

                <button
                  onClick={() => {
                    setCurrentStep(1)
                    setError(null)
                  }}
                  disabled={loading}
                  className="text-slate-500 hover:text-[#1a2b49] font-medium transition-colors text-sm"
                >
                  ← Back to region selection
                </button>

                {error && (
                  <div className="w-full max-w-[420px] p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl text-center">
                    {error}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        callbackUrl="/list-your-space?region=orlando"
      />
    </div>
  )
}


export default function ListYourSpacePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ListYourSpacePage />
    </Suspense>
  );
}
