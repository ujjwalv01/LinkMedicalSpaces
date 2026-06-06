'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Heart,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { removeSavedListing } from '@/app/actions/saved-listings'

interface ListingMedia {
  id: string
  originalUrl: string
  optimizedUrl?: string | null
  order: number
}

interface SavedListing {
  savedId: string
  savedAt: string
  id: string
  title: string | null
  slug: string
  spaceType: string | null
  pricePerHour: number | null
  pricePerDay: number | null
  pricePerMonth: number | null
  address: string | null
  city: string | null
  state: string | null
  media: ListingMedia[]
}

export default function SavedListingsClient({ initialListings }: { initialListings: SavedListing[] }) {
  const router = useRouter()
  const [listings, setListings] = useState<SavedListing[]>(initialListings)

  const handleUnsave = async (listingId: string) => {
    // Optimistic removal
    setListings(prev => prev.filter(l => l.id !== listingId))

    try {
      await removeSavedListing(listingId)
    } catch (err) {
      console.error('Failed to unsave', err)
      // Revert if failed
      const reverted = initialListings.find(l => l.id === listingId)
      if (reverted) {
        setListings(prev => [...prev, reverted])
      }
    }
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 px-6 mt-8 shadow-sm">
        <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Heart className="w-9 h-9" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">No saved spaces yet</h3>
        <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
          Start exploring medical spaces and tap the bookmark icon to save your favorites here.
        </p>
        <button
          onClick={() => router.push('/search-spaces')}
          className="mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-sm transition-all inline-flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Start Exploring
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {listings.map((listing) => (
        <SavedListingCard
          key={listing.id}
          listing={listing}
          onUnsave={() => handleUnsave(listing.id)}
        />
      ))}
    </div>
  )
}

function SavedListingCard({ listing, onUnsave }: { listing: SavedListing, onUnsave: () => void }) {
  const router = useRouter()
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const mediaList = listing.media && listing.media.length > 0
    ? listing.media
    : [{ id: 'fallback', originalUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800', order: 0 }]

  let displayPrice = ''
  if (listing.pricePerMonth) displayPrice = `$${listing.pricePerMonth}/mo`
  else if (listing.pricePerDay) displayPrice = `$${listing.pricePerDay}/day`
  else if (listing.pricePerHour) displayPrice = `$${listing.pricePerHour}/hr`
  else displayPrice = 'Contact Price'

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setActiveImageIndex((prev) => (prev === 0 ? mediaList.length - 1 : prev - 1))
  }

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setActiveImageIndex((prev) => (prev === mediaList.length - 1 ? 0 : prev + 1))
  }

  const handleUnsaveClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onUnsave()
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => router.push(`/property/${listing.slug}`)}
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between h-full hover:shadow-lg"
    >

      {/* Image Container */}
      <div className="relative aspect-[16/11] w-full overflow-hidden bg-slate-100 rounded-2xl">

        {/* Image Carousel */}
        <div
          className="flex h-full w-full transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${activeImageIndex * 100}%)` }}
        >
          {mediaList.map((m, idx) => (
            <div key={m.id || idx} className="h-full w-full flex-shrink-0 relative" style={{ minWidth: '100%' }}>
              <img
                src={m.optimizedUrl || m.originalUrl}
                alt={`${listing.title || 'Space'} - ${idx + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>

        {/* Carousel Chevrons (Appear on Hover) */}
        {isHovered && mediaList.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-700 rounded-full p-1 shadow-md z-20 hover:scale-105 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-700 rounded-full p-1 shadow-md z-20 hover:scale-105 active:scale-95 transition-all"
            >
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </>
        )}

        {/* Dot Indicators */}
        {mediaList.length > 1 && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-20">
            {mediaList.length <= 5 ? (
              mediaList.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeImageIndex === idx ? 'bg-white w-3.5' : 'bg-white/50 w-1.5'
                  }`}
                />
              ))
            ) : (
              Array.from({ length: 5 }).map((_, i) => {
                const startIdx = Math.max(0, Math.min(activeImageIndex - 2, mediaList.length - 5))
                const dotIdx = startIdx + i
                return (
                  <span
                    key={dotIdx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      activeImageIndex === dotIdx ? 'bg-white w-3.5' : 'bg-white/50 w-1.5'
                    }`}
                  />
                )
              })
            )}
          </div>
        )}

        {/* Save / Heart Button */}
        <button
          onClick={handleUnsaveClick}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow transition-all hover:scale-110 active:scale-90"
          title="Remove from saved"
        >
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
        </button>

      </div>

      {/* Listing Content Details */}
      <div className="pt-3 pb-1 px-1 flex-1 flex flex-col justify-between space-y-0.5">
        <div className="space-y-0.5">
          {/* Address as title */}
          <h3 className="font-bold text-slate-900 text-[15px] leading-snug group-hover:text-teal-700 transition-colors line-clamp-1">
            {listing.address || listing.title || 'Medical Space'}
          </h3>

          {/* Title / Name (secondary) */}
          {listing.title && listing.address && (
            <p className="text-slate-400 text-[13px] line-clamp-1">
              {listing.title}
            </p>
          )}

          {/* City, State */}
          <p className="text-slate-400 text-[13px] flex items-center gap-1">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="line-clamp-1">
              {listing.city && listing.state ? `${listing.city}, ${listing.state}` : 'Location not specified'}
            </span>
          </p>
        </div>

        {/* Price */}
        <div className="pt-1.5 flex items-baseline">
          <span className="text-lg font-bold text-slate-900">{displayPrice}</span>
        </div>
      </div>

    </div>
  )
}
