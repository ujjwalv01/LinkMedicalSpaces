'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, User, X } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  callbackUrl?: string
}

export default function AuthModal({ isOpen, onClose, callbackUrl = '/dashboard' }: AuthModalProps) {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  
  // Form fields
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  if (!isOpen) return null

  const handleGoogle = async () => {
    setGoogleLoading(true)
    await signIn('google', { callbackUrl })
  }

  const handleSendOTP = async (e: React.FormEvent) => {
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

  const handleVerifyOTP = async (e: React.FormEvent) => {
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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pt-4 pb-20 sm:p-0">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 z-10 max-h-[90vh] overflow-y-auto"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-slate-400">
              {tab === 'signup' ? 'Create an account' : 'Sign in to your account'}
            </h2>
          </div>

          {/* Tabs */}
          {step === 'email' && (
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
              <button
                onClick={() => { setTab('signin'); setErrorMsg(''); setSuccessMsg('') }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  tab === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Sign in
              </button>
              <button
                onClick={() => { setTab('signup'); setErrorMsg(''); setSuccessMsg('') }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  tab === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Sign up
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
                {errorMsg}
              </motion.div>
            )}
            {successMsg && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 p-3 bg-teal-50 border border-teal-200 text-teal-700 text-sm rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {successMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {step === 'email' ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-700 mb-1.5">Enter your email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <p className="text-sm text-slate-500 py-1">
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
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs text-slate-500 font-medium tracking-wider">OR</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 py-3 rounded-xl font-semibold text-slate-700 transition-all active:scale-95 shadow-sm"
                >
                  {googleLoading ? (
                    <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
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
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-center text-xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-mono"
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
                className="w-full text-sm text-slate-500 hover:text-slate-800 py-2 transition-colors mt-2"
              >
                ← Back to email
              </button>
            </form>
          )}

          <p className="text-[11px] text-slate-500 text-center mt-5">
            By continuing, you agree to our <a href="/terms" className="text-teal-600 hover:underline">Terms of Service</a> and <a href="/privacy" className="text-teal-600 hover:underline">Privacy Policy</a>
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
