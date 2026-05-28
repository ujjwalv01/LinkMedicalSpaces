'use client'

import {  useState, useEffect , Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Building, ChevronDown, MapPin, Loader2, Info } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

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
      handleContinue()
    }
  }, [searchParams, authStatus, selectedRegion, loading])

  const handleContinue = async () => {
    if (!selectedRegion) return
    setError(null)

    if (selectedRegion === 'other') {
      return
    }

    if (selectedRegion === 'orlando') {
      // Check if user is authenticated
      if (authStatus !== 'authenticated') {
        setShowAuthModal(true)
        return
      }

      // Check subscription status — redirect to Stripe if needed
      setLoading(true)
      try {
        const res = await fetch('/api/subscriptions/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })

        const data = await res.json()

        if (!res.ok) {
          // If user already has active subscription, go directly to form
          if (res.status === 400 && data.error?.includes('already')) {
            router.push('/add-listing?region=orlando')
            return
          }
          throw new Error(data.error || 'Failed to start checkout')
        }

        if (data.url) {
          window.location.href = data.url
        } else {
          // No checkout URL means subscription may already be active
          router.push('/add-listing?region=orlando')
        }
      } catch (err: any) {
        // If the error suggests they're already subscribed, send them to the form
        setError(err.message || 'Something went wrong. Please try again.')
        setLoading(false)
      }
    }
  }

  // Effect to automatically continue if they successfully log in via the modal
  // but remain on this page (e.g., credentials login doesn't do a full page reload if we don't want to)
  // Actually, our AuthModal uses window.location.href to reload/redirect, so it will reload the page.

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Navbar />

      {/* Hero Header */}
      <section className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-100 pt-12 pb-8 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-teal-600">
            List Your Space
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            It's easy to get started on<br />Link Medical Spaces
          </h1>
          <p className="text-slate-500 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Share some basic info, choose a listing plan and publish your space.
          </p>
        </div>
      </section>

      {/* Region Selection */}
      <section className="flex-1 flex items-start justify-center pt-12 sm:pt-20 pb-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md space-y-6"
        >
          {/* Dropdown */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">
              Select Your Listing Region
            </label>
            <div className="relative">
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                disabled={loading}
                className="w-full appearance-none bg-white border-2 border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="" disabled>Select Your Listing Region</option>
                <option value="orlando">Orlando Area</option>
                <option value="other">Other</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Loading indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
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
              className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
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

          {/* Orlando area info hint */}
          {selectedRegion === 'orlando' && !loading && !error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 bg-teal-50/50 border border-teal-100 rounded-xl"
            >
              <MapPin className="w-4.5 h-4.5 text-teal-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-teal-700 leading-relaxed font-medium">
                Orlando Area listings include Orange County, Seminole County, Osceola County, and surrounding metro areas.
              </p>
            </motion.div>
          )}

          {/* Action Buttons */}
          {selectedRegion === 'orlando' && !loading && !error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 pt-2"
            >
              <button
                onClick={handleContinue}
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-teal-600/20"
              >
                Continue to Checkout
              </button>
              
              <button
                onClick={() => router.push('/add-listing?region=orlando')}
                disabled={loading}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl transition-all border border-slate-200 border-dashed"
              >
                Continue without checkout (for viewing workflow)
              </button>
            </motion.div>
          )}
        </motion.div>
      </section>

      <Footer />

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
