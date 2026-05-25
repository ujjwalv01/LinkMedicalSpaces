'use client'

import { Edit, Trash2, MapPin, Building, Clock } from 'lucide-react'

export interface ListingCardProps {
  listing: {
    id: string
    title: string
    spaceType: string
    address: string
    city: string
    state: string
    pricePerHour?: number | null
    pricePerDay?: number | null
    pricePerMonth?: number | null
    status?: string
    media?: { originalUrl: string }[]
  }
  showActions?: boolean
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export default function ListingCard({
  listing,
  showActions = false,
  onEdit,
  onDelete,
}: ListingCardProps) {
  const mainImage = listing.media?.[0]?.originalUrl || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800'
  const spaceTypeLabel = listing.spaceType.replace(/_/g, ' ')

  // Determine the display price
  let displayPrice = ''
  if (listing.pricePerMonth) {
    displayPrice = `$${listing.pricePerMonth}/mo`
  } else if (listing.pricePerDay) {
    displayPrice = `$${listing.pricePerDay}/day`
  } else if (listing.pricePerHour) {
    displayPrice = `$${listing.pricePerHour}/hr`
  } else {
    displayPrice = 'Contact for Price'
  }

  // Color-coded status badge
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'DRAFT':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  return (
    <div className="group bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full">
      {/* Listing Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <img
          src={mainImage}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
        />

        {/* Status Badge */}
        {listing.status && (
          <div className="absolute top-4 left-4 z-10">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full border shadow-sm capitalize ${getStatusStyle(
                listing.status
              )}`}
            >
              {listing.status.toLowerCase()}
            </span>
          </div>
        )}

        {/* Space Type Badge */}
        <div className="absolute bottom-4 left-4 z-10">
          <span className="bg-slate-900/70 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
            <Building className="w-3.5 h-3.5" />
            {spaceTypeLabel}
          </span>
        </div>
      </div>

      {/* Listing Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Price */}
          <div className="flex items-baseline text-slate-900">
            <span className="text-xl font-extrabold">{displayPrice}</span>
          </div>

          {/* Title */}
          <h4 className="font-extrabold text-slate-800 text-base leading-snug group-hover:text-teal-600 transition-colors line-clamp-1">
            {listing.title}
          </h4>

          {/* Address */}
          <p className="text-slate-500 text-xs flex items-center gap-1 leading-none">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="line-clamp-1">{listing.city}, {listing.state}</span>
          </p>
        </div>

        {/* Action Buttons */}
        {showActions && (onEdit || onDelete) && (
          <div className="flex gap-2 pt-3 border-t border-slate-100">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(listing.id)
                }}
                className="flex-1 bg-slate-50 hover:bg-teal-50 hover:text-teal-700 text-slate-600 border border-slate-200 hover:border-teal-200 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(listing.id)
                }}
                className="bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 p-2 rounded-xl transition-all"
                title="Delete Listing"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
