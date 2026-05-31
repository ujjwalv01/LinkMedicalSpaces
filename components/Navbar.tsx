'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Loader } from '@googlemaps/js-api-loader'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building,
  Search,
  MapPin,
  Menu,
  X,
  User,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Settings,
  Stethoscope,
  PlusCircle,
  HelpCircle
} from 'lucide-react'

const SPACE_TYPES = [
  { value: '', label: 'All Space Types' },
  { value: 'EXAM_ROOM', label: 'Exam Room' },
  { value: 'SURGICAL_SUITE', label: 'Surgical Suite' },
  { value: 'IMAGING_CENTER', label: 'Imaging Center' },
  { value: 'DENTAL_OFFICE', label: 'Dental Office' },
  { value: 'THERAPY_ROOM', label: 'Therapy Room' },
  { value: 'LAB', label: 'Laboratory' },
  { value: 'FULL_OFFICE', label: 'Full Medical Office' },
  { value: 'MEDICAL_SPA', label: 'Medical Spa' },
  { value: 'URGENT_CARE', label: 'Urgent Care' },
]

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, status: authStatus } = useSession()

  // --- UI Open states ---
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const userImage = session?.user?.image || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'

  return (
    <nav className="bg-white border-b border-slate-200 py-3 px-6 sticky top-0 z-50 shadow-sm transition-all duration-300">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
        
        {/* Left Side: Logo */}
        <div className="flex items-center cursor-pointer flex-shrink-0" onClick={() => router.push('/')}>
          <img 
            src="/logo-new.png" 
            alt="LinkMedicalSpaces Orlando" 
            className="h-10 sm:h-12 w-auto object-contain"
          />
        </div>

        {/* Right Side: Navigation Links & User Dropdown */}
        <div className="hidden md:flex items-center gap-2 lg:gap-4 flex-shrink-0">
          <button
            onClick={() => router.push('/about')}
            className="text-xs sm:text-sm font-bold text-slate-600 hover:text-teal-600 transition-colors py-2 px-3 rounded-xl hover:bg-slate-50"
          >
            About Us
          </button>
          <button
            onClick={() => router.push('/pricing')}
            className="text-xs sm:text-sm font-bold text-slate-600 hover:text-teal-600 transition-colors py-2 px-3 rounded-xl hover:bg-slate-50"
          >
            Pricing
          </button>
          <button
            onClick={() => router.push('/contact')}
            className="text-xs sm:text-sm font-bold text-slate-600 hover:text-teal-600 transition-colors py-2 px-3 rounded-xl hover:bg-slate-50"
          >
            Contact
          </button>
          <button
            onClick={() => router.push('/search-spaces')}
            className="text-xs sm:text-sm font-bold text-slate-600 hover:text-teal-600 transition-colors py-2 px-3 rounded-xl hover:bg-slate-50"
          >
            Search Spaces
          </button>
          <button
            onClick={() => router.push('/list-your-space')}
            className="text-xs sm:text-sm font-bold text-slate-600 hover:text-teal-600 transition-colors py-2 px-3 rounded-xl hover:bg-slate-50"
          >
            List Your Space
          </button>

          {/* User Menu Dropdown container */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 border border-slate-200 hover:border-slate-300 rounded-full p-1 bg-white hover:shadow-md transition-all active:scale-97 select-none"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 border border-slate-100 flex-shrink-0">
                {authStatus === 'authenticated' && session?.user ? (
                  <img src={userImage} alt="User Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
            </button>

            {/* Slide Down Dropdown Items */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2.5 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-1.5 flex flex-col gap-0.5"
                >
                  {authStatus === 'authenticated' ? (
                    <>
                      <div className="px-3.5 py-2 border-b border-slate-100 mb-1">
                        <p className="text-xs font-bold text-slate-800 truncate">{session?.user?.name || 'Medical Professional'}</p>
                        <p className="text-[9px] text-slate-400 truncate mt-0.5">{session?.user?.email}</p>
                      </div>
                      
                      <button
                        onClick={() => { setIsDropdownOpen(false); router.push('/dashboard') }}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-400" />
                        Dashboard
                      </button>
                      <button
                        onClick={() => { setIsDropdownOpen(false); router.push('/list-your-space') }}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        <PlusCircle className="w-4 h-4 text-slate-400" />
                        List Your Space
                      </button>
                      <button
                        onClick={() => { setIsDropdownOpen(false); router.push('/pricing') }}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        <Building className="w-4 h-4 text-slate-400" />
                        Pricing Plans
                      </button>
                      <div className="border-t border-slate-100 my-1" />
                      <button
                        onClick={() => { setIsDropdownOpen(false); handleSignOut() }}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-rose-400" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { setIsDropdownOpen(false); router.push('/signin?callbackUrl=/') }}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => { setIsDropdownOpen(false); router.push('/signup?callbackUrl=/') }}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold text-teal-600 hover:bg-teal-50 transition-colors"
                      >
                        Sign Up
                      </button>
                      <div className="border-t border-slate-100 my-1" />
                      <button
                        onClick={() => { setIsDropdownOpen(false); router.push('/pricing') }}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        Pricing
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Hamburger toggle for Mobile screens */}
        <div className="flex md:hidden items-center gap-2.5">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-700 transition-all border border-slate-200/50"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Modal backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 top-[62px] z-40 bg-slate-950 md:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed right-0 top-[62px] bottom-0 w-64 bg-white border-l border-slate-200 z-50 p-6 flex flex-col justify-between md:hidden"
            >
              <div className="flex flex-col gap-4">
                {authStatus === 'authenticated' && (
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-2">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 border">
                      <img src={userImage} alt="User" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{session?.user?.name || 'User'}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{session?.user?.email}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => { setIsMobileMenuOpen(false); router.push('/list-your-space') }}
                  className="w-full text-left font-bold text-slate-700 hover:text-teal-600 text-sm py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  List Your Space
                </button>

                <button
                  onClick={() => { setIsMobileMenuOpen(false); router.push('/pricing') }}
                  className="w-full text-left font-bold text-slate-700 hover:text-teal-600 text-sm py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Pricing Plans
                </button>

                {authStatus === 'authenticated' ? (
                  <>
                    <button
                      onClick={() => { setIsMobileMenuOpen(false); router.push('/dashboard') }}
                      className="w-full text-left font-bold text-slate-700 hover:text-teal-600 text-sm py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Dashboard
                    </button>
                    <div className="border-t border-slate-100 my-2" />
                    <button
                      onClick={() => { setIsMobileMenuOpen(false); handleSignOut() }}
                      className="w-full text-left font-bold text-rose-600 hover:bg-rose-50 text-sm py-2 px-3 rounded-lg transition-colors"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <div className="border-t border-slate-100 my-2" />
                    <button
                      onClick={() => { setIsMobileMenuOpen(false); router.push('/signin?callbackUrl=/') }}
                      className="w-full text-left font-bold text-slate-700 hover:text-teal-600 text-sm py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => { setIsMobileMenuOpen(false); router.push('/signup?callbackUrl=/') }}
                      className="w-full text-center font-extrabold bg-teal-600 text-white text-xs py-3 rounded-xl shadow-md mt-2 active:scale-97 transition-all"
                    >
                      Sign Up Free
                    </button>
                  </>
                )}
              </div>

              <div className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                LinkMedicalSpaces
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </nav>
  )
}
