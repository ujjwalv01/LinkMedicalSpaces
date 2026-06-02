'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  Calendar,
  Clock,
  Shield,
  Building,
  FileText,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  User,
} from 'lucide-react'

interface UserDetail {
  id: string
  name: string | null
  email: string
  image: string | null
  phone: string | null
  bio: string | null
  role: string
  userSubType: string | null
  verificationStatus: string
  subscriptionStatus: string
  mciNumber: string | null
  createdAt: string
  lastLogin: string | null
  listings: {
    id: string
    title: string | null
    slug: string
    status: string
    spaceType: string | null
    city: string | null
    state: string | null
    createdAt: string
  }[]
  bookings: {
    id: string
    listingId: string
    status: string
    createdAt: string
    listing: { title: string | null; slug: string }
  }[]
  subscription: {
    id: string
    planName: string
    amount: number
    status: string
    startDate: string | null
    endDate: string | null
  } | null
  _count: { listings: number; bookings: number }
}

export default function AdminUserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [user, setUser] = useState<UserDetail | null>(null)
  const [adminRole, setAdminRole] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    fetch(`/api/lms-admin/users/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user)
        setAdminRole(data.adminRole || '')
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [userId])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/lms-admin/users/${userId}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/lms-admin/users')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete user')
      }
    } catch {
      alert('Network error')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    })
  }

  const formatDateTime = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 font-semibold">User not found.</p>
        <button onClick={() => router.push('/lms-admin/users')} className="mt-4 text-teal-600 font-bold text-sm hover:underline">
          ← Back to Users
        </button>
      </div>
    )
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      VERIFIED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
      REJECTED: 'bg-red-50 text-red-700 border-red-200',
      ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      INACTIVE: 'bg-slate-100 text-slate-600 border-slate-200',
      EXPIRED: 'bg-red-50 text-red-700 border-red-200',
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border ${colors[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back Button */}
      <button
        onClick={() => router.push('/lms-admin/users')}
        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Users
      </button>

      {/* Profile Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start gap-6">
        <div className="w-20 h-20 rounded-2xl bg-slate-200 overflow-hidden flex-shrink-0">
          {user.image ? (
            <img src={user.image} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <User className="w-8 h-8" />
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-extrabold text-slate-900">{user.name || 'Unnamed User'}</h1>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold ${
              user.role === 'OWNER' ? 'bg-teal-50 text-teal-700 border border-teal-200' :
              user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
              'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              {user.role === 'OWNER' ? 'LISTER' : user.role}
            </span>
            {user.userSubType && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {user.userSubType}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> {user.email}
            </div>
            {user.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> {user.phone}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-slate-400 font-semibold">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Joined {formatDate(user.createdAt)}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Last Login: {formatDateTime(user.lastLogin)}
            </div>
          </div>
        </div>

        {/* Delete Button (Super Admin only) */}
        {adminRole === 'super_admin' && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" /> Delete User
          </button>
        )}
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Subscription</p>
          {statusBadge(user.subscriptionStatus)}
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">MCI Number</p>
          <p className="text-sm font-bold text-slate-700">{user.mciNumber || '—'}</p>
        </div>
      </div>

      {/* Bio */}
      {user.bio && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-3">Bio</h3>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{user.bio}</p>
        </div>
      )}

      {/* Listings */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-teal-600" />
            Properties Listed ({user._count.listings})
          </div>
        </h3>
        {user.listings.length === 0 ? (
          <p className="text-sm text-slate-400 font-semibold">No properties listed.</p>
        ) : (
          <div className="space-y-2">
            {user.listings.map((listing) => (
              <div
                key={listing.id}
                onClick={() => router.push(`/lms-admin/properties/${listing.id}`)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors border border-slate-100"
              >
                <div>
                  <p className="text-sm font-bold text-slate-800">{listing.title || 'Untitled'}</p>
                  <p className="text-xs text-slate-500">{listing.city}, {listing.state} · {listing.spaceType?.replace(/_/g, ' ')}</p>
                </div>
                {statusBadge(listing.status)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bookings / Inquiries */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Inquiries / Bookings ({user._count.bookings})
          </div>
        </h3>
        {user.bookings.length === 0 ? (
          <p className="text-sm text-slate-400 font-semibold">No inquiries yet.</p>
        ) : (
          <div className="space-y-2">
            {user.bookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-800">{booking.listing?.title || 'Unknown Listing'}</p>
                  <p className="text-xs text-slate-500">{formatDate(booking.createdAt)}</p>
                </div>
                {statusBadge(booking.status)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subscription */}
      {user.subscription && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              Subscription
            </div>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase">Plan</p>
              <p className="text-sm font-bold text-slate-700">{user.subscription.planName}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase">Amount</p>
              <p className="text-sm font-bold text-slate-700">${user.subscription.amount}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase">Start</p>
              <p className="text-sm font-bold text-slate-700">{formatDate(user.subscription.startDate)}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase">Status</p>
              {statusBadge(user.subscription.status)}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div
            className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-extrabold">Delete User</h3>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to permanently delete <strong>{user.name || user.email}</strong>?
              This will also delete all their listings, bookings, and subscription data. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
