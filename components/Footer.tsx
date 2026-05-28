'use client'

import { useRouter } from 'next/navigation'
import { Building } from 'lucide-react'

export default function Footer() {
  const router = useRouter()

  return (
    <footer className="bg-slate-50 border-t border-slate-200 py-12 px-6 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-10">
        
        {/* Brand details */}
        <div className="space-y-4 max-w-sm">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-md">
              <Building className="w-4.5 h-4.5" />
            </div>
            <span className="font-extrabold text-slate-900 tracking-tight text-lg">
              LinkMedical<span className="text-teal-600 font-black">Spaces</span>
            </span>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">
            The Airbnb for medical and dental office listings. Connecting healthcare specialists with verified clinical rooms, labs, and surgical suites.
          </p>
        </div>

        {/* Links section */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-12">
          
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Platform</h4>
            <ul className="space-y-2 text-sm text-slate-500 font-semibold">
              <li>
                <button onClick={() => router.push('/search-spaces')} className="hover:text-teal-600 transition-colors">
                  Search Spaces
                </button>
              </li>
              <li>
                <button onClick={() => router.push('/pricing')} className="hover:text-teal-600 transition-colors">
                  Pricing Plans
                </button>
              </li>
              <li>
                <button onClick={() => router.push('/list-your-space')} className="hover:text-teal-600 transition-colors">
                  List Your Space
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Support</h4>
            <ul className="space-y-2 text-sm text-slate-500 font-semibold">
              <li>
                <button onClick={() => router.push('/pricing#faq')} className="hover:text-teal-600 transition-colors">
                  Help Center & FAQs
                </button>
              </li>
              <li>
                <button onClick={() => router.push('/pricing')} className="hover:text-teal-600 transition-colors">
                  Contact Support
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3 col-span-2 sm:col-span-1">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-500 font-semibold">
              <li>
                <span className="cursor-default text-slate-400">Privacy Policy</span>
              </li>
              <li>
                <span className="cursor-default text-slate-400">Terms & Conditions</span>
              </li>
            </ul>
          </div>

        </div>

      </div>

      {/* Bottom copyright banner */}
      <div className="max-w-7xl mx-auto border-t border-slate-200 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400 font-semibold">
        <p>© {new Date().getFullYear()} LinkMedicalSpaces. All rights reserved.</p>
        <p>Built with Next.js & Tailwind CSS</p>
      </div>

    </footer>
  )
}
