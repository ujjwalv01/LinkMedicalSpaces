import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SeekerSidebarNav from './SeekerSidebarNav'
import LogoutButton from '../owner/LogoutButton'

export default async function SeekerDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/signin')
  }

  // Ensure only SEEKER can access (admins can too for debugging)
  if (session.user.role !== 'SEEKER' && session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col justify-between">
        <div className="p-6">
          <Link href="/" className="block mb-8">
            <img src="/logo-new.png" alt="LinkMedicalSpaces" className="h-8 w-auto object-contain" />
          </Link>
          <SeekerSidebarNav />
        </div>
        <div className="p-6 border-t border-slate-100 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex-shrink-0">
              {session.user.image ? (
                <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  {session.user.name?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{session.user.name}</p>
              <p className="text-xs text-slate-500 capitalize">{session.user.role.toLowerCase()}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full space-y-8">
          {children}
        </div>
      </main>
    </div>
  )
}
