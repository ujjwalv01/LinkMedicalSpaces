'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
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
    } else if (intentParam === 'seeker') {
      setUserType('SEEKER')
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
      setCurrentStep(2)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (currentStep === 2) {
      if (!userType) return
      setCurrentStep(3)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (currentStep === 3) {
      if (!userSubType) return
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
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
      window.location.href = callbackUrl || '/'
    } catch (err: any) {
      setError(err.message || 'Onboarding failed')
    } finally {
      setSubmitting(false)
    }
  }

  const TOTAL_STEPS = 3
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
      <main className={`flex-1 flex flex-col items-center pb-32 px-6 ${currentStep === 1 ? 'justify-center' : 'pt-10'}`}>
        <div className={`w-full animate-in fade-in slide-in-from-bottom-4 duration-500 ${currentStep === 1 ? 'max-w-[1300px]' : 'max-w-2xl space-y-8'}`}>

          {/* ─── Step 1: Welcome ─────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col md:flex-row items-center justify-between gap-10 lg:gap-24 py-10 md:py-20"
              >
                {/* Left Side — Heading */}
                <div className="flex-[1.2] text-left pr-4 lg:pr-10">
                  <h1 className="text-[44px] md:text-[54px] lg:text-[64px] font-semibold text-[#1a2b49] leading-[1.15] tracking-tight">
                    Welcome to Link<br className="hidden lg:block" /> <span className="text-[#E51D53]">Medical</span> Spaces
                  </h1>
                  <p className="text-slate-500 mt-6 leading-relaxed text-[17px] max-w-md">
                    Hi <span className="font-semibold text-[#1a2b49]">{session?.user?.name || 'there'}</span>, we're thrilled to have you here. Let's set up your account so you can get the most out of our platform.
                  </p>
                </div>

                {/* Right Side — Info cards */}
                <div className="flex-1 w-full max-w-[550px] space-y-10 md:space-y-12">
                  <div className="flex gap-6 items-start border-b border-slate-100 pb-10">
                    <div className="text-2xl font-semibold text-[#1a2b49] pt-1">1</div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-semibold text-[#1a2b49]">Choose your role</h3>
                      <p className="text-slate-500 mt-3 leading-relaxed text-[17px]">Tell us whether you want to list your medical space or find one to rent.</p>
                    </div>
                  </div>

                  <div className="flex gap-6 items-start border-b border-slate-100 pb-10">
                    <div className="text-2xl font-semibold text-[#1a2b49] pt-1">2</div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-semibold text-[#1a2b49]">Tell us about yourself</h3>
                      <p className="text-slate-500 mt-3 leading-relaxed text-[17px]">Select your professional background so we can personalize your experience.</p>
                    </div>
                  </div>

                  <div className="flex gap-6 items-start">
                    <div className="text-2xl font-semibold text-[#1a2b49] pt-1">3</div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-semibold text-[#1a2b49]">Start exploring</h3>
                      <p className="text-slate-500 mt-3 leading-relaxed text-[17px]">You're all set! Begin listing your space or searching for the perfect office.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── Step 2: User Type ───────────────────────────────────────── */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-[#1a2b49]">What brings you here?</h1>
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

            {/* ─── Step 3: Sub-Type ────────────────────────────────────────── */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-[#1a2b49]">Tell us more about you</h1>
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
        {currentStep > 1 && (
          <div className="h-1.5 w-full bg-slate-100 absolute top-0 left-0">
            <div
              className="h-full bg-[#1a2b49] transition-all duration-300 ease-in-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        <div className={`flex items-center px-8 py-4 ${currentStep === 1 ? 'justify-end' : 'justify-between'}`}>
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="font-semibold text-[#1a2b49] hover:bg-slate-100 px-5 py-2.5 rounded-lg transition-colors"
            >
              <u className="no-underline">Back</u>
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={submitting || (currentStep === 2 && !userType) || (currentStep === 3 && !userSubType)}
            className={`font-bold text-white px-8 py-3.5 rounded-lg transition-all active:scale-95 flex items-center gap-2 ${
              currentStep === 1 ? 'bg-[#E51D53] hover:bg-rose-600' :
              currentStep === 3 ? 'bg-[#E51D53] hover:bg-rose-600' :
              'bg-[#1a2b49] hover:bg-[#0f1d33]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {currentStep === 1 ? 'Get Started' : currentStep === 3 ? 'Complete Setup' : 'Next'}
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
