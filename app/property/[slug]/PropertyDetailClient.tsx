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
  ArrowLeft
} from 'lucide-react'

interface ListingMedia {
  id: string
  originalUrl: string
  caption: string | null
  order: number
}

interface ListingUser {
  id: string
  name: string | null
  image: string | null
  verificationStatus: string | null
  createdAt: string
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
  const [showShareTooltip, setShowShareTooltip] = useState(false)

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

  // --- Copy Share URL ---
  const handleCopyLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      setShowShareTooltip(true)
      setTimeout(() => setShowShareTooltip(false), 2000)
    })
  }

  // --- Formatted Host Join Date ---
  const formattedHostDate = listing.user?.createdAt
    ? new Date(listing.user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : ''

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
          </div>
          
          {/* Action Row */}
          <div className="flex items-center gap-2 relative">
            <button
              onClick={handleCopyLink}
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
              onClick={() => setIsSaved(!isSaved)}
              className={`flex items-center gap-1.5 text-xs font-bold border rounded-xl px-3 py-2 transition-all ${
                isSaved
                  ? 'border-rose-200 bg-rose-50 text-rose-600'
                  : 'border-slate-200 hover:text-rose-600 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>

        {/* Gallery Image Grid */}
        <div className="relative rounded-[28px] overflow-hidden bg-slate-100 shadow-sm border border-slate-200 aspect-[2.1/1] hidden md:grid grid-cols-2 gap-2">
          
          {/* Main Primary Image */}
          <div
            onClick={() => { setActiveImageIndex(0); setIsGalleryOpen(true) }}
            className="w-full h-full cursor-pointer overflow-hidden relative group"
          >
            <img
              src={mainPhotos[0]?.originalUrl || defaultPlaceholder}
              alt="Space Primary"
              className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all" />
          </div>

          {/* Secondary 2x2 Grid */}
          <div className="grid grid-cols-2 gap-2">
            {[...Array(4)].map((_, index) => {
              const photoIdx = index + 1
              const photo = mainPhotos[photoIdx]
              return (
                <div
                  key={index}
                  onClick={() => { setActiveImageIndex(photo ? photoIdx : 0); setIsGalleryOpen(true) }}
                  className="w-full h-full cursor-pointer overflow-hidden relative group bg-slate-200"
                >
                  {photo ? (
                    <>
                      <img
                        src={photo.originalUrl}
                        alt={`Space Media ${photoIdx}`}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all" />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                      LinkMedicalSpaces
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* "Show all photos" trigger */}
          <button
            onClick={() => { setActiveImageIndex(0); setIsGalleryOpen(true) }}
            className="absolute bottom-5 right-5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Building className="w-3.5 h-3.5" />
            Show all photos ({listing.media.length})
          </button>
        </div>

        {/* Mobile Carousel representation */}
        <div className="relative md:hidden rounded-2xl overflow-hidden aspect-[4/3] bg-slate-100 shadow">
          <img
            src={listing.media[activeImageIndex]?.originalUrl || defaultPlaceholder}
            alt="Space Mobile"
            className="w-full h-full object-cover"
          />
          {listing.media.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveImageIndex(prev => prev === 0 ? listing.media.length - 1 : prev - 1) }}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-white/90 p-1.5 rounded-full shadow"
              >
                <ChevronLeft className="w-4 h-4 text-slate-800" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveImageIndex(prev => prev === listing.media.length - 1 ? 0 : prev + 1) }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-white/90 p-1.5 rounded-full shadow"
              >
                <ChevronRight className="w-4 h-4 text-slate-800" />
              </button>
              <div className="absolute bottom-3 right-3 bg-black/75 text-white font-bold text-[10px] px-2 py-0.5 rounded">
                {activeImageIndex + 1} / {listing.media.length}
              </div>
            </>
          )}
        </div>

      </section>

      {/* ─── Detail Content & Calculator layout ─── */}
      <section className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] gap-12 items-start">
        
        {/* Left Column — 65% details */}
        <div className="space-y-8">
          
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

          <div className="border-t border-slate-100" />

          {/* About the host Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-teal-600" />
              About the host
            </h3>

            {listing.user ? (
              <div className="flex items-start gap-4 p-5 border border-slate-200 rounded-3xl bg-slate-50/50 hover:bg-slate-50 transition-all max-w-lg">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 border border-slate-300 flex-shrink-0">
                  <img
                    src={listing.user.image || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}
                    alt={listing.user.name || 'Host'}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-extrabold text-slate-950 text-base">
                      {listing.user.name || 'Space Provider'}
                    </h4>
                  </div>
                  {formattedHostDate && (
                    <p className="text-slate-400 text-[11px] pt-1">
                      Joined LinkMedicalSpaces in {formattedHostDate}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-xs font-semibold">Host details are not specified.</p>
            )}
          </div>

        </div>

        {/* Right Column — 35% Sticky booking calculator */}
        <div className="lg:sticky lg:top-24">
          <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-xl space-y-6">
            
            {/* Header Pricing Tag */}
            <div>
              {hasPricing ? (
                <div className="space-y-1">
                  <div className="flex items-baseline text-slate-900 gap-1">
                    <span className="text-2xl font-black text-teal-600">
                      {activeTab === 'hour' && `$${listing.pricePerHour}`}
                      {activeTab === 'day' && `$${listing.pricePerDay}`}
                      {activeTab === 'month' && `$${listing.pricePerMonth}`}
                    </span>
                    <span className="text-slate-500 font-bold text-sm">
                      /{activeTab === 'hour' ? 'hour' : activeTab === 'day' ? 'day' : 'month'}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    Select a tier below to calculate total cost
                  </p>
                </div>
              ) : (
                <span className="text-xl font-extrabold text-slate-800">Contact for Pricing</span>
              )}
            </div>

            {/* Pricing Tabs Selector (Hours/Days/Months) */}
            {hasPricing && priceOptions.length > 1 && (
              <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 border border-slate-200/50">
                {priceOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setActiveTab(opt.id)}
                    className={`flex-1 text-center py-2.5 rounded-xl text-xs font-black transition-all ${
                      activeTab === opt.id
                        ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* Form inputs depending on active Tab */}
            {hasPricing && (
              <div className="space-y-4 border-y border-slate-100 py-5">
                
                {activeTab === 'hour' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Select Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="date"
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-semibold outline-none focus:border-teal-500 transition-colors bg-slate-50/50"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Start Time</label>
                        <div className="relative">
                          <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-semibold outline-none focus:border-teal-500 transition-colors bg-slate-50/50"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">End Time</label>
                        <div className="relative">
                          <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-semibold outline-none focus:border-teal-500 transition-colors bg-slate-50/50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'day' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Start Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-semibold outline-none focus:border-teal-500 transition-colors bg-slate-50/50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">End Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-semibold outline-none focus:border-teal-500 transition-colors bg-slate-50/50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'month' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Start Month</label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="date"
                          value={monthlyStartDate}
                          onChange={(e) => setMonthlyStartDate(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-semibold outline-none focus:border-teal-500 transition-colors bg-slate-50/50"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Duration (Months)</label>
                      <select
                        value={durationMonths}
                        onChange={(e) => setDurationMonths(parseInt(e.target.value))}
                        className="w-full border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-semibold outline-none focus:border-teal-500 transition-colors bg-slate-50/50 cursor-pointer"
                      >
                        {[1, 2, 3, 6, 12, 24].map((m) => (
                          <option key={m} value={m}>
                            {m} {m === 1 ? 'Month' : 'Months'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Total Price breakdown */}
            {hasPricing && pricingDetails.quantity > 0 && (
              <div className="space-y-3 text-sm border-b border-slate-100 pb-5">
                <div className="flex justify-between items-center text-slate-600 font-medium">
                  <span>
                    {pricingDetails.rateLabel} × {pricingDetails.quantity}{' '}
                    {activeTab === 'hour' ? (pricingDetails.quantity === 1 ? 'hour' : 'hours') : activeTab === 'day' ? (pricingDetails.quantity === 1 ? 'day' : 'days') : (pricingDetails.quantity === 1 ? 'month' : 'months')}
                  </span>
                  <span className="font-bold text-slate-800">${pricingDetails.subtotal}</span>
                </div>
                
                <div className="flex justify-between items-center text-slate-600 font-medium">
                  <span>Medical Reservation Fee</span>
                  <span className="font-bold text-slate-800">${pricingDetails.serviceFee}</span>
                </div>

                <div className="flex justify-between items-center text-base font-black text-slate-900 pt-2.5 border-t border-dashed border-slate-200">
                  <span>Estimated Total</span>
                  <span className="text-teal-600">${pricingDetails.total}</span>
                </div>
              </div>
            )}

            {/* Inquiry/Action buttons */}
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm py-4 rounded-2xl shadow-lg shadow-teal-600/20 transition-all hover:scale-[1.01] active:scale-98 flex items-center justify-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              {hasPricing ? 'Request to Book Space' : 'Contact Lister'}
            </button>
            
            <p className="text-[10px] text-center text-slate-400 font-semibold tracking-wider uppercase">
              You won&apos;t be charged yet — Contacting is free
            </p>

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

      {/* ─── Contact Form Overlay Modal Slide-In ─── */}
      <AnimatePresence>
        {isContactModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            
            {/* Dark background layer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsContactModalOpen(false); setContactSuccess(false) }}
              className="absolute inset-0 bg-slate-950"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative z-10 border border-slate-100 p-6 sm:p-8"
            >
              
              <button
                onClick={() => { setIsContactModalOpen(false); setContactSuccess(false) }}
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors border border-slate-200/50"
              >
                <X className="w-4 h-4" />
              </button>

              {contactSuccess ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mx-auto shadow-sm">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-xl font-extrabold text-slate-900">Inquiry Sent Successfully</h3>
                    <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                      We have sent your details and reservation requests to the host. They will review your dates and reply directly to your email.
                    </p>
                  </div>

                  <button
                    onClick={() => { setIsContactModalOpen(false); setContactSuccess(false) }}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm px-6 py-3 rounded-2xl transition-all shadow-md active:scale-95 mt-4"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  
                  <div className="space-y-1.5">
                    <h3 className="text-xl font-black text-slate-900 leading-none">Inquire about this space</h3>
                    <p className="text-slate-400 text-xs font-semibold">Send a message directly to the space lister</p>
                  </div>

                  {contactError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3.5 rounded-2xl">
                      {contactError}
                    </div>
                  )}

                  {/* Pricing Breakdown inside contact form */}
                  {hasPricing && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex justify-between items-center text-xs font-bold text-slate-600">
                      <span>Booking Option:</span>
                      <span className="text-teal-600 font-extrabold capitalize bg-teal-50 border border-teal-100 rounded-lg px-2.5 py-0.5">
                        {activeTab} • Estimated Total: ${pricingDetails.total}
                      </span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Your Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-teal-500 transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Your Email</label>
                        <input
                          type="email"
                          required
                          placeholder="doctor@example.com"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-teal-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Phone Number (Optional)</label>
                        <input
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-teal-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Your Message</label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Hi! I am looking to rent this space. Could you provide details on check-in or access instructions?"
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-teal-500 transition-colors resize-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={contactLoading}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {contactLoading ? (
                      <>
                        <Loader2 className="w-4.5 h-4.5 animate-spin" />
                        <span>Sending message...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Inquiry Email</span>
                      </>
                    )}
                  </button>
                  
                </form>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
