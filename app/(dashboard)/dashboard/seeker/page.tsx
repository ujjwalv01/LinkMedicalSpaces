'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Heart,
  MapPin,
  Building,
  Star,
  ChevronLeft,
  ChevronRight,
  Search,
  Sparkles,
} from 'lucide-react'

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

export default function SeekerSavedPage() {
  const router = useRouter()
  const [listings, setListings] = useState<SavedListing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSaved()
  }, [])

  const fetchSaved = async () => {
    try {
      const res = await fetch('/api/saved-listings')
      const data = await res.json()
      if (data.listings) setListings(data.listings)
    } catch (err) {
      console.error('Failed to fetch saved listings', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUnsave = async (listingId: string) => {
    // Optimistic removal
    setListings(prev => prev.filter(l => l.id !== listingId))

    try {
      await fetch('/api/saved-listings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      })
    } catch (err) {
      console.error('Failed to unsave', err)
      // Re-fetch on error
      fetchSaved()
    }
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Saved Spaces
          </h1>
          <p className="text-slate-500 mt-1">Your bookmarked medical spaces and wishlist</p>
        </div>
        <button
          onClick={() => router.push('/search-spaces')}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-teal-600/20 active:scale-95 transition-all text-sm self-start sm:self-auto flex items-center gap-2"
        >
          <Search className="w-5 h-5" />
          Explore Spaces
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse flex flex-col space-y-4">
              <div className="bg-slate-100 aspect-[4/3] rounded-3xl w-full" />
              <div className="space-y-2">
                <div className="h-4 bg-slate-100 rounded w-1/4" />
                <div className="h-5 bg-slate-100 rounded w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {listings.map((listing) => (
            <SavedListingCard
              key={listing.id}
              listing={listing}
              onUnsave={() => handleUnsave(listing.id)}
            />
          ))}
        </div>
      )}
    </>
  )
}

// ─── Saved Listing Card (with heart unsave button) ──────────────────────────
interface CardProps {
  listing: SavedListing
  onUnsave: () => void
}

function SavedListingCard({ listing, onUnsave }: CardProps) {
  const router = useRouter()
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const mediaList = listing.media && listing.media.length > 0
    ? listing.media.slice(0, 3)
    : [{ id: 'fallback', originalUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800', order: 0 }]

  const spaceTypeLabel = listing.spaceType ? listing.spaceType.replace(/_/g, ' ') : 'Medical Space'

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
      className="group cursor-pointer bg-white rounded-[26px] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full hover:scale-[1.01]"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <div
          className="flex h-full w-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${activeImageIndex * 100}%)`, width: `${mediaList.length * 100}%` }}
        >
          {mediaList.map((m, idx) => (
            <div key={m.id || idx} className="h-full w-full flex-shrink-0 relative">
              <img
                src={m.originalUrl}
                alt={`${listing.title || 'Space'} - ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Carousel Chevrons */}
        {isHovered && mediaList.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-800 rounded-full p-1.5 shadow-md z-20 hover:scale-105 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-800 rounded-full p-1.5 shadow-md z-20 hover:scale-105 active:scale-95 transition-all"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </>
        )}

        {/* Dot Indicators */}
        {mediaList.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
            {mediaList.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeImageIndex === idx ? 'bg-white w-4' : 'bg-white/60 w-1.5'
                }`}
              />
            ))}
          </div>
        )}

        {/* Space Type Badge */}
        <div className="absolute top-4 left-4 z-20">
          <span className="bg-slate-900/70 backdrop-blur-md text-white text-[10px] font-extrabold px-3 py-1 rounded-lg flex items-center gap-1 uppercase tracking-wider">
            <Building className="w-3 h-3 text-teal-400" />
            {spaceTypeLabel}
          </span>
        </div>

        {/* Heart / Unsave Button */}
        <button
          onClick={handleUnsaveClick}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-md transition-all hover:scale-110 active:scale-90"
          title="Remove from saved"
        >
          <Heart className="w-5 h-5 text-red-500 fill-red-500" />
        </button>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-lg font-black text-teal-600">{displayPrice}</span>
            <div className="flex items-center gap-1 text-slate-700 text-xs font-bold bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>4.9</span>
              <span className="text-slate-400 font-medium">(18)</span>
            </div>
          </div>
          <h3 className="font-extrabold text-slate-800 text-base leading-snug group-hover:text-teal-600 transition-colors line-clamp-1">
            {listing.title || 'Unnamed Medical Space'}
          </h3>
          <p className="text-slate-500 text-xs flex items-center gap-1 leading-none pt-0.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="line-clamp-1">
              {listing.city && listing.state ? `${listing.city}, ${listing.state}` : 'No address specified'}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
