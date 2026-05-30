'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { MapPin, Loader2, Info, Globe, ArrowRight } from 'lucide-react'

import AuthModal from '@/components/AuthModal'

function ListYourSpacePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status: authStatus } = useSession()

  const [selectedRegion, setSelectedRegion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

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
      router.push('/pricing')
    }
  }

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

      {/* Main Content — split layout */}
      <main className="flex-1 flex items-center justify-center px-6 py-10 md:py-0">
        <div className="w-full max-w-[1300px] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10 lg:gap-24 py-10 md:py-20">

            {/* Left Side — Heading */}
            <div className="flex-[1.2] text-left pr-4 lg:pr-10">
              <h1 className="text-[44px] md:text-[54px] lg:text-[64px] font-semibold text-[#1a2b49] leading-[1.15] tracking-tight">
                Where do you<br className="hidden lg:block" /> want to <span className="text-[#E51D53]">list</span> your space?
              </h1>
              <p className="text-slate-500 mt-6 leading-relaxed text-[17px] max-w-md">
                Select your listing region to get started. We're expanding to new areas soon.
              </p>
            </div>

            {/* Right Side — Region selection cards */}
            <div className="flex-1 w-full max-w-[550px] space-y-6">
              <p className="text-2xl font-bold text-[#1a2b49] tracking-wide mb-2">Select your region</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Orlando Area Card */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setSelectedRegion('orlando')
                    setError(null)
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
                    Redirecting to secure checkout...
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
                      <p className="text-sm font-bold text-slate-800">
                        Other regions coming soon
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        We're currently accepting listings in the Orlando area.
                        Support for additional regions is launching soon.
                        Stay tuned for updates!
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons for Orlando */}
              {selectedRegion === 'orlando' && !loading && !error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 pt-2"
                >
                  <button
                    onClick={() => handleContinue()}
                    disabled={loading}
                    className="w-full bg-[#1a2b49] hover:bg-[#0f1d33] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </div>

          </div>
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
