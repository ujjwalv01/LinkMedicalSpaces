'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Stethoscope,
  Building,
  Search,
  Users,
  Briefcase,
  ArrowRight,
  Loader2,
} from 'lucide-react'

// Reusable Airbnb-style choice box (same pattern as add-listing)
const ChoiceBox = ({ label, description, icon: Icon, selected, onClick }: {
  label: string
  description?: string
  icon: any
  selected: boolean
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-col justify-between items-start text-left rounded-2xl border-2 transition-all p-6 h-44 ${
      selected
        ? 'border-[#1a2b49] bg-[#1a2b49] shadow-lg ring-1 ring-[#1a2b49]'
        : 'border-slate-200 hover:border-slate-400 bg-white'
    }`}
  >
    <Icon className={`w-9 h-9 ${selected ? 'text-white' : 'text-[#E51D53]'}`} />
    <div>
      <span className={`font-bold text-lg block ${selected ? 'text-white' : 'text-[#1a2b49]'}`}>{label}</span>
      {description && (
        <span className={`text-xs mt-1 block leading-relaxed ${selected ? 'text-slate-300' : 'text-slate-500'}`}>{description}</span>
      )}
    </div>
  </button>
)

function OnboardingPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const intentParam = searchParams.get('intent') // 'lister' | 'seeker' | null
  const callbackUrl = searchParams.get('callbackUrl') // original destination

  const [currentStep, setCurrentStep] = useState(1)
  const [userType, setUserType] = useState<'OWNER' | 'SEEKER' | null>(null)
  const [userSubType, setUserSubType] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-select user type based on intent param
  useEffect(() => {
    if (intentParam === 'lister') {
      setUserType('OWNER')
      setCurrentStep(2)
    } else if (intentParam === 'seeker') {
      setUserType('SEEKER')
      setCurrentStep(2)
    } else {
      setCurrentStep(1)
    }
  }, [intentParam])

  // Redirect if not signed in, or if already onboarded
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin')
    } else if (status === 'authenticated' && session?.user && (session.user as any).onboarded) {
      router.push(callbackUrl || '/')
    }
  }, [status, session, router, callbackUrl])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#1a2b49] animate-spin" />
      </div>
    )
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (!userType) return
      setCurrentStep(2)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (currentStep === 2) {
      if (!userSubType) return
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep > 1 && !intentParam) {
      setCurrentStep(prev => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSubmit = async () => {
    if (!userType || !userSubType) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userType, userSubType }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to complete onboarding')

      // Tell NextAuth to refresh the token from the DB
      await update()

      // Perform a hard redirect to ensure fresh server state
      if (callbackUrl) {
        window.location.href = callbackUrl
      } else {
        if (userType === 'OWNER') {
          window.location.href = '/list-your-space'
        } else {
          window.location.href = '/search-spaces'
        }
      }
    } catch (err: any) {
      if (err.message === 'USER_NOT_FOUND') {
        // The user's JWT cookie exists, but they were deleted from the database.
        // Force a sign out and send them to signup.
        await signOut({ redirect: false })
        router.push('/signup')
        return
      }
      setError(err.message || 'Onboarding failed')
    } finally {
      setSubmitting(false)
    }
  }

  const TOTAL_STEPS = 2
  const progressPercent = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans overflow-x-hidden">
      {/* Top Header — minimal like add-listing */}
      <header className="flex justify-between items-center px-6 py-4 bg-white border-b border-slate-100 z-50">
        <img src="/logo-new.png" alt="Logo" className="h-8 w-auto object-contain cursor-pointer" onClick={() => router.push('/')} />
        <button
          onClick={() => router.push('/')}
          className="px-5 py-2 rounded-full text-sm font-semibold bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 transition-colors shadow-sm"
        >
          Exit
        </button>
      </header>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col items-center pb-32 px-6 pt-10`}>
        <div className={`w-full animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl space-y-8`}>

          <AnimatePresence mode="wait">
            {/* ─── Step 1: User Type ───────────────────────────────────────── */}
            {currentStep === 1 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                {!intentParam && (
                  <div className="mb-10 text-center sm:text-left">
                    <h1 className="text-4xl md:text-[44px] font-semibold text-[#1a2b49] leading-tight tracking-tight">
                      Welcome to Link <span className="text-[#E51D53]">Medical</span> Spaces
                    </h1>
                  </div>
                )}
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-[#1a2b49]">What brings you here?</h2>
                  <p className="text-slate-500">Select the option that best describes you.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ChoiceBox
                    label="List My Space"
                    description="I have a medical space and I want to lease or sublet it."
                    icon={Building}
                    selected={userType === 'OWNER'}
                    onClick={() => setUserType('OWNER')}
                  />
                  <ChoiceBox
                    label="Find a Space"
                    description="I'm looking for a medical office, exam room, or clinic to rent."
                    icon={Search}
                    selected={userType === 'SEEKER'}
                    onClick={() => setUserType('SEEKER')}
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl">
                    {error}
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── Step 2: Sub-Type ────────────────────────────────────────── */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                {intentParam && (
                  <div className="mb-10 text-center sm:text-left">
                    <h1 className="text-4xl md:text-[44px] font-semibold text-[#1a2b49] leading-tight tracking-tight">
                      Welcome to Link <span className="text-[#E51D53]">Medical</span> Spaces
                    </h1>
                  </div>
                )}
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-[#1a2b49]">Tell us more about you</h2>
                  <p className="text-slate-500">Select your professional background.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <ChoiceBox
                    label="Doctor"
                    description="Licensed physician (MD/DO) or dentist."
                    icon={Stethoscope}
                    selected={userSubType === 'Doctor'}
                    onClick={() => setUserSubType('Doctor')}
                  />
                  <ChoiceBox
                    label="Staff"
                    description="Office manager, nurse, or administrative staff."
                    icon={Users}
                    selected={userSubType === 'Staff'}
                    onClick={() => setUserSubType('Staff')}
                  />
                  <ChoiceBox
                    label="Real Estate Agent"
                    description="Licensed broker or real estate professional."
                    icon={Briefcase}
                    selected={userSubType === 'Real Estate Agent'}
                    onClick={() => setUserSubType('Real Estate Agent')}
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl">
                    {error}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>

      {/* Bottom Navigation Bar — same style as add-listing */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-slate-100 absolute top-0 left-0">
          <div
            className="h-full bg-[#1a2b49] transition-all duration-300 ease-in-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className={`flex items-center px-8 py-4 ${!(currentStep > 1 && !intentParam) ? 'justify-end' : 'justify-between'}`}>
          {(currentStep > 1 && !intentParam) && (
            <button
              onClick={handleBack}
              className="font-semibold text-[#1a2b49] hover:bg-slate-100 px-5 py-2.5 rounded-lg transition-colors"
            >
              <u className="no-underline">Back</u>
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={submitting || (currentStep === 1 && !userType) || (currentStep === 2 && !userSubType)}
            className={`font-bold text-white px-8 py-3.5 rounded-lg transition-all active:scale-95 flex items-center gap-2 ${
              currentStep === 2 ? 'bg-[#E51D53] hover:bg-rose-600' : 'bg-[#1a2b49] hover:bg-[#0f1d33]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {!submitting && (currentStep === 2 ? (userType === 'OWNER' ? 'List Your First Space' : 'Find Your Medical Office') : 'Next')}
            {!submitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </footer>
    </div>
  )
}

export default function OnboardingPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 text-[#1a2b49] animate-spin" /></div>}>
      <OnboardingPage />
    </Suspense>
  )
}
