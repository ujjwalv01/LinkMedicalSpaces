'use client'

import {  useState, useEffect , Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Stethoscope, Mail, Lock, Eye, EyeOff, ArrowRight,
  CheckCircle2, Star, ChevronLeft, ChevronRight, User
} from 'lucide-react'

// ─── Testimonials for left panel ─────────────────────────────────────────────
const testimonials = [
  {
    quote: "Found my perfect exam room within 48 hours of signing up. The process was incredibly smooth — truly the Airbnb of medical spaces.",
    author: "Dr. Sarah Chen",
    title: "Cardiologist · Orlando, FL",
    avatar: "SC",
    color: "from-teal-400 to-cyan-500",
  },
  {
    quote: "As a clinic owner, I was able to sublet my unused space and generate $2,400/month in passive income. Highly recommend for any practice owner.",
    author: "Dr. Marcus Johnson",
    title: "Family Medicine · Miami, FL",
    avatar: "MJ",
    color: "from-emerald-400 to-teal-500",
  },
  {
    quote: "The verification process gave me confidence that only licensed professionals could book my space. It's professional, secure, and fast.",
    author: "Dr. Priya Patel",
    title: "Dermatologist · Tampa, FL",
    avatar: "PP",
    color: "from-cyan-400 to-blue-500",
  },
]

// ─── Stats ────────────────────────────────────────────────────────────────────
const stats = [
  { value: '2,400+', label: 'Listed Spaces' },
  { value: '8,500+', label: 'Medical Pros' },
  { value: '98%', label: 'Satisfaction' },
]

function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  
  const [testimonialIdx, setTestimonialIdx] = useState(0)

  // Auto-cycle testimonials
  useEffect(() => {
    const t = setInterval(() => {
      setTestimonialIdx((i) => (i + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(t)
  }, [])

  // ── Handle OTP Sign Up ───────────────────────────────────────────────
  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault()
    if (!email) { setErrorMsg('Please enter your email'); return }

    setLoading(true); setErrorMsg('')

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()
      if (!res.ok) { setErrorMsg(data.error || 'Failed to send OTP'); return }

      setSuccessMsg('OTP sent to your email!')
      setStep('otp')
    } catch {
      setErrorMsg('Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault()
    if (!otp || otp.length !== 6) { setErrorMsg('Please enter the 6-digit OTP'); return }

    setLoading(true); setErrorMsg('')

    const result = await signIn('otp', {
      email, otp, redirect: false, callbackUrl,
    })
    
    setLoading(false)
    if (result?.error) {
      setErrorMsg('Invalid or expired OTP.')
    } else {
      window.location.href = callbackUrl
    }
  }

  // ── Handle Google ─────────────────────────────────────────────────────────
  async function handleGoogle() {
    setGoogleLoading(true)
    await signIn('google', { callbackUrl })
  }

  const testimonial = testimonials[testimonialIdx]

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL ─────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800" />

        {/* Decorative circles */}
        <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-white/5" />
        <div className="absolute bottom-[-150px] left-[-80px] w-[500px] h-[500px] rounded-full bg-white/5" />
        <div className="absolute top-1/3 right-20 w-[200px] h-[200px] rounded-full bg-teal-500/20" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">LinkMedicalSpaces</span>
          </div>

          {/* Main heading */}
          <div className="mt-16">
            <h1 className="text-4xl font-bold text-white leading-tight">
              The Airbnb for<br />
              <span className="text-teal-200">Medical Offices</span>
            </h1>
            <p className="mt-4 text-teal-100 text-lg leading-relaxed">
              Find, list, and book medical spaces with confidence.
              Purpose-built for healthcare professionals.
            </p>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur rounded-2xl p-4">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-teal-200 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="mt-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={testimonialIdx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-white/90 text-sm leading-relaxed italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center`}>
                    <span className="text-white font-bold text-sm">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{testimonial.author}</p>
                    <p className="text-teal-200 text-xs">{testimonial.title}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Testimonial nav dots */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => setTestimonialIdx((i) => (i - 1 + testimonials.length) % testimonials.length)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setTestimonialIdx(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === testimonialIdx ? 'bg-white w-6' : 'bg-white/40'}`}
                    aria-label={`Testimonial ${i + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={() => setTestimonialIdx((i) => (i + 1) % testimonials.length)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — FORM ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 bg-white overflow-y-auto">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">LinkMedicalSpaces</span>
          </div>

          {/* Header */}
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Create an account</h2>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
            <button
              onClick={() => router.push(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`)}
              className="flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 text-gray-500 hover:text-gray-700"
            >
              Sign In
            </button>
            <button
              className="flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 bg-white text-gray-900 shadow-sm"
            >
              Sign Up
            </button>
          </div>

          {/* Error / Success */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl"
              >
                {errorMsg}
              </motion.div>
            )}
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-teal-50 border border-teal-200 text-teal-700 text-sm rounded-xl flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {successMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {step === 'email' ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Enter your email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <p className="text-sm text-gray-500 py-1">
                We&apos;ll email you 6 digit OTP for a password-free sign in.
              </p>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-[#ec6f93] hover:bg-[#d85e82] disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 shadow-sm"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Continue'
                )}
              </button>

              <div className="flex items-center gap-3 py-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium tracking-wider uppercase">OR</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 py-3 rounded-xl font-semibold text-gray-700 transition-all active:scale-95 shadow-sm"
                >
                  {googleLoading ? (
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Google
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-[#ec6f93] hover:bg-[#d85e82] disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 shadow-sm"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Verify & Sign In'
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full text-sm text-gray-500 hover:text-gray-800 py-2 transition-colors mt-2"
              >
                ← Back to email
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}


export default function SignUpPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignUpPage />
    </Suspense>
  );
}
