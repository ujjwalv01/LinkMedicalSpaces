'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin,
  Building,
  CheckCircle2,
  Share2,
  Heart,
  ChevronLeft,
  ChevronRight,
  X,
  Star,
  ShieldCheck,
  FileText,
  Activity,
  Users,
  User,
  Coffee,
  Trash2,
  Accessibility,
  Wifi,
  Video,
  Check,
  Calendar,
  Clock,
  Coins,
  Send,
  Loader2,
  ArrowLeft,
  Mail,
  Phone,
  Image as ImageIcon
} from 'lucide-react'

interface ListingMedia {
  id: string
  originalUrl: string
  caption: string | null
  order: number
  type?: string
}

interface ListingUser {
  id: string
  name: string | null
  image: string | null
  verificationStatus: string | null
  createdAt: string
  email?: string | null
  phone?: string | null
}

interface Listing {
  id: string
  title: string | null
  slug: string
  description: string | null
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
  amenities: string[]
  createdAt: string
  user: ListingUser | null
  media: ListingMedia[]
}

const AMENITY_ICONS: Record<string, any> = {
  'HIPAA Compliant': ShieldCheck,
  'Electronic Health Records': FileText,
  'X-Ray Equipment': Activity,
  'Lab Services': Activity,
  'Waiting Room': Users,
  'Reception Desk': User,
  'Private Parking': CheckCircle2,
  'ADA Accessible': Accessibility,
  'High-Speed WiFi': Wifi,
  'Video Conferencing': Video,
  'Break Room': Coffee,
  'Storage Space': Check,
  'Medical Waste Disposal': Trash2,
}

export default function PropertyDetailClient({ listing }: { listing: Listing }) {
  const router = useRouter()
  const { data: session } = useSession()

  // --- Photo Gallery states ---
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  // --- Description toggle ---
  const [showFullDesc, setShowFullDesc] = useState(false)

  // --- Favorite/Save state ---
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch initial save state
  useEffect(() => {
    if (session?.user) {
      fetch('/api/saved-listings?idsOnly=true')
        .then(res => res.json())
        .then(data => {
          if (data.ids && data.ids.includes(listing.id)) {
            setIsSaved(true)
          }
        })
        .catch(err => console.error('Failed to fetch saved status', err))
    }
  }, [session, listing.id])

  const handleToggleSave = async () => {
    if (!session?.user) {
      router.push('/signin')
      return
    }
    
    setIsSaving(true)
    const newSavedState = !isSaved
    setIsSaved(newSavedState) // Optimistic update

    try {
      const res = await fetch('/api/saved-listings', {
        method: newSavedState ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id })
      })
      if (!res.ok) throw new Error('Failed to toggle save')
    } catch (err) {
      console.error(err)
      setIsSaved(!newSavedState) // Revert on error
    } finally {
      setIsSaving(false)
    }
  }
  const [showShareTooltip, setShowShareTooltip] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [hasTrackedView, setHasTrackedView] = useState(false)

  // Track view when component mounts
  useEffect(() => {
    if (!listing.id || hasTrackedView) return
    const trackView = async () => {
      try {
        await fetch(`/api/listings/${listing.id}/view`, { method: 'POST' })
        setHasTrackedView(true)
      } catch (err) {
        console.error('Failed to track view', err)
      }
    }
    trackView()
  }, [listing.id, hasTrackedView])

  // --- Map state ---
  const [mapsLoaded, setMapsLoaded] = useState<boolean | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  // --- Pricing Options Configuration ---
  const priceOptions: { id: string; label: string; price: number; unit: string }[] = []
  if (listing.pricePerHour) {
    priceOptions.push({ id: 'hour', label: 'Hourly', price: listing.pricePerHour, unit: 'hr' })
  }
  if (listing.pricePerDay) {
    priceOptions.push({ id: 'day', label: 'Daily', price: listing.pricePerDay, unit: 'day' })
  }
  if (listing.pricePerMonth) {
    priceOptions.push({ id: 'month', label: 'Monthly', price: listing.pricePerMonth, unit: 'mo' })
  }

  const hasPricing = priceOptions.length > 0
  const [activeTab, setActiveTab] = useState(hasPricing ? priceOptions[0].id : '')

  // --- Booking Calculator Form Inputs ---
  const [bookingDate, setBookingDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  const [monthlyStartDate, setMonthlyStartDate] = useState('')
  const [durationMonths, setDurationMonths] = useState(1)

  // Set default form values on load
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    
    setBookingDate(today)
    setStartDate(today)
    setEndDate(tomorrow)
    setMonthlyStartDate(today)
  }, [])

  // --- Inquiry Form & Modal states ---
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [contactLoading, setContactLoading] = useState(false)
  const [contactSuccess, setContactSuccess] = useState(false)
  const [contactError, setContactError] = useState<string | null>(null)

  // Sync user info into inquiry form if logged in
  useEffect(() => {
    if (session?.user) {
      if (session.user.name) setContactName(session.user.name)
      if (session.user.email) setContactEmail(session.user.email)
    }
  }, [session])

  // --- Keyboard navigation for Photo Slideshow ---
  useEffect(() => {
    if (!isGalleryOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setActiveImageIndex((prev) => (prev === listing.media.length - 1 ? 0 : prev + 1))
      } else if (e.key === 'ArrowLeft') {
        setActiveImageIndex((prev) => (prev === 0 ? listing.media.length - 1 : prev - 1))
      } else if (e.key === 'Escape') {
        setIsGalleryOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isGalleryOpen, listing.media.length])

  // --- Initialize Google Maps ---
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
    if (!apiKey || apiKey === 'your-google-maps-api-key') {
      setMapsLoaded(false)
      return
    }

    setOptions({
      key: apiKey,
      v: 'weekly',
    })

    importLibrary("places").then(() => {
      const google = (window as any).google;
      setMapsLoaded(true)
      const position = { lat: listing.latitude || 28.538336, lng: listing.longitude || -81.379234 }

      if (mapRef.current) {
        const map = new google.maps.Map(mapRef.current, {
          center: position,
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        })

        const svgIcon = {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="#0D9488" stroke="#FFFFFF" stroke-width="2.5" />
              <path d="M16 10h4v6h6v4h-6v6h-4v-6h-6v-4h6v-6z" fill="#FFFFFF" />
            </svg>
          `),
          scaledSize: new google.maps.Size(36, 36),
          anchor: new google.maps.Point(18, 18),
        }

        new google.maps.Marker({
          position,
          map,
          title: listing.title || 'Medical Space',
          icon: svgIcon,
        })
      }
    }).catch((err: any) => {
      console.error('Failed to load Google Maps script', err)
      setMapsLoaded(false)
    })
  }, [listing.latitude, listing.longitude])

  // --- Dynamic Pricing Calculator Logic ---
  const calculateTotal = () => {
    if (!hasPricing) return { quantity: 0, subtotal: 0, total: 0 }

    const activeOption = priceOptions.find((o) => o.id === activeTab)
    if (!activeOption) return { quantity: 0, subtotal: 0, total: 0 }

    const rate = activeOption.price || 0
    let quantity = 0

    if (activeTab === 'hour') {
      const start = new Date(`2000-01-01T${startTime}:00`)
      const end = new Date(`2000-01-01T${endTime}:00`)
      let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      if (diff < 0) diff += 24 // Wrap-around support
      quantity = Math.max(0.5, parseFloat(diff.toFixed(2)))
    } else if (activeTab === 'day') {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffTime = end.getTime() - start.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      quantity = Math.max(1, diffDays)
    } else if (activeTab === 'month') {
      quantity = Math.max(1, durationMonths)
    }

    const subtotal = rate * quantity
    const serviceFee = 35 // Custom medical reservation platform booking fee
    const total = subtotal + serviceFee

    return {
      quantity,
      subtotal: parseFloat(subtotal.toFixed(2)),
      serviceFee,
      total: parseFloat(total.toFixed(2)),
      rateLabel: `$${rate}/${activeOption.unit}`
    }
  }

  const pricingDetails = calculateTotal()

  // --- Contact Host Email Submission ---
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setContactLoading(true)
    setContactError(null)
    setContactSuccess(false)

    try {
      const activeOption = priceOptions.find((o) => o.id === activeTab)
      const rateInfo = activeOption ? `${activeOption.label} Pricing` : undefined
      const dateInfo = activeTab === 'hour'
        ? `${bookingDate} (${startTime} to ${endTime})`
        : activeTab === 'day'
        ? `${startDate} to ${endDate}`
        : `${monthlyStartDate} (${durationMonths} month duration)`

      const res = await fetch(`/api/listings/${listing.id}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          phone: contactPhone || null,
          message: contactMessage,
          startDate: dateInfo,
          priceOption: rateInfo,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit inquiry')

      setContactSuccess(true)
      setContactMessage('')
    } catch (err: any) {
      setContactError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setContactLoading(false)
    }
  }

  // --- Share URL ---
  const handleShare = async () => {
    const url = window.location.href
    const title = listing.title || 'Link Medical Spaces'
    
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        })
      } catch (err) {
        // User cancelled or share failed, fallback to copy
        if ((err as Error).name !== 'AbortError') {
          navigator.clipboard.writeText(url).then(() => {
            setShowShareTooltip(true)
            setTimeout(() => setShowShareTooltip(false), 2000)
          })
        }
      }
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setShowShareTooltip(true)
        setTimeout(() => setShowShareTooltip(false), 2000)
      })
    }
  }

  const formattedHostDate = listing.user?.createdAt
    ? new Date(listing.user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : ''

  const detailPhotoCount = listing.media?.filter((m) => m.type === 'IMAGE' || !m.type).length || 0
  const detailVideoCount = listing.media?.filter((m) => m.type === 'VIDEO').length || 0

  const mainPhotos = listing.media.slice(0, 5)
  const defaultPlaceholder = 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1200'

  return (
    <div className="min-h-screen bg-white pb-20 font-sans">

      {/* ─── Hero Gallery Section (Airbnb Style Grid) ─── */}
      <section className="max-w-7xl mx-auto px-6 pt-6">
        
        {/* Title Details Row */}
        <div className="flex justify-between items-start gap-4 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
              {listing.title || 'Unnamed Medical Space'}
            </h1>
            <p className="text-sm font-semibold text-slate-500 flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4 text-slate-400" />
              {listing.address ? `${listing.address}, ` : ''}
              {listing.city}, {listing.state} {listing.zipCode}
            </p>
            
            {/* Media Counts */}
            {(detailPhotoCount > 0 || detailVideoCount > 0) && (
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-2 text-slate-600 text-xs font-bold bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg shadow-sm">
                  {detailPhotoCount > 0 && (
                    <span className="flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-teal-600" /> {detailPhotoCount} {detailPhotoCount === 1 ? 'Photo' : 'Photos'}
                    </span>
                  )}
                  {detailPhotoCount > 0 && detailVideoCount > 0 && <span className="opacity-40">|</span>}
                  {detailVideoCount > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-teal-600" /> {detailVideoCount} {detailVideoCount === 1 ? 'Video' : 'Videos'}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Action Row & Price */}
          <div className="flex flex-col items-end gap-2 relative">
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-teal-600 hover:bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>

              {/* Share Tooltip */}
              <AnimatePresence>
                {showShareTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute bottom-11 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg whitespace-nowrap shadow-lg z-30"
                  >
                    Link copied!
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={handleToggleSave}
                disabled={isSaving}
                className={`flex items-center justify-center p-2 rounded-lg transition-all ${
                  isSaved
                    ? 'bg-[#1e3a8a] text-white hover:bg-blue-900'
                    : 'bg-[#1e3a8a] text-white hover:bg-blue-900 opacity-90'
                }`}
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-white' : ''}`} />
              </button>
            </div>
            
            {/* Price */}
            <div className="text-xl md:text-2xl font-bold text-red-600">
              {listing.pricePerMonth ? `$${listing.pricePerMonth}/mo` : listing.pricePerDay ? `$${listing.pricePerDay}/day` : listing.pricePerHour ? `$${listing.pricePerHour}/hr` : 'Contact for Price'}
            </div>
          </div>
        </div>



      </section>

      {/* ─── Detail Content & Calculator layout ─── */}
      <section className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] gap-12 items-start">
        
        {/* Left Column — 65% details */}
        <div className="space-y-8">
          
          {/* Image Slider */}
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-white flex items-center justify-center overflow-hidden">
            <img 
              src={listing.media[activeImageIndex]?.originalUrl || defaultPlaceholder} 
              alt="Space" 
              className="w-full h-full object-contain"
            />
            {listing.media.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveImageIndex(prev => prev === 0 ? listing.media.length - 1 : prev - 1) }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#007BFF] hover:text-blue-700 transition-colors"
                >
                  <ChevronLeft className="w-10 h-10 stroke-[2]" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveImageIndex(prev => prev === listing.media.length - 1 ? 0 : prev + 1) }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#007BFF] hover:text-blue-700 transition-colors"
                >
                  <ChevronRight className="w-10 h-10 stroke-[2]" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                  {listing.media.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-colors ${idx === activeImageIndex ? 'bg-[#007BFF]' : 'bg-slate-300'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Overview Card */}
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.05)] p-6 md:p-8 space-y-6">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-6">
              <div className="flex items-start gap-4">
                <Activity className="w-5 h-5 text-red-400 mt-1" />
                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1">Total office area available</p>
                  <p className="text-sm text-slate-800 font-medium">{listing.squareFeet ? `${listing.squareFeet} Sq. Ft.` : 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Building className="w-5 h-5 text-red-400 mt-1" />
                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1">Entire office available for rent</p>
                  <p className="text-sm text-slate-800 font-medium">{listing.rooms ? 'Yes' : 'No'}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Clock className="w-5 h-5 text-red-400 mt-1" />
                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1">Space availability</p>
                  <p className="text-sm text-slate-800 font-medium">Available now</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <FileText className="w-5 h-5 text-red-400 mt-1" />
                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1">Lease type</p>
                  <p className="text-sm text-slate-800 font-medium">{listing.spaceType ? listing.spaceType.replace(/_/g, ' ') : 'Medical Space'}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Metadata badges row */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold px-3 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1 leading-none">
              <Building className="w-3.5 h-3.5 text-teal-600" />
              {listing.spaceType ? listing.spaceType.replace(/_/g, ' ') : 'Medical Space'}
            </span>
            {listing.squareFeet && (
              <span className="bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1 leading-none">
                {listing.squareFeet} Sq. Ft.
              </span>
            )}
            {listing.rooms && (
              <span className="bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1 leading-none">
                {listing.rooms} {listing.rooms === 1 ? 'Room' : 'Rooms'}
              </span>
            )}
          </div>

          <div className="border-t border-slate-100" />

          {/* Description Section */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              About this space
            </h3>
            
            <div className="text-slate-600 text-sm md:text-base leading-relaxed whitespace-pre-line">
              {listing.description ? (
                <>
                  {showFullDesc || listing.description.length <= 400 ? (
                    listing.description
                  ) : (
                    <>
                      {listing.description.substring(0, 400)}...
                      <button
                        onClick={() => setShowFullDesc(true)}
                        className="text-teal-600 hover:text-teal-700 font-bold block mt-2 text-xs uppercase tracking-wider hover:underline"
                      >
                        Show more
                      </button>
                    </>
                  )}
                  {showFullDesc && listing.description.length > 400 && (
                    <button
                      onClick={() => setShowFullDesc(false)}
                      className="text-teal-600 hover:text-teal-700 font-bold block mt-2 text-xs uppercase tracking-wider hover:underline"
                    >
                      Show less
                    </button>
                  )}
                </>
              ) : (
                'No description has been provided for this listing.'
              )}
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* Amenities Grid */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              What this medical space offers
            </h3>

            {listing.amenities && listing.amenities.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {listing.amenities.map((amenity, idx) => {
                  const IconComponent = AMENITY_ICONS[amenity] || Check
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-150 p-3 rounded-2xl transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 flex-shrink-0">
                        <IconComponent className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-slate-700 font-semibold text-xs sm:text-sm">
                        {amenity}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-slate-500 text-xs font-semibold">No amenities listed.</p>
            )}
          </div>

          {/* Video Section (If uploaded) */}
          {listing.media.some(m => m.originalUrl.match(/\.(mp4|webm|ogg)$/i)) && (
            <>
              <div className="border-t border-slate-100" />
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Video className="w-5 h-5 text-teal-600" />
                  Video Walkthrough
                </h3>
                <div className="rounded-3xl overflow-hidden aspect-video border border-slate-200 bg-slate-900 relative">
                  {listing.media
                    .filter(m => m.originalUrl.match(/\.(mp4|webm|ogg)$/i))
                    .map(videoItem => (
                      <video
                        key={videoItem.id}
                        src={videoItem.originalUrl}
                        controls
                        className="w-full h-full"
                      />
                    ))}
                </div>
              </div>
            </>
          )}

          <div className="border-t border-slate-100" />

          {/* Embedded Google Map Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-teal-600" />
              Where you&apos;ll be
            </h3>
            
            <div className="rounded-[28px] overflow-hidden border border-slate-200 bg-slate-50 shadow-sm relative h-80">
              {/* Real Map Container */}
              <div
                ref={mapRef}
                className={`w-full h-full ${mapsLoaded === true ? 'block' : 'hidden'}`}
              />

              {/* Fallback mock map overlay */}
              {mapsLoaded === false && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-300 px-6 font-sans relative">
                  
                  {/* Grid Lines Pattern */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="w-full h-full bg-[radial-gradient(#0D9488_1px,transparent_1px)] [background-size:20px_20px]" />
                  </div>
                  
                  <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mb-3">
                    <MapPin className="w-6 h-6 animate-bounce" />
                  </div>
                  
                  <h4 className="font-extrabold text-sm text-white">Google Maps Preview Mode</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm text-center">
                    Listing location centered at coordinates:<br />
                    <span className="font-mono text-teal-400 font-bold block mt-1">
                      {listing.latitude || 28.538336}, {listing.longitude || -81.379234}
                    </span>
                  </p>
                  
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 uppercase tracking-widest">
                    LinkMedicalSpaces Sandbox fallbacks
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column — Contact Info Card */}
        <div className="lg:sticky lg:top-24">
          <div className="bg-white border border-slate-100 rounded-[16px] p-6 shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-[#3B4D66] mb-2">Contact info</h3>
            
            {!session ? (
              <div className="relative">
                <div className="space-y-4 filter blur-[4px] select-none pointer-events-none opacity-60">
                  <div className="flex items-center gap-3 text-slate-700">
                    <User className="w-5 h-5 text-[#E74C3C]" />
                    <span className="font-bold text-sm">{listing.user?.name || 'Name not provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <Mail className="w-5 h-5 text-[#E74C3C]" />
                    <span className="font-semibold text-sm">{listing.user?.email || 'Email not provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <Phone className="w-5 h-5 text-[#E74C3C]" />
                    <span className="font-semibold text-sm">{listing.user?.phone || 'Phone not provided'}</span>
                  </div>
                  
                  <div className="pt-2 space-y-3">
                    <div className="h-10 w-full rounded border border-slate-300"></div>
                    <div className="h-10 w-full rounded border border-slate-300"></div>
                    <div className="h-10 w-full rounded border border-slate-300"></div>
                    <div className="h-28 w-full rounded border border-slate-300"></div>
                  </div>
                  
                  <div className="h-10 w-24 rounded bg-[#3B4D66] mt-4"></div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center bg-white/10 rounded-lg">
                  <button
                    onClick={() => {
                      const callback = encodeURIComponent(window.location.pathname)
                      router.push(`/signin?callbackUrl=${callback}`)
                    }}
                    className="flex items-center gap-2 border border-[#3B4D66] text-[#3B4D66] bg-white hover:bg-slate-50 font-bold text-sm px-6 py-3 rounded-md transition-all shadow-sm"
                  >
                    <User className="w-4 h-4" />
                    Login To See Details
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-slate-700">
                    <User className="w-5 h-5 text-[#E74C3C]" />
                    <span className="font-bold text-sm text-slate-800">{listing.user?.name || 'Name not provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <Mail className="w-5 h-5 text-[#E74C3C]" />
                    <span className="font-medium text-sm text-slate-600">{listing.user?.email || 'Email not provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <Phone className="w-5 h-5 text-[#E74C3C]" />
                    <span className="font-medium text-sm text-slate-600">{listing.user?.phone || 'Phone not provided'}</span>
                  </div>
                </div>
                
                {contactSuccess ? (
                  <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 flex gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    Your inquiry has been successfully sent to the host. They will get back to you shortly.
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-3 pt-2">
                    {contactError && (
                      <div className="text-red-500 text-xs font-bold bg-red-50 border border-red-100 p-3 rounded-lg">
                        {contactError}
                      </div>
                    )}
                    <input
                      type="text"
                      required
                      placeholder="Name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 transition-colors"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 transition-colors"
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 transition-colors"
                    />
                    <textarea
                      required
                      rows={5}
                      placeholder="Message"
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 transition-colors resize-none"
                    />
                    
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={contactLoading}
                        className="bg-[#2D4566] hover:bg-[#1E3048] text-white font-semibold text-sm px-6 py-2 rounded shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {contactLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <span>Submit</span>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Lightbox Modal Gallery Slideshow ─── */}
      <AnimatePresence>
        {isGalleryOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-6"
          >
            {/* Header controls inside modal */}
            <div className="flex justify-between items-center z-10">
              <span className="text-white text-xs font-bold bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 tracking-widest">
                {activeImageIndex + 1} / {listing.media.length}
              </span>
              <button
                onClick={() => setIsGalleryOpen(false)}
                className="text-white hover:text-slate-300 p-2 hover:bg-white/10 rounded-full transition-all border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image display viewport with navigation arrows */}
            <div className="flex-1 flex items-center justify-between relative max-w-5xl mx-auto w-full">
              
              <button
                onClick={(e) => { e.stopPropagation(); setActiveImageIndex(prev => prev === 0 ? listing.media.length - 1 : prev - 1) }}
                className="bg-white/10 hover:bg-white/20 text-white hover:text-slate-200 border border-white/10 p-3 rounded-full transition-colors flex-shrink-0 z-10"
              >
                <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
              </button>

              <div className="flex-1 h-full max-h-[75vh] flex flex-col items-center justify-center p-4">
                <motion.img
                  key={activeImageIndex}
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.96, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  src={listing.media[activeImageIndex]?.originalUrl || defaultPlaceholder}
                  alt={`Slideshow ${activeImageIndex}`}
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                />
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); setActiveImageIndex(prev => prev === listing.media.length - 1 ? 0 : prev + 1) }}
                className="bg-white/10 hover:bg-white/20 text-white hover:text-slate-200 border border-white/10 p-3 rounded-full transition-colors flex-shrink-0 z-10"
              >
                <ChevronRight className="w-6 h-6 stroke-[2.5]" />
              </button>

            </div>

            {/* Image Captions details */}
            <div className="text-center z-10 max-w-xl mx-auto pb-4">
              <p className="text-white text-sm font-semibold tracking-wide">
                {listing.media[activeImageIndex]?.caption || listing.title}
              </p>
            </div>

          </motion.div>
        )}
      </AnimatePresence>



    </div>
  )
}
