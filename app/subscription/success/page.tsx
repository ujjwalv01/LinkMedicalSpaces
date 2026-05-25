'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight, Sparkles, Building } from 'lucide-react'

// Generate list of random confetti pieces
const generateConfetti = (count = 80) => {
  const colors = ['#0D9488', '#0EA5E9', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899']
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    x: Math.random() * 100, // random start horizontal %
    y: -20 - Math.random() * 30, // random start offset above viewport
    size: 6 + Math.random() * 10,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 3,
    duration: 3 + Math.random() * 4,
    rotation: Math.random() * 360,
  }))
}

export default function SubscriptionSuccessPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [confetti, setConfetti] = useState<any[]>([])

  useEffect(() => {
    setConfetti(generateConfetti(100))

    // Force NextAuth session refresh to fetch updated subscription status from DB
    const refreshSession = async () => {
      try {
        await update()
      } catch (err) {
        console.error('Failed to update session:', err)
      }
    }
    refreshSession()
  }, [update])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Confetti Animation Elements */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {confetti.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{
              x: `${particle.x}vw`,
              y: `${particle.y}vh`,
              rotate: particle.rotation,
              opacity: 0.9,
            }}
            animate={{
              y: '110vh',
              rotate: particle.rotation + 720,
              x: `${particle.x + (Math.random() * 20 - 10)}vw`,
              opacity: 0,
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              ease: 'linear',
              repeat: Infinity,
            }}
            style={{
              position: 'absolute',
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            }}
          />
        ))}
      </div>

      {/* Main Success Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-2xl p-8 text-center space-y-8 z-10"
      >
        <div className="space-y-4">
          <div className="w-20 h-20 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 mx-auto relative">
            <CheckCircle className="w-10 h-10" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, ease: 'linear', repeat: Infinity }}
              className="absolute -top-1 -right-1 text-teal-500"
            >
              <Sparkles className="w-5 h-5" />
            </motion.div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Subscription Active!
            </h1>
            <p className="text-teal-600 font-semibold flex items-center justify-center gap-1.5 text-sm">
              Annual Listing Plan Activated Successfully
            </p>
          </div>
        </div>

        <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-600 text-sm leading-relaxed">
          Thank you for subscribing! Your account is now cleared to post your medical clinic listing. Listings will remain search-indexed and live for 12 months.
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push('/add-listing')}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 active:scale-98 transition-all"
          >
            Post Your First Listing
            <ArrowRight className="w-4.5 h-4.5" />
          </button>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3.5 rounded-2xl active:scale-98 transition-all text-sm"
          >
            Go to Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  )
}
