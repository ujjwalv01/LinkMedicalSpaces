'use client'

import { useRouter } from 'next/navigation'
import { Building, Stethoscope } from 'lucide-react'

export default function Footer() {
  const router = useRouter()

  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-12 px-6 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-10">
        
        {/* Branding & Logo */}
        <div className="flex flex-col gap-4 max-w-sm">
          <div className="flex items-center cursor-pointer flex-shrink-0" onClick={() => window.scrollTo(0,0)}>
            <img 
              src="/logo-new.png" 
              alt="LinkMedicalSpaces Orlando" 
              className="h-10 sm:h-12 w-auto object-contain rounded-md"
            />
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            The Airbnb for medical and dental office listings. Connecting healthcare specialists with verified clinical rooms, labs, and surgical suites.
          </p>
        </div>

        {/* Links section */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-12">
          
          <div className="space-y-3">
            <h4 className="font-bold text-slate-300 text-xs uppercase tracking-widest">Platform</h4>
            <ul className="space-y-2 text-sm text-slate-400 font-semibold">
              <li>
                <button onClick={() => router.push('/search-spaces')} className="hover:text-teal-500 transition-colors">
                  Search Spaces
                </button>
              </li>
              <li>
                <button onClick={() => router.push('/pricing')} className="hover:text-teal-500 transition-colors">
                  Pricing Plans
                </button>
              </li>
              <li>
                <button onClick={() => router.push('/list-your-space')} className="hover:text-teal-500 transition-colors">
                  List Your Space
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-300 text-xs uppercase tracking-widest">Support</h4>
            <ul className="space-y-2 text-sm text-slate-400 font-semibold">
              <li>
                <button onClick={() => router.push('/faqs')} className="hover:text-teal-500 transition-colors">
                  Help Center & FAQs
                </button>
              </li>
              <li>
                <button onClick={() => router.push('/contact')} className="hover:text-teal-500 transition-colors">
                  Contact Support
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3 col-span-2 sm:col-span-1">
            <h4 className="font-bold text-slate-300 text-xs uppercase tracking-widest">Policies</h4>
            <ul className="space-y-2 text-sm text-slate-400 font-semibold">
              <li>
                <button onClick={() => router.push('/terms')} className="hover:text-teal-500 transition-colors">
                  Terms and Purchase Policies
                </button>
              </li>
              <li>
                <button onClick={() => router.push('/disclaimer')} className="hover:text-teal-500 transition-colors">
                  Disclaimer
                </button>
              </li>
              <li>
                <button onClick={() => router.push('/privacy')} className="hover:text-teal-500 transition-colors">
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>

        </div>

      </div>

      {/* Bottom copyright banner */}
      <div className="max-w-7xl mx-auto border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-semibold">
        <p>© {new Date().getFullYear()} LinkMedicalSpaces. All rights reserved.</p>
        <p>Built with Next.js & Tailwind CSS</p>
      </div>

    </footer>
  )
}
