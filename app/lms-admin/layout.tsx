'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Users,
  Building,
  MapPinOff,
  CreditCard,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronRight,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/lms-admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/lms-admin/users', label: 'Users', icon: Users },
  { href: '/lms-admin/properties', label: 'Properties (Orlando)', icon: Building },
  { href: '/lms-admin/non-orlando', label: 'Non-Orlando Requests', icon: MapPinOff },
  { href: '/lms-admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isSuperAdmin = session?.user?.email?.toLowerCase() === 'shreyas@mediatree.co.in'
  const adminRole = isSuperAdmin ? 'Super Admin' : 'Manager'

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const isActive = (href: string) => {
    if (href === '/lms-admin') return pathname === '/lms-admin'
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-[280px] bg-slate-900 text-white z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:sticky lg:top-0 lg:h-screen`}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold tracking-tight text-white">LMS Admin</h1>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{adminRole}</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-5 right-4 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group ${
                  active
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 text-white/60" />}
              </button>
            )
          })}
        </nav>

        {/* User / Logout */}
        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
              {session?.user?.image ? (
                <img src={session.user.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                  {session?.user?.name?.[0] || 'A'}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{session?.user?.name || 'Admin'}</p>
              <p className="text-[10px] text-slate-500 truncate">{session?.user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-600" />
            <span className="text-sm font-extrabold text-slate-900">LMS Admin</span>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
