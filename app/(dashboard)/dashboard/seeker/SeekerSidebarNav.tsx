'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Heart,
  MessageSquare,
  Settings,
} from 'lucide-react'

const navigation = [
  { name: 'Saved Spaces', href: '/dashboard/seeker', icon: Heart },
  { name: 'Contacted', href: '/dashboard/seeker/contacted', icon: MessageSquare },
  { name: 'Profile', href: '/dashboard/seeker/profile', icon: Settings },
]

export default function SeekerSidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-2">
      {navigation.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
              isActive ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Icon className="w-5 h-5" />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}
