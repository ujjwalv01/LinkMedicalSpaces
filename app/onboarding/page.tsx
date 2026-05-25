'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Stethoscope,
  User,
  Phone,
  FileText,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Compass,
  ShieldCheck,
  Camera,
  Loader2,
} from 'lucide-react'

export default function OnboardingPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()

  const [currentStep, setCurrentStep] = useState(1)
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [profilePhoto, setProfilePhoto] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not signed in, or if already onboarded
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin')
    } else if (status === 'authenticated' && session?.user && (session.user as any).onboarded) {
      router.push('/dashboard')
    }
  }, [status, session, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
      </div>
    )
  }

  const role = session?.user?.role || 'SEEKER'
  const isOwner = role === 'OWNER'

  const steps = isOwner
    ? [
        { id: 1, label: 'Welcome', icon: Stethoscope },
        { id: 2, label: 'Profile Setup', icon: User },
        { id: 3, label: 'Verification', icon: ShieldCheck },
      ]
    : [
        { id: 1, label: 'Welcome', icon: Stethoscope },
        { id: 2, label: 'Profile Setup', icon: User },
        { id: 3, label: 'Explore Spaces', icon: Compass },
      ]

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      setProfilePhoto(data.upload.secureUrl)
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone.trim(),
          bio: bio.trim(),
          image: profilePhoto || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to complete onboarding')

      // Update NextAuth Session to reflect onboarded status
      await update({
        ...session,
        user: {
          ...session?.user,
          image: profilePhoto || session?.user?.image,
          onboarded: true,
        },
      })

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Onboarding failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-lg">
              LinkMedical<span className="text-teal-600">Spaces</span>
            </span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="text-sm font-medium text-slate-500 hover:text-teal-600 transition-colors"
          >
            Skip Onboarding
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="max-w-xl w-full bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col min-h-[500px]">
          {/* Stepper progress indicator */}
          <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center relative">
            <div className="absolute top-1/2 left-[10%] right-[10%] h-[2px] bg-slate-200 -translate-y-1/2 z-0" />
            <div
              className="absolute top-1/2 left-[10%] h-[2px] bg-teal-600 -translate-y-1/2 z-0 transition-all duration-300"
              style={{
                width: `${((currentStep - 1) / 2) * 80}%`,
              }}
            />

            {steps.map((step) => {
              const StepIcon = step.icon
              const isCompleted = currentStep > step.id
              const isActive = currentStep === step.id

              return (
                <div key={step.id} className="flex flex-col items-center z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? 'bg-teal-600 text-white'
                        : isActive
                        ? 'bg-white border-2 border-teal-600 text-teal-600 shadow-md scale-110'
                        : 'bg-white border border-slate-200 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                  </div>
                  <span
                    className={`text-xs font-semibold mt-2 transition-colors duration-300 ${
                      isActive ? 'text-teal-600' : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Form / Steps Body */}
          <div className="p-8 flex-1 flex flex-col justify-between">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                {error}
              </div>
            )}

            <div className="flex-1 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 mb-2">
                      <Stethoscope className="w-10 h-10 animate-pulse" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      Welcome to LinkMedicalSpaces!
                    </h1>
                    <p className="text-slate-600 leading-relaxed text-base">
                      Hi <span className="font-semibold text-teal-600">{session?.user?.name || 'there'}</span>, 
                      we are thrilled to have you here. Let's finish setting up your account so you can fully explore and utilize the platform.
                    </p>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mt-4">
                      <p className="text-xs text-slate-500 font-medium">
                        You registered as a <span className="font-bold text-teal-600">{role === 'OWNER' ? 'Space Owner 🏥' : 'Space Seeker 🔍'}</span>. You can change or view listings in your dashboard.
                      </p>
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Complete Your Profile</h2>
                      <p className="text-sm text-slate-500">
                        Help other medical professionals get to know you.
                      </p>
                    </div>

                    {/* Avatar Upload */}
                    <div className="flex items-center gap-6">
                      <div className="relative w-24 h-24 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                        {profilePhoto ? (
                          <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-10 h-10 text-slate-400" />
                        )}
                        {uploading && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="relative cursor-pointer bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold px-4 py-2 rounded-xl text-sm border border-teal-200 flex items-center gap-2 transition-all">
                          <Camera className="w-4 h-4" />
                          Upload Photo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </label>
                        <p className="text-xs text-slate-400 mt-2">
                          JPG, PNG, or WebP. Max 10MB.
                        </p>
                      </div>
                    </div>

                    {/* Phone Number Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all"
                      />
                    </div>

                    {/* Bio Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        Short Bio <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Tell others about your medical background, medical specialties, or spatial requirements."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all resize-none"
                      />
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && isOwner && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-2">
                      <ShieldCheck className="w-10 h-10 animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Verification Status</h2>
                      <p className="text-slate-600 mt-2 leading-relaxed">
                        Your medical space owner account is currently under review. Our administrative team verifies all licensing documents to ensure high platform compliance.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 font-medium">Review Status:</span>
                        <span className="font-semibold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 text-xs">
                          Under Review
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 font-medium">Uploaded Document:</span>
                        <span className="font-semibold text-slate-700 text-xs flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
                          Received
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 pt-2 border-t border-slate-200">
                        We'll notify you via email at <span className="font-semibold">{session?.user?.email}</span> within 24 hours once verified.
                      </p>
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && !isOwner && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 mb-2">
                      <Compass className="w-10 h-10 animate-bounce" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Start Exploring Spaces</h2>
                      <p className="text-slate-600 mt-2 leading-relaxed">
                        Your profile is ready! You can now look for dental chairs, exam rooms, surgical rooms, and fully equipped medical facilities available near you.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-slate-200 hover:border-teal-500 transition-colors">
                        <h3 className="font-semibold text-slate-800 text-sm">Hourly Rentals</h3>
                        <p className="text-xs text-slate-400 mt-1">Book exam rooms just for hours when you have patients scheduled.</p>
                      </div>
                      <div className="p-4 rounded-xl border border-slate-200 hover:border-teal-500 transition-colors">
                        <h3 className="font-semibold text-slate-800 text-sm">Shared Suites</h3>
                        <p className="text-xs text-slate-400 mt-1">Share clinic resources, reception, and parking costs with other doctors.</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center pt-8 border-t border-slate-100 mt-8">
              <button
                onClick={handleBack}
                disabled={currentStep === 1 || submitting}
                className={`flex items-center gap-2 text-sm font-semibold transition-all ${
                  currentStep === 1
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <button
                onClick={handleNext}
                disabled={uploading || submitting}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-teal-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Finishing...
                  </>
                ) : currentStep === 3 ? (
                  <>
                    Complete Setup
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center">
        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} LinkMedicalSpaces. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
