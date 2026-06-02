'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users as UsersIcon,
  Filter,
} from 'lucide-react'

interface UserRow {
  id: string
  name: string | null
  email: string
  image: string | null
  role: string
  userSubType: string | null
  verificationStatus: string
  subscriptionStatus: string
  createdAt: string
  lastLogin: string | null
  _count: { listings: number; bookings: number }
}

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'SEEKER', label: 'Seeker' },
  { value: 'OWNER', label: 'Lister' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
]

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '20')
      if (search) params.set('search', search)
      if (roleFilter) params.set('role', roleFilter)
      params.set('sortBy', sortBy)
      params.set('sortOrder', sortOrder)

      const res = await fetch(`/api/lms-admin/users?${params.toString()}`)
      const data = await res.json()
      setUsers(data.users || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotal(data.pagination?.total || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, search, roleFilter, sortBy, sortOrder])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Debounced search
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
    setPage(1)
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <ChevronDown className="w-3 h-3 opacity-30" />
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-teal-600" />
    ) : (
      <ChevronDown className="w-3 h-3 text-teal-600" />
    )
  }

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Users</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">{total} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white text-slate-800 placeholder-slate-400 transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
            className="pl-9 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-teal-500 bg-white text-slate-700 appearance-none cursor-pointer"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                {[
                  { label: 'Name', field: 'name' },
                  { label: 'User Role', field: 'role' },
                  { label: 'Properties Listed', field: '' },
                  { label: 'Inquiries', field: '' },
                  { label: 'Sign-up Date', field: 'createdAt' },
                  { label: 'Last Login', field: 'lastLogin' },
                ].map((col) => (
                  <th
                    key={col.label}
                    onClick={col.field ? () => handleSort(col.field) : undefined}
                    className={`text-left px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider ${
                      col.field ? 'cursor-pointer hover:text-slate-700 select-none' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.field && <SortIcon field={col.field} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-500 text-sm font-semibold">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => router.push(`/lms-admin/users/${user.id}`)}
                    className="border-b border-slate-50 hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                          {user.image ? (
                            <img src={user.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-bold">
                              {user.name?.[0] || user.email[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{user.name || 'Unnamed'}</p>
                          <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        user.role === 'OWNER' ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                        user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {user.role === 'OWNER' ? 'LISTER' : user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-700">{user._count.listings}</td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-700">{user._count.bookings}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-600">{formatDate(user.createdAt)}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-600">{formatDate(user.lastLogin)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
