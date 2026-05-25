'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import {
  User,
  LogOut,
  Building,
  Search,
  Calendar,
  Shield,
  Mail,
  Phone,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Loader2,
} from 'lucide-react'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin')
    } else if (status === 'authenticated' && session?.user) {
      const isOnboarded = (session.user as any).onboarded
      if (isOnboarded === false) {
        router.push('/onboarding')
      }
    }
  }, [status, session, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
      </div>
    )
  }

  if (!session?.user) return null

  const user = session.user
  const role = user.role || 'SEEKER'
  const isOwner = role === 'OWNER'
  const verificationStatus = (user as any).verificationStatus || 'PENDING'
  const isVerified = verificationStatus === 'VERIFIED'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
              <Building className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-lg">
              LinkMedical<span className="text-teal-600">Spaces</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-teal-50 border border-teal-200 overflow-hidden flex items-center justify-center">
                {user.image ? (
                  <img src={user.image} alt={user.name || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-teal-600" />
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-slate-800 leading-none">{user.name}</p>
                <p className="text-xs text-slate-400 capitalize mt-0.5">{role.toLowerCase()}</p>
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: '/signin' })}
              className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-slate-100 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-3xl p-8 md:p-10 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Welcome, {user.name}!
            </h1>
            <p className="text-teal-50/80 text-sm md:text-base max-w-xl">
              {isOwner
                ? 'Manage your medical office spaces, dental chairs, and review incoming sublet booking inquiries.'
                : 'Browse medical spaces, book clinical exam rooms, and expand your clinical operations.'}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex items-center gap-3">
            {isVerified ? (
              <>
                <CheckCircle2 className="w-8 h-8 text-teal-300" />
                <div>
                  <p className="text-xs text-teal-100 font-medium">Account Status</p>
                  <p className="text-sm font-bold">Fully Verified</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-8 h-8 text-amber-300 animate-pulse" />
                <div>
                  <p className="text-xs text-teal-100 font-medium">Account Status</p>
                  <p className="text-sm font-bold text-amber-300">Under Verification</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800">Your Profile</h2>
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
              <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                {user.image ? (
                  <img src={user.image} alt={user.name || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div>
                <p className="font-bold text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{(user as any).phone || 'No phone number provided'}</span>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-slate-400 mt-0.5" />
                <p className="leading-relaxed">{(user as any).bio || 'No bio written yet.'}</p>
              </div>
            </div>
          </div>

          {/* Quick Stats or Listings overview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm md:col-span-2">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">
                {isOwner ? 'Your Listed Spaces' : 'Recent Bookings'}
              </h2>
              {isOwner ? (
                <button className="text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all">
                  <Plus className="w-3.5 h-3.5" />
                  List Space
                </button>
              ) : (
                <button className="text-xs text-teal-600 font-semibold hover:underline">
                  Browse Spaces
                </button>
              )}
            </div>

            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto border border-slate-200">
                {isOwner ? (
                  <Building className="w-6 h-6 text-slate-400" />
                ) : (
                  <Calendar className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-slate-700">
                  {isOwner ? 'No spaces listed yet' : 'No bookings scheduled'}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  {isOwner
                    ? 'Start listing your medical clinic rooms or dental offices to reach thousands of healthcare providers.'
                    : 'Search and reserve premium clinics, dental chairs, or physical therapy rooms.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
