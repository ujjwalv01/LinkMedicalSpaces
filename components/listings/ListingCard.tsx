'use client'

import { Edit, Trash2, MapPin, Building, Clock, Image as ImageIcon, Video } from 'lucide-react'

export interface ListingCardProps {
  listing: {
    id: string
    title?: string | null
    spaceType?: string | null
    address?: string | null
    city?: string | null
    state?: string | null
    pricePerHour?: number | null
    pricePerDay?: number | null
    pricePerMonth?: number | null
    status?: string
    media?: { originalUrl: string; type?: string }[]
    description?: string | null
    squareFeet?: number | null
  }
  showActions?: boolean
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onContinue?: (id: string) => void
}

export default function ListingCard({
  listing,
  showActions = false,
  onEdit,
  onDelete,
  onContinue,
}: ListingCardProps) {
  const mainImage = listing.media?.[0]?.originalUrl
  const spaceTypeLabel = listing.spaceType ? listing.spaceType.replace(/_/g, ' ') : 'Medical Space'

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

  // Calculate listing draft progress
  const getDraftStep = (item: any) => {
    const photoCount = item.media?.filter((m: any) => m.type === 'IMAGE').length || 0
    if (!item.spaceType) return 1
    if (!item.title || !item.squareFeet) return 2
    if (!item.address) return 3
    if (photoCount < 3) return 4
    if (!item.description || item.description.length < 100) return 6
    return 7
  }

  const draftStep = getDraftStep(listing)
  const completionPercentage = Math.round((draftStep / 7) * 100)

  const cardPhotoCount = listing.media?.filter((m) => m.type === 'IMAGE' || !m.type).length || 0
  const cardVideoCount = listing.media?.filter((m) => m.type === 'VIDEO').length || 0

  return (
    <div className="group bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full">
      {/* Listing Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 flex items-center justify-center">
        {mainImage ? (
          listing.media?.[0]?.type === 'VIDEO' ? (
            <video
              src={mainImage}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
            />
          ) : (
            <img
              src={mainImage}
              alt={listing.title || 'Listing draft'}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
            />
          )
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-300">
            <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">No Image</span>
          </div>
        )}

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
          <span className="bg-slate-900/70 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
            <Building className="w-3.5 h-3.5" />
            {spaceTypeLabel}
          </span>
        </div>


      </div>

      {/* Listing Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Price & Media Counts */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline text-slate-900">
              <span className="text-xl font-extrabold">{displayPrice}</span>
            </div>
            
            {(cardPhotoCount > 0 || cardVideoCount > 0) && (
              <div className="flex items-center gap-2 text-slate-500 text-[11px] font-semibold bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                {cardPhotoCount > 0 && (
                  <span className="flex items-center gap-1" title={`${cardPhotoCount} Photos`}>
                    <ImageIcon className="w-3.5 h-3.5" /> {cardPhotoCount}
                  </span>
                )}
                {cardVideoCount > 0 && (
                  <span className="flex items-center gap-1" title={`${cardVideoCount} Videos`}>
                    <Video className="w-3.5 h-3.5" /> {cardVideoCount}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Title */}
          <h4 className="font-extrabold text-slate-800 text-base leading-snug group-hover:text-teal-600 transition-colors line-clamp-1">
            {listing.title || 'Unnamed Draft Space'}
          </h4>

          {/* Draft progress indicator */}
          {listing.status === 'DRAFT' && (
            <div className="space-y-1.5 pt-1 pb-1">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Step {draftStep} of 7</span>
                <span>{completionPercentage}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-teal-600 h-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Address */}
          <p className="text-slate-500 text-xs flex items-center gap-1 leading-none">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="line-clamp-1">
              {listing.city && listing.state ? `${listing.city}, ${listing.state}` : 'No address specified'}
            </span>
          </p>
        </div>

        {/* Action Buttons */}
        {showActions && (onEdit || onDelete) && (
          <div className="flex gap-2 pt-3 border-t border-slate-100">
            {listing.status === 'DRAFT' ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (onContinue) {
                    onContinue(listing.id)
                  } else {
                    window.location.href = `/add-listing?draftId=${listing.id}`
                  }
                }}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow"
              >
                <Clock className="w-3.5 h-3.5" />
                Continue
              </button>
            ) : (
              onEdit && (
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
              )
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
