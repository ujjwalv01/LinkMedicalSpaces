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
  Eye,
  Heart,
  Building,
} from 'lucide-react'

interface PropertyRow {
  id: string
  title: string | null
  slug: string
  status: string
  spaceType: string | null
  city: string | null
  state: string | null
  viewCount: number
  savedCount: number
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
    subscription: {
      startDate: string | null
      status: string
    } | null
  }
  media: { originalUrl: string }[]
}

export default function AdminPropertiesPage() {
  const router = useRouter()
  const [properties, setProperties] = useState<PropertyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchProperties = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '20')
      params.set('region', 'orlando')
      if (search) params.set('search', search)
      params.set('sortBy', sortBy)
      params.set('sortOrder', sortOrder)

      const res = await fetch(`/api/lms-admin/properties?${params.toString()}`)
      const data = await res.json()
      setProperties(data.properties || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotal(data.pagination?.total || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, search, sortBy, sortOrder])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 400)
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

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PUBLISHED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
      DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
      REJECTED: 'bg-red-50 text-red-700 border-red-200',
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border ${colors[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Properties — Orlando Region</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">{total} properties</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by property, city, or lister..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white text-slate-800 placeholder-slate-400 transition-all"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                {[
                  { label: 'Property Name', field: 'title' },
                  { label: 'Lister', field: '' },
                  { label: 'Status', field: '' },
                  { label: 'Subscription Start', field: '' },
                  { label: 'Views', field: 'viewCount' },
                  { label: 'Saved', field: 'savedCount' },
                  { label: 'Created', field: 'createdAt' },
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
                  <td colSpan={7} className="text-center py-16">
                    <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : properties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-500 text-sm font-semibold">
                    No properties found.
                  </td>
                </tr>
              ) : (
                properties.map((prop) => (
                  <tr
                    key={prop.id}
                    onClick={() => router.push(`/lms-admin/properties/${prop.id}`)}
                    className="border-b border-slate-50 hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-9 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0">
                          {prop.media[0]?.originalUrl ? (
                            <img src={prop.media[0].originalUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Building className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{prop.title || 'Untitled'}</p>
                          <p className="text-[11px] text-slate-400">{prop.city}, {prop.state}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700 truncate max-w-[150px]">
                      {prop.user.name || prop.user.email}
                    </td>
                    <td className="px-5 py-4">{statusBadge(prop.status)}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-600">
                      {formatDate(prop.user.subscription?.startDate || null)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-sm font-bold text-slate-600">
                        <Eye className="w-3.5 h-3.5 text-slate-400" /> {prop.viewCount}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-sm font-bold text-slate-600">
                        <Heart className="w-3.5 h-3.5 text-slate-400" /> {prop.savedCount}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-600">{formatDate(prop.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
