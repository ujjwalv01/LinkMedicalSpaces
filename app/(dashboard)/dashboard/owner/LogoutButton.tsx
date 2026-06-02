'use client'
import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/signin' })}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
    >
      <LogOut className="w-4 h-4" />
      Sign Out
    </button>
  )
}
