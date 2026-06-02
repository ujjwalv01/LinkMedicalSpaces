'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Building,
  Eye,
  Heart,
  Calendar,
  User,
  Shield,
  FileText,
  CheckCircle2,
} from 'lucide-react'

interface ListingDetail {
  id: string
  title: string | null
  slug: string
  description: string | null
  status: string
  spaceType: string | null
  rooms: number | null
  squareFeet: number | null
  pricePerHour: number | null
  pricePerDay: number | null
  pricePerMonth: number | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  country: string
  latitude: number | null
  longitude: number | null
  amenities: string[] | any
  viewCount: number
  savedCount: number
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
    role: string
    verificationStatus: string
    subscription: {
      startDate: string | null
      status: string
      planName: string
      amount: number
    } | null
  }
  media: {
    id: string
    originalUrl: string
    caption: string | null
    order: number
  }[]
  _count: { bookings: number }
}

export default function AdminPropertyDetailPage() {
  const router = useRouter()
  const params = useParams()
  const propertyId = params.id as string

  const [listing, setListing] = useState<ListingDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/lms-admin/properties/${propertyId}`)
      .then((res) => res.json())
      .then((data) => setListing(data.listing))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [propertyId])

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PUBLISHED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
      DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
      REJECTED: 'bg-red-50 text-red-700 border-red-200',
      ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      INACTIVE: 'bg-slate-100 text-slate-600 border-slate-200',
      VERIFIED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border ${colors[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
        {status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 font-semibold">Property not found.</p>
        <button onClick={() => router.push('/lms-admin/properties')} className="mt-4 text-teal-600 font-bold text-sm hover:underline">
          ← Back to Properties
        </button>
      </div>
    )
  }

  const amenities = Array.isArray(listing.amenities) ? listing.amenities : []

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-xl font-extrabold text-slate-900">{listing.title || 'Untitled Listing'}</h1>
              {statusBadge(listing.status)}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="w-4 h-4" />
              <span>{listing.address && `${listing.address}, `}{listing.city}, {listing.state} {listing.zipCode}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-slate-600 font-bold">
              <Eye className="w-4 h-4 text-slate-400" /> {listing.viewCount} views
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 font-bold">
              <Heart className="w-4 h-4 text-slate-400" /> {listing.savedCount} saved
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 font-bold">
              <FileText className="w-4 h-4 text-slate-400" /> {listing._count.bookings} inquiries
            </div>
          </div>
        </div>
      </div>

      {/* Photos */}
      {listing.media.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4">Photos ({listing.media.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {listing.media.map((m) => (
              <div key={m.id} className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100">
                <img src={m.originalUrl} alt={m.caption || ''} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Property Info */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Property Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase">Space Type</p>
              <p className="text-sm font-bold text-slate-700">{listing.spaceType?.replace(/_/g, ' ') || '—'}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase">Rooms</p>
              <p className="text-sm font-bold text-slate-700">{listing.rooms || '—'}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase">Sq. Ft.</p>
              <p className="text-sm font-bold text-slate-700">{listing.squareFeet || '—'}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase">Created</p>
              <p className="text-sm font-bold text-slate-700">{formatDate(listing.createdAt)}</p>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase mb-2">Pricing</p>
            <div className="flex flex-wrap gap-3">
              {listing.pricePerHour && (
                <span className="bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1.5 rounded-lg text-xs font-bold">
                  ${listing.pricePerHour}/hr
                </span>
              )}
              {listing.pricePerDay && (
                <span className="bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1.5 rounded-lg text-xs font-bold">
                  ${listing.pricePerDay}/day
                </span>
              )}
              {listing.pricePerMonth && (
                <span className="bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1.5 rounded-lg text-xs font-bold">
                  ${listing.pricePerMonth}/mo
                </span>
              )}
              {!listing.pricePerHour && !listing.pricePerDay && !listing.pricePerMonth && (
                <span className="text-sm text-slate-500 font-semibold">No pricing set</span>
              )}
            </div>
          </div>
        </div>

        {/* Lister Info */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Lister Information</h3>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-slate-200 overflow-hidden flex-shrink-0">
              {listing.user.image ? (
                <img src={listing.user.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <User className="w-6 h-6" />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{listing.user.name || 'Unnamed'}</p>
              <p className="text-xs text-slate-500">{listing.user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                {statusBadge(listing.user.role === 'OWNER' ? 'LISTER' : listing.user.role)}
              </div>
            </div>
          </div>
          {listing.user.subscription && (
            <div className="border-t border-slate-100 pt-3 space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Subscription</p>
              <div className="flex items-center gap-3 text-sm">
                <span className="font-bold text-slate-700">{listing.user.subscription.planName}</span>
                <span className="text-slate-500">·</span>
                <span className="font-bold text-slate-700">${listing.user.subscription.amount}</span>
                <span className="text-slate-500">·</span>
                {statusBadge(listing.user.subscription.status)}
              </div>
            </div>
          )}
          <button
            onClick={() => router.push(`/lms-admin/users/${listing.user.id}`)}
            className="text-teal-600 font-bold text-xs hover:underline"
          >
            View Full User Profile →
          </button>
        </div>
      </div>

      {/* Description */}
      {listing.description && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-3">Description</h3>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{listing.description}</p>
        </div>
      )}

      {/* Amenities */}
      {amenities.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4">Amenities</h3>
          <div className="flex flex-wrap gap-2">
            {amenities.map((a: string, i: number) => (
              <span key={i} className="bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" /> {a}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
