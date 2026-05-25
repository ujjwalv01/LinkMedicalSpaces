'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Stethoscope, Mail, RefreshCw, CheckCircle2, ArrowLeft } from 'lucide-react'

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 60 // seconds

export default function VerifyOTPPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN)
  const [canResend, setCanResend] = useState(false)
  const [autoSubmitting, setAutoSubmitting] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(OTP_LENGTH).fill(null))

  // ── Countdown timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // ── Auto-submit when all digits filled ──────────────────────────────────
  const submitOTP = useCallback(async (code: string[]) => {
    const full = code.join('')
    if (full.length !== OTP_LENGTH) return
    setAutoSubmitting(true)
    setLoading(true)
    setError('')

    try {
      const result = await signIn('otp', {
        email,
        otp: full,
        redirect: false,
        callbackUrl,
      })

      if (result?.error) {
        setError('Incorrect code. Please check and try again.')
        setOtp(Array(OTP_LENGTH).fill(''))
        inputRefs.current[0]?.focus()
      } else if (result?.ok) {
        setSuccess('Verified! Redirecting you now...')
        setTimeout(() => router.push(callbackUrl), 1000)
      }
    } catch {
      setError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
      setAutoSubmitting(false)
    }
  }, [email, callbackUrl, router])

  // ── Input handlers ───────────────────────────────────────────────────────
  function handleInput(index: number, value: string) {
    // Handle paste
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH)
      const newOtp = [...Array(OTP_LENGTH).fill('')]
      digits.split('').forEach((d, i) => { newOtp[i] = d })
      setOtp(newOtp)
      const nextEmpty = digits.length < OTP_LENGTH ? digits.length : OTP_LENGTH - 1
      inputRefs.current[nextEmpty]?.focus()
      if (digits.length === OTP_LENGTH) submitOTP(newOtp)
      return
    }

    const digit = value.replace(/\D/g, '')
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)
    setError('')

    // Move to next input
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit if complete
    if (newOtp.every((d) => d !== '') && digit) {
      submitOTP(newOtp)
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const newOtp = [...otp]
      if (otp[index]) {
        newOtp[index] = ''
        setOtp(newOtp)
      } else if (index > 0) {
        newOtp[index - 1] = ''
        setOtp(newOtp)
        inputRefs.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Focus first input on mount
  useEffect(() => { inputRefs.current[0]?.focus() }, [])

  // ── Resend OTP ───────────────────────────────────────────────────────────
  async function handleResend() {
    if (!canResend || resendLoading) return
    setResendLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }

      setOtp(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
      setCountdown(RESEND_COOLDOWN)
      setCanResend(false)
    } catch {
      setError('Failed to resend OTP. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  const filledCount = otp.filter((d) => d !== '').length

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-10">
        <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
          <Stethoscope className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-gray-900 text-xl">LinkMedicalSpaces</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        {/* Top accent */}
        <div className="h-1.5 bg-gradient-to-r from-teal-500 to-emerald-500" />

        <div className="p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center"
                >
                  <CheckCircle2 className="w-8 h-8 text-teal-600" />
                </motion.div>
              ) : (
                <motion.div
                  key="mail"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="relative"
                >
                  <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center">
                    <Mail className="w-8 h-8 text-teal-600" />
                  </div>
                  {/* Pulse ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-teal-400"
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {success ? 'Verified!' : 'Check your email'}
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              {success ? (
                'Taking you to your dashboard...'
              ) : (
                <>
                  We sent a 6-digit code to{' '}
                  <span className="font-semibold text-gray-800">{email}</span>.
                  <br />Enter it below to continue.
                </>
              )}
            </p>
          </div>

          {/* OTP Inputs */}
          <div className="flex justify-center gap-3 mb-6">
            {otp.map((digit, i) => (
              <motion.input
                key={i}
                ref={(el) => { inputRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleInput(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onFocus={(e) => e.target.select()}
                disabled={loading || !!success}
                id={`otp-digit-${i + 1}`}
                aria-label={`OTP digit ${i + 1}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all
                  outline-none caret-transparent
                  ${success
                    ? 'border-teal-400 bg-teal-50 text-teal-700'
                    : error
                    ? 'border-red-300 bg-red-50 text-red-600 animate-shake'
                    : digit
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-gray-200 text-gray-900 focus:border-teal-500 focus:bg-teal-50/50'
                  }`}
              />
            ))}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-100 rounded-full h-1 mb-6">
            <motion.div
              className="h-1 bg-teal-500 rounded-full"
              animate={{ width: `${(filledCount / OTP_LENGTH) * 100}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-red-500 text-sm text-center mb-4"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Resend */}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Didn&apos;t receive the code?</p>
            {canResend ? (
              <button
                id="btn-resend-otp"
                onClick={handleResend}
                disabled={resendLoading}
                className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-semibold
                           text-sm mx-auto transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${resendLoading ? 'animate-spin' : ''}`} />
                {resendLoading ? 'Sending...' : 'Resend code'}
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <div className="relative w-8 h-8">
                  <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                    <circle cx="16" cy="16" r="13" fill="none" stroke="#e5e7eb" strokeWidth="2" />
                    <circle
                      cx="16" cy="16" r="13" fill="none" stroke="#0d9488" strokeWidth="2"
                      strokeDasharray={`${(1 - countdown / RESEND_COOLDOWN) * 81.7} 81.7`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-teal-600">
                    {countdown}
                  </span>
                </div>
                <span>Resend in {countdown}s</span>
              </div>
            )}
          </div>

          {/* Back link */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center">
            <Link
              href="/signin"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        </div>
      </motion.div>

      <p className="text-sm text-gray-400 mt-6">
        Having trouble?{' '}
        <Link href="/contact" className="text-teal-600 hover:underline">
          Contact support
        </Link>
      </p>
    </div>
  )
}
