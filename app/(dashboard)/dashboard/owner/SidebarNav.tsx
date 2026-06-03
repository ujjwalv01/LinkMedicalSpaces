'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  LayoutDashboard,
  Building,
  PlusCircle,
  Settings,
  CreditCard,
  ChevronDown,
  BarChart3,
  MessageSquare,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard Home', href: '/dashboard/owner', icon: LayoutDashboard },
  { 
    name: 'My Listings', 
    href: '/dashboard/owner/listings', 
    icon: Building,
    children: [
      { name: 'Published Listings', href: '/dashboard/owner/listings?status=PUBLISHED' },
      { name: 'Draft Listings', href: '/dashboard/owner/listings?status=DRAFT' },
    ]
  },
  { name: 'Add Listing', href: '/add-listing', icon: PlusCircle },
  { name: 'Enquiries', href: '/dashboard/owner/enquiries', icon: MessageSquare },
  { name: 'Profile', href: '/dashboard/owner/profile', icon: Settings },
  { name: 'Analytics', href: '/dashboard/owner/analytics', icon: BarChart3 },
  { name: 'Subscription', href: '/dashboard/owner/subscription', icon: CreditCard },
]

export default function SidebarNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentStatus = searchParams.get('status')
  
  const [openDropdown, setOpenDropdown] = useState<string | null>('My Listings')
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetch('/api/owner/enquiries/unread')
      .then(res => res.json())
      .then(data => {
        if (data.count) setUnreadCount(data.count)
      })
      .catch(console.error)
  }, [])

  const toggleDropdown = (name: string) => {
    if (openDropdown === name) setOpenDropdown(null)
    else setOpenDropdown(name)
  }

  return (
    <nav className="space-y-2">
      {navigation.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href && !item.children
        
        if (item.children) {
          const isDropdownOpen = openDropdown === item.name
          const isChildActive = pathname.startsWith(item.href)
          
          return (
            <div key={item.name} className="space-y-1">
              <button
                onClick={() => toggleDropdown(item.name)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  isChildActive ? 'text-teal-700 bg-teal-50' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  {item.name}
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isDropdownOpen && (
                <div className="pl-11 pr-2 space-y-1">
                  {item.children.map(child => {
                    // Exact match on href including query params
                    const childUrl = new URL(child.href, 'http://localhost')
                    const childStatus = childUrl.searchParams.get('status')
                    
                    const isExactlyActive = pathname === childUrl.pathname && currentStatus === childStatus

                    return (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={`block px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                          isExactlyActive 
                            ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20' 
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {child.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        }

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
              isActive ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5" />
              {item.name}
            </div>
            {item.name === 'Enquiries' && unreadCount > 0 && !pathname.startsWith('/dashboard/owner/enquiries') && (
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-500/50" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
