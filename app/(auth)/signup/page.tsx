'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Stethoscope, Mail, Lock, Eye, EyeOff, User, Building2,
  Search, ArrowRight, CheckCircle2, Upload, FileText, X
} from 'lucide-react'

type Role = 'SEEKER' | 'OWNER'

export default function SignUpPage() {
  const router = useRouter()

  const [step, setStep] = useState<1 | 2>(1)
  const [role, setRole] = useState<Role | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    mciNumber: '',
    documentFile: null as File | null,
    acceptedTerms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [dragOver, setDragOver] = useState(false)

  function handleChange(key: keyof typeof form, value: string | boolean | File | null) {
    setForm((f) => ({ ...f, [key]: value }))
    setError('')
  }

  // ── Google sign up ───────────────────────────────────────────────────────
  async function handleGoogle() {
    setGoogleLoading(true)
    await signIn('google', { callbackUrl: '/onboarding' })
  }

  // ── File drop ────────────────────────────────────────────────────────────
  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      handleChange('documentFile', file)
    } else {
      setError('Please upload a JPG, PNG, or PDF file.')
    }
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!role) { setError('Please select your role'); return }
    if (!form.acceptedTerms) { setError('Please accept the terms and conditions'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }

    setLoading(true); setError('')

    try {
      // Upload document if provided
      let documentUrl: string | undefined
      if (form.documentFile && role === 'OWNER') {
        const formData = new FormData()
        formData.append('file', form.documentFile)
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
        const uploadData = await uploadRes.json()
        if (uploadRes.ok) documentUrl = uploadData.upload?.secureUrl
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role,
          mciNumber: form.mciNumber || undefined,
          documentUrl,
          acceptedTerms: form.acceptedTerms,
        }),
      })

      const data = await res.json()
      if (!res.ok) { setError(data.error); return }

      setSuccess(data.message)

      // Auto sign in
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      })

      if (result?.ok) {
        setTimeout(() => router.push(role === 'OWNER' ? '/dashboard' : '/search'), 1500)
      }
    } catch {
      setError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isStep1Complete = role !== null
  const isStep2Complete = form.name && form.email && form.password && form.acceptedTerms

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">LinkMedicalSpaces</span>
          </Link>
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/signin" className="text-teal-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          {/* Progress */}
          <div className="flex items-center gap-3 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    s < step
                      ? 'bg-teal-600 text-white'
                      : s === step
                      ? 'bg-teal-600 text-white ring-4 ring-teal-100'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                <span className={`text-sm font-medium ${s === step ? 'text-gray-900' : 'text-gray-400'}`}>
                  {s === 1 ? 'Choose Your Role' : 'Your Details'}
                </span>
                {s < 2 && <div className="w-12 h-px bg-gray-200 mx-1" />}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <AnimatePresence mode="wait">
              {/* ── STEP 1: Role Selection ───────────────────────────────── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.25 }}
                  className="p-8"
                >
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">How will you use LinkMedicalSpaces?</h1>
                  <p className="text-gray-500 mb-8">Choose the option that best describes you.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    {/* Space Owner */}
                    <button
                      id="role-owner"
                      onClick={() => setRole('OWNER')}
                      className={`relative p-6 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-md ${
                        role === 'OWNER'
                          ? 'border-teal-500 bg-teal-50 shadow-md'
                          : 'border-gray-200 hover:border-teal-300 bg-white'
                      }`}
                    >
                      {role === 'OWNER' && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-teal-600 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center text-2xl
                        ${role === 'OWNER' ? 'bg-teal-100' : 'bg-gray-100'}`}>
                        🏥
                      </div>
                      <h3 className="font-bold text-gray-900 text-base mb-1">Space Owner</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        Doctor, clinic, or facility owner — list and monetize your medical space
                      </p>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {['List spaces', 'Set prices', 'Manage bookings'].map((f) => (
                          <span key={f} className={`text-xs px-2 py-1 rounded-full font-medium
                            ${role === 'OWNER' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'}`}>
                            {f}
                          </span>
                        ))}
                      </div>
                    </button>

                    {/* Space Seeker */}
                    <button
                      id="role-seeker"
                      onClick={() => setRole('SEEKER')}
                      className={`relative p-6 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-md ${
                        role === 'SEEKER'
                          ? 'border-teal-500 bg-teal-50 shadow-md'
                          : 'border-gray-200 hover:border-teal-300 bg-white'
                      }`}
                    >
                      {role === 'SEEKER' && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-teal-600 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center text-2xl
                        ${role === 'SEEKER' ? 'bg-teal-100' : 'bg-gray-100'}`}>
                        🔍
                      </div>
                      <h3 className="font-bold text-gray-900 text-base mb-1">Space Seeker</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        Medical professional looking to find and book the perfect space
                      </p>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {['Browse listings', 'Book spaces', 'Save favorites'].map((f) => (
                          <span key={f} className={`text-xs px-2 py-1 rounded-full font-medium
                            ${role === 'SEEKER' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'}`}>
                            {f}
                          </span>
                        ))}
                      </div>
                    </button>
                  </div>

                  {/* Quick Google option */}
                  <div className="border-t border-gray-100 pt-6">
                    <p className="text-sm text-gray-500 mb-3 text-center">Or sign up quickly with:</p>
                    <button
                      id="btn-google-signup-step1"
                      onClick={handleGoogle}
                      disabled={googleLoading}
                      className="w-full flex items-center justify-center gap-3 border-2 border-gray-200
                                 hover:border-gray-300 hover:bg-gray-50 py-3 rounded-xl font-semibold
                                 text-gray-700 transition-all active:scale-95"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Continue with Google
                    </button>
                  </div>

                  <button
                    id="btn-step1-next"
                    onClick={() => { if (!role) { setError('Please select a role'); return }; setStep(2) }}
                    disabled={!isStep1Complete}
                    className="w-full mt-6 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-200
                               disabled:text-gray-400 text-white font-semibold py-3.5 rounded-xl
                               transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>

                  {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}
                </motion.div>
              )}

              {/* ── STEP 2: Details ──────────────────────────────────────── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25 }}
                  className="p-8"
                >
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
                  >
                    ← Back to role selection
                  </button>

                  {/* Role badge */}
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-2xl">{role === 'OWNER' ? '🏥' : '🔍'}</span>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {role === 'OWNER' ? 'Space Owner Registration' : 'Space Seeker Registration'}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {role === 'OWNER'
                          ? 'List your medical space and reach thousands of practitioners'
                          : 'Find the perfect medical space for your practice'}
                      </p>
                    </div>
                  </div>

                  {/* Error / Success */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl flex items-center gap-2"
                      >
                        <X className="w-4 h-4 shrink-0" />
                        {error}
                      </motion.div>
                    )}
                    {success && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="mb-4 p-3 bg-teal-50 border border-teal-200 text-teal-700 text-sm rounded-xl flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        {success}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => handleChange('name', e.target.value)}
                          placeholder="Dr. Jane Smith"
                          required
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm
                                     focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          placeholder="doctor@example.com"
                          required
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm
                                     focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={form.password}
                          onChange={(e) => handleChange('password', e.target.value)}
                          placeholder="Min. 8 characters"
                          required
                          className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl text-sm
                                     focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {/* Password strength indicator */}
                      {form.password && (
                        <div className="flex gap-1 mt-2">
                          {[...Array(4)].map((_, i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                form.password.length >= (i + 1) * 2
                                  ? i < 2 ? 'bg-red-400' : i < 3 ? 'bg-yellow-400' : 'bg-teal-500'
                                  : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Owner-specific fields */}
                    <AnimatePresence>
                      {role === 'OWNER' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 border-t border-dashed border-teal-200 pt-4"
                        >
                          <p className="text-sm font-semibold text-teal-700 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Space Owner Verification
                          </p>

                          {/* MCI Number */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              MCI / License Number <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                            <div className="relative">
                              <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                value={form.mciNumber}
                                onChange={(e) => handleChange('mciNumber', e.target.value)}
                                placeholder="e.g. MCI-12345"
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm
                                           focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                              />
                            </div>
                          </div>

                          {/* Document Upload */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              License / Certificate <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                            <div
                              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                              onDragLeave={() => setDragOver(false)}
                              onDrop={handleDrop}
                              className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                                dragOver
                                  ? 'border-teal-400 bg-teal-50'
                                  : form.documentFile
                                  ? 'border-teal-400 bg-teal-50'
                                  : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="file"
                                id="doc-upload"
                                accept=".jpg,.jpeg,.png,.pdf"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleChange('documentFile', file)
                                }}
                              />
                              {form.documentFile ? (
                                <div className="flex items-center justify-center gap-2">
                                  <CheckCircle2 className="w-5 h-5 text-teal-600" />
                                  <span className="text-sm text-teal-700 font-medium">{form.documentFile.name}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); handleChange('documentFile', null) }}
                                    className="text-gray-400 hover:text-red-500 ml-1"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                  <p className="text-sm text-gray-500">
                                    Drag & drop or <span className="text-teal-600 font-medium">browse</span>
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF up to 10MB</p>
                                </>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Terms */}
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative mt-0.5">
                        <input
                          type="checkbox"
                          checked={form.acceptedTerms}
                          onChange={(e) => handleChange('acceptedTerms', e.target.checked)}
                          className="sr-only"
                          id="terms-checkbox"
                        />
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          form.acceptedTerms
                            ? 'bg-teal-600 border-teal-600'
                            : 'border-gray-300 group-hover:border-teal-400'
                        }`}>
                          {form.acceptedTerms && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                      <span className="text-sm text-gray-600 leading-relaxed">
                        I agree to the{' '}
                        <Link href="/terms" className="text-teal-600 hover:underline font-medium">Terms of Service</Link>
                        {' '}and{' '}
                        <Link href="/privacy" className="text-teal-600 hover:underline font-medium">Privacy Policy</Link>
                        {role === 'OWNER' && (
                          <>, including the Owner Verification requirements</>
                        )}
                      </span>
                    </label>

                    <button
                      id="btn-submit-signup"
                      type="submit"
                      disabled={loading || !isStep2Complete}
                      className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-200 disabled:text-gray-400
                                 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center
                                 justify-center gap-2 active:scale-95"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          {role === 'OWNER' ? 'Create Owner Account' : 'Create My Account'}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/signin" className="text-teal-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
