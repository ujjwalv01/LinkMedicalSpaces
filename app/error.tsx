'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertOctagon, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global Error Boundary caught:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
          <AlertOctagon className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h1>
        <p className="text-slate-600 mb-8 leading-relaxed">
          An unexpected error occurred while loading this page. Our team has been notified.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium transition-colors duration-200 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors duration-200"
          >
            <Home className="w-4 h-4" />
            <span>Go Back Home</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
