'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowLeft, HelpCircle } from 'lucide-react'

export default function SubscriptionCancelPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center space-y-6"
      >
        <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Checkout Cancelled
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
            Your payment session was cancelled. No charges were made to your card.
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-500 text-xs text-left flex gap-3">
          <HelpCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Need assistance or have questions about listing pricing? Contact our listing support team at <span className="font-semibold text-teal-600">support@linkmedicalspaces.com</span>.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push('/pricing')}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-teal-600/25 active:scale-98 transition-all text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Pricing
          </button>
          
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-2xl active:scale-98 transition-all text-sm"
          >
            Go to Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  )
}
