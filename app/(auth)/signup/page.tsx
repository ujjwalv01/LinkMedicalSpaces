'use client'

import { useState, useEffect } from 'react'
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

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  
  const [showPassword, setShowPassword] = useState(false)
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

  // ── Handle Password Sign Up ───────────────────────────────────────────────
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !email || !password) { setErrorMsg('Please fill in all fields'); return }
    if (!acceptedTerms) { setErrorMsg('Please accept the Terms of Service'); return }
    if (password.length < 8) { setErrorMsg('Password must be at least 8 characters'); return }

    setLoading(true); setErrorMsg('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role: 'OWNER', // Default to OWNER so they can list spaces without a separate upgrade step
          acceptedTerms,
        }),
      })

      const data = await res.json()
      if (!res.ok) { setErrorMsg(data.error); return }

      setSuccessMsg('Account created successfully! Signing you in...')

      // Auto sign in
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.ok) {
        setTimeout(() => router.push(callbackUrl), 1500)
      } else {
        setErrorMsg('Failed to sign in automatically. Please sign in manually.')
      }
    } catch {
      setErrorMsg('Registration failed. Please try again.')
    } finally {
      setLoading(false)
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
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Create an account</h2>
            <p className="text-gray-500 mt-2">Join thousands of medical professionals</p>
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

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 border-2 border-gray-200
                       hover:border-gray-300 hover:bg-gray-50 py-3 rounded-xl font-semibold
                       text-gray-700 transition-all duration-200 active:scale-95 mb-6"
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
                Continue with Google
              </>
            )}
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">OR EMAIL</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. Jane Smith"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm
                             focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm
                             focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
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
            </div>

            <label className="flex items-start gap-3 cursor-pointer group mt-2">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  acceptedTerms ? 'bg-teal-600 border-teal-600' : 'border-gray-300 group-hover:border-teal-400'
                }`}>
                  {acceptedTerms && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
              </div>
              <span className="text-sm text-gray-600 leading-relaxed">
                I agree to the <Link href="/terms" className="text-teal-600 hover:underline font-medium">Terms of Service</Link> and <Link href="/privacy" className="text-teal-600 hover:underline font-medium">Privacy Policy</Link>.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !email || !password || !name || !acceptedTerms}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white
                         font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}
