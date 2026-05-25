import Link from 'next/link'
import { FileQuestion, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
        <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6 text-teal-600">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2 font-display">404</h1>
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Page Not Found</h2>
        <p className="text-slate-600 mb-8 leading-relaxed">
          We couldn't find the page you're looking for. It might have been moved, deleted, or never existed in the first place.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium transition-colors duration-200 shadow-sm"
        >
          <Home className="w-4 h-4" />
          <span>Go Back Home</span>
        </Link>
      </div>
    </div>
  )
}
