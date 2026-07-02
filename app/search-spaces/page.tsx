'use client'

import {  useState, useEffect, useRef , Suspense } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  Search,
  MapPin,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Map,
  List,
  SlidersHorizontal,
  X,
  ChevronDown,
  Info,
  MapPinned,
  Image as ImageIcon,
  Video
} from 'lucide-react'
import Navbar from '@/components/Navbar'

// Define listings types returned by the backend API
interface ListingMedia {
  id: string
  originalUrl: string
  order: number
  type?: string
}

interface ListingUser {
  id: string
  name: string | null
  image: string | null
  verificationStatus: string | null
}

interface Listing {
  id: string
  title: string | null
  slug: string
  spaceType: string | null
  squareFeet: number | null
  pricePerHour: number | null
  pricePerDay: number | null
  pricePerMonth: number | null
  address: string | null
  city: string | null
  state: string | null
  latitude: number | null
  longitude: number | null
  media: ListingMedia[]
  user: ListingUser | null
}



function SearchSpacesPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: session, status: authStatus } = useSession()

  // --- Search Filters States ---
  const [searchQuery, setSearchQuery] = useState('')
  const [location, setLocation] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [radius, setRadius] = useState(50)
  const [spaceType, setSpaceType] = useState('')
  const [minPrice, setMinPrice] = useState<number | null>(null)
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [startDate, setStartDate] = useState('')

  // --- API Response & UI States ---
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [savedListingIds, setSavedListingIds] = useState<string[]>([])

  // --- Map Toggle & Focused Listing ---
  const [showMap, setShowMap] = useState(false)
  const [focusedListingId, setFocusedListingId] = useState<string | null>(null)

  // --- Dropdown/Popover Open States ---
  const [isPricePopoverOpen, setIsPricePopoverOpen] = useState(false)

  // --- Map and Navigation States ---
  const [mapsLoaded, setMapsLoaded] = useState<boolean | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list')
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null)
  const [activeInfoWindowListing, setActiveInfoWindowListing] = useState<Listing | null>(null)
  const [mapDragged, setMapDragged] = useState(false)

  // Temporary local values for price popover inputs
  const [tempMinPrice, setTempMinPrice] = useState<string>('')
  const [tempMaxPrice, setTempMaxPrice] = useState<string>('')

  // --- Refs ---
  const mapRef = useRef<HTMLDivElement>(null)
  const autocompleteInputRef = useRef<HTMLInputElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const activeInfoWindowRef = useRef<any>(null)

  // Sync state values from the URL query params when page loads or URL changes
  useEffect(() => {
    const q = searchParams.get('query') || ''
    const city = searchParams.get('city') || ''
    const latParam = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null
    const lngParam = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null
    const radParam = searchParams.get('radius') ? parseInt(searchParams.get('radius')!) : 50
    const typeParam = searchParams.get('spaceType') || ''
    const minP = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : null
    const maxP = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : null
    const dateParam = searchParams.get('date') || ''

    setSearchQuery(q)
    setLocation(city)
    setLat(latParam)
    setLng(lngParam)
    setRadius(radParam)
    setSpaceType(typeParam)
    setMinPrice(minP)
    setMaxPrice(maxP)
    setStartDate(dateParam)

    setTempMinPrice(minP !== null ? minP.toString() : '')
    setTempMaxPrice(maxP !== null ? maxP.toString() : '')

    // Trigger API request with current URL parameters
    fetchListingsWithParams({
      query: q,
      city: city,
      lat: latParam,
      lng: lngParam,
      radius: radParam,
      spaceType: typeParam,
      minPrice: minP,
      maxPrice: maxP,
      page: 1
    }, false)
  }, [searchParams])

  // Core function to load listings from the API
  const fetchListingsWithParams = async (
    paramsObj: {
      query?: string
      city?: string
      lat?: number | null
      lng?: number | null
      radius?: number
      spaceType?: string
      minPrice?: number | null
      maxPrice?: number | null
      page?: number
    },
    append = false
  ) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      const pageNum = paramsObj.page || 1
      params.set('page', pageNum.toString())
      params.set('limit', '12')

      if (paramsObj.query) params.set('query', paramsObj.query)
      if (paramsObj.city) params.set('city', paramsObj.city)
      
      if (paramsObj.lat !== undefined && paramsObj.lat !== null) {
        params.set('lat', paramsObj.lat.toString())
      }
      if (paramsObj.lng !== undefined && paramsObj.lng !== null) {
        params.set('lng', paramsObj.lng.toString())
      }
      if (paramsObj.radius) {
        params.set('radius', paramsObj.radius.toString())
      }
      if (paramsObj.spaceType) {
        params.set('spaceType', paramsObj.spaceType)
      }
      if (paramsObj.minPrice !== undefined && paramsObj.minPrice !== null) {
        params.set('minPrice', paramsObj.minPrice.toString())
      }
      if (paramsObj.maxPrice !== undefined && paramsObj.maxPrice !== null) {
        params.set('maxPrice', paramsObj.maxPrice.toString())
      }

      const res = await fetch(`/api/listings?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch spaces')
      const data = await res.json()

      if (append) {
        setListings((prev) => [...prev, ...data.listings])
      } else {
        setListings(data.listings)
      }
      setTotal(data.pagination.total)
      setTotalPages(data.pagination.totalPages)
      setPage(data.pagination.page)
    } catch (err) {
      console.error('[fetchListingsWithParams]', err)
    } finally {
      setLoading(false)
    }
  }

  // Load next page of listings
  const handleLoadMore = () => {
    if (page < totalPages) {
      fetchListingsWithParams({
        query: searchQuery,
        city: location,
        lat,
        lng,
        radius,
        spaceType,
        minPrice,
        maxPrice,
        page: page + 1
      }, true)
    }
  }

  // General helper to update URL search parameters, resetting page to 1
  const updateURL = (newParams: {
    query?: string | null
    city?: string | null
    lat?: number | null
    lng?: number | null
    radius?: number | null
    spaceType?: string | null
    minPrice?: number | null
    maxPrice?: number | null
    date?: string | null
  }) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        params.delete(key)
      } else {
        params.set(key, value.toString())
      }
    })

    params.delete('page') // Reset page on filter update
    router.push(`${pathname}?${params.toString()}`)
  }

  // Setup Google Maps API and Autocomplete
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

      // Fallback location: Orlando, FL
      const defaultLatLng = { lat: lat || 28.538336, lng: lng || -81.379234 }

      if (mapRef.current && !mapInstanceRef.current) {
        const map = new google.maps.Map(mapRef.current, {
          center: defaultLatLng,
          zoom: lat ? 12 : 9,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            {
              featureType: 'poi.business',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        })
        mapInstanceRef.current = map

        // Listener for map movement
        map.addListener('dragend', () => {
          setMapDragged(true)
        })

        // Initialize Places Autocomplete
        if (autocompleteInputRef.current) {
          const autocomplete = new google.maps.places.Autocomplete(autocompleteInputRef.current, {
            types: ['(regions)'],
          })

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace()
            if (!place.geometry || !place.geometry.location) return

            const newLat = place.geometry.location.lat()
            const newLng = place.geometry.location.lng()
            const cityAddress = place.formatted_address || place.name || ''

            map.setCenter({ lat: newLat, lng: newLng })
            map.setZoom(12)
            setMapDragged(false)

            updateURL({
              city: cityAddress,
              lat: newLat,
              lng: newLng,
            })
          })
        }
      }
    }).catch((err: any) => {
      console.error('Failed to load Google Maps script', err)
      setMapsLoaded(false)
    })
  }, [])

  // Sync Google Map Center with URL Lat/Lng
  useEffect(() => {
    if (mapInstanceRef.current && lat && lng) {
      mapInstanceRef.current.setCenter({ lat, lng })
      mapInstanceRef.current.setZoom(12)
    }
  }, [lat, lng])

  // Update Map Markers on Google Map when listings update
  useEffect(() => {
    if (!mapsLoaded || !mapInstanceRef.current) return

    // Clear previous markers
    markersRef.current.forEach((marker: any) => marker.setMap(null))
    markersRef.current = []

    const google = (window as any).google
    if (!google) return

    listings.forEach((listing) => {
      if (listing.latitude === null || listing.longitude === null) return

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

      const marker = new google.maps.Marker({
        position: { lat: listing.latitude, lng: listing.longitude },
        map: mapInstanceRef.current,
        title: listing.title || 'Medical Space',
        icon: svgIcon,
      })

      let displayPrice = ''
      if (listing.pricePerMonth) displayPrice = `$${listing.pricePerMonth}/mo`
      else if (listing.pricePerDay) displayPrice = `$${listing.pricePerDay}/day`
      else if (listing.pricePerHour) displayPrice = `$${listing.pricePerHour}/hr`
      else displayPrice = 'Contact Price'

      const coverUrl = listing.media?.[0]?.originalUrl || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800'
      const spaceTypeLabel = listing.spaceType ? listing.spaceType.replace(/_/g, ' ') : 'Medical Space'

      const infoContent = `
        <div style="width: 220px; font-family: sans-serif; padding: 4px;">
          <div style="position: relative; border-radius: 12px; overflow: hidden; height: 110px; background-color: #f1f5f9; margin-bottom: 8px;">
            <img src="${coverUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <span style="font-size: 10px; font-weight: 700; color: #0d9488; text-transform: uppercase;">${spaceTypeLabel}</span>
            <span style="font-size: 14px; font-weight: 800; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${listing.title || 'Unnamed Space'}</span>
            <span style="font-size: 13px; font-weight: 700; color: #334155; margin-top: 2px;">${displayPrice}</span>
            <a href="/property/${listing.slug}" style="display: block; margin-top: 8px; text-align: center; background-color: #0d9488; color: white; text-decoration: none; font-size: 12px; font-weight: 700; padding: 8px 12px; border-radius: 10px;">
              View Details
            </a>
          </div>
        </div>
      `

      const infoWindow = new google.maps.InfoWindow({
        content: infoContent,
      })

      marker.addListener('click', () => {
        if (activeInfoWindowRef.current) {
          activeInfoWindowRef.current.close()
        }
        infoWindow.open(mapInstanceRef.current, marker)
        activeInfoWindowRef.current = infoWindow
      })

      markersRef.current.push(marker)
    })

    // Fit map bounds to show all markers if coordinates are not locked in URL
    if (listings.length > 0 && !lat && !lng) {
      const bounds = new google.maps.LatLngBounds()
      let valid = false
      listings.forEach((item) => {
        if (item.latitude !== null && item.longitude !== null) {
          bounds.extend({ lat: item.latitude, lng: item.longitude })
          valid = true
        }
      })
      if (valid) {
        mapInstanceRef.current.fitBounds(bounds)
      }
    }
  }, [listings, mapsLoaded])

  // Trigger search on Map Area drag center
  const handleSearchThisArea = () => {
    if (mapInstanceRef.current) {
      const center = mapInstanceRef.current.getCenter()
      const newLat = center.lat()
      const newLng = center.lng()
      setMapDragged(false)
      updateURL({
        lat: newLat,
        lng: newLng,
        city: 'Map Location'
      })
    }
  }

  // Handle manual typing search for Fallback Autocomplete
  // --- Fetch Saved Listings IDs ---
  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetch('/api/saved-listings?idsOnly=true')
        .then(res => res.json())
        .then(data => {
          if (data.ids) setSavedListingIds(data.ids)
        })
        .catch(err => console.error('Failed to fetch saved listing IDs', err))
    }
  }, [authStatus])

  const handleToggleSave = async (e: React.MouseEvent, listingId: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (authStatus !== 'authenticated') {
      router.push('/signin')
      return
    }

    const isSaved = savedListingIds.includes(listingId)
    
    // Optimistic UI update
    setSavedListingIds(prev => 
      isSaved ? prev.filter(id => id !== listingId) : [...prev, listingId]
    )

    try {
      const res = await fetch('/api/saved-listings', {
        method: isSaved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId })
      })
      if (!res.ok) throw new Error('Failed to toggle save')
    } catch (err) {
      console.error(err)
      // Revert on error
      setSavedListingIds(prev => 
        isSaved ? [...prev, listingId] : prev.filter(id => id !== listingId)
      )
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateURL({ query: searchQuery })
  }

  // Clear filters
  const handleResetFilters = () => {
    setSearchQuery('')
    setLocation('')
    setLat(null)
    setLng(null)
    setSpaceType('')
    setMinPrice(null)
    setMaxPrice(null)
    setStartDate('')
    setTempMinPrice('')
    setTempMaxPrice('')
    router.push(pathname)
  }

  // Apply Price Popover filters
  const handleApplyPrice = () => {
    const minVal = tempMinPrice ? parseFloat(tempMinPrice) : null
    const maxVal = tempMaxPrice ? parseFloat(tempMaxPrice) : null
    setIsPricePopoverOpen(false)
    updateURL({
      minPrice: minVal,
      maxPrice: maxVal,
    })
  }

  // --- Simulated Map Markers Positioning helpers ---
  // Calculates boundaries for placing dots absolutely on our custom UI map container
  const getSimulatedCoordinates = () => {
    const coords = listings
      .filter((l) => l.latitude !== null && l.longitude !== null)
      .map((l) => ({ lat: l.latitude!, lng: l.longitude!, id: l.id, listing: l }))

    if (coords.length === 0) return []

    // Find boundaries
    const lats = coords.map((c) => c.lat)
    const lngs = coords.map((c) => c.lng)
    const minLatVal = Math.min(...lats)
    const maxLatVal = Math.max(...lats)
    const minLngVal = Math.min(...lngs)
    const maxLngVal = Math.max(...lngs)

    const latRange = maxLatVal - minLatVal || 0.05
    const lngRange = maxLngVal - minLngVal || 0.05

    // Return percentage markers with slight padding
    return coords.map((c) => {
      const x = ((c.lng - minLngVal) / lngRange) * 80 + 10 // Center values in a 10%-90% window
      const y = 90 - (((c.lat - minLatVal) / latRange) * 80 + 10) // Invert Y for screen dimensions
      return { ...c, x, y }
    })
  }

  const simulatedMarkers = getSimulatedCoordinates()

  // Handle focusing a specific listing on the map
  const handleViewOnMap = (listing: Listing) => {
    setShowMap(true)
    setFocusedListingId(listing.id)
    
    if (mapInstanceRef.current && listing.latitude && listing.longitude) {
      mapInstanceRef.current.setCenter({ lat: listing.latitude, lng: listing.longitude })
      mapInstanceRef.current.setZoom(15)
      
      // Open the marker's info window
      const google = (window as any).google
      if (google) {
        const markerIndex = listings.findIndex(l => l.id === listing.id)
        if (markerIndex >= 0 && markersRef.current[markerIndex]) {
          const marker = markersRef.current[markerIndex]
          if (activeInfoWindowRef.current) {
            activeInfoWindowRef.current.close()
          }
          google.maps.event.trigger(marker, 'click')
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      
      <Navbar />

      {/* ─── Search / Filter Toolbar ─── */}
      <section className="bg-white border-b border-slate-200 py-3.5 px-6 sticky top-[68px] z-40 shadow-sm">
        <div className="max-w-[1800px] mx-auto flex flex-wrap items-center gap-3 justify-between">
          
          <div className="flex flex-wrap items-center gap-3 flex-1">
            
            {/* Google Places Autocomplete */}
            <div className="relative w-full sm:w-[240px]">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={autocompleteInputRef}
                type="text"
                placeholder="Search location/city..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-9 pr-8 py-2 w-full border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl text-sm font-semibold outline-none text-slate-800 placeholder-slate-400 transition-all bg-slate-50/50"
              />
              {location && (
                <button
                  onClick={() => { setLocation(''); setLat(null); setLng(null); updateURL({ city: '', lat: null, lng: null }) }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Price Popover */}
            <div className="relative">
              <button
                onClick={() => setIsPricePopoverOpen(!isPricePopoverOpen)}
                className={`flex items-center justify-between gap-1.5 px-4 py-2 border rounded-xl text-sm font-semibold transition-all ${
                  minPrice !== null || maxPrice !== null
                    ? 'border-teal-600 bg-teal-50/60 text-teal-800'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 bg-white'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                {minPrice !== null || maxPrice !== null
                  ? `${minPrice !== null ? `$${minPrice}` : '$0'} - ${maxPrice !== null ? `$${maxPrice}` : '∞'}`
                  : 'Price Range'}
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              <AnimatePresence>
                {isPricePopoverOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsPricePopoverOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 p-5 space-y-4"
                    >
                      <h4 className="font-bold text-slate-800 text-sm">Filter by Price Range</h4>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Min Price ($)</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={tempMinPrice}
                            onChange={(e) => setTempMinPrice(e.target.value)}
                            className="w-full border border-slate-200 px-3 py-2 rounded-xl text-sm font-semibold outline-none focus:border-teal-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Max Price ($)</label>
                          <input
                            type="number"
                            placeholder="10000"
                            value={tempMaxPrice}
                            onChange={(e) => setTempMaxPrice(e.target.value)}
                            className="w-full border border-slate-200 px-3 py-2 rounded-xl text-sm font-semibold outline-none focus:border-teal-500"
                          />
                        </div>
                      </div>

                      {/* Presets */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Presets</label>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { label: 'Under $150', min: null, max: 150 },
                            { label: '$150 - $500', min: 150, max: 500 },
                            { label: '$500 - $2k', min: 500, max: 2000 },
                            { label: '$2k+', min: 2000, max: null }
                          ].map((p, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setTempMinPrice(p.min !== null ? p.min.toString() : '')
                                setTempMaxPrice(p.max !== null ? p.max.toString() : '')
                              }}
                              className="text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1 rounded-lg transition-colors"
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => {
                            setTempMinPrice('')
                            setTempMaxPrice('')
                            setIsPricePopoverOpen(false)
                            updateURL({ minPrice: null, maxPrice: null })
                          }}
                          className="flex-1 text-slate-500 bg-slate-50 hover:bg-slate-100 text-xs font-bold py-2 rounded-xl border border-slate-200 transition-colors"
                        >
                          Clear
                        </button>
                        <button
                          onClick={handleApplyPrice}
                          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2 rounded-xl shadow transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

          </div>

          {/* Right side: Reset Filters + Map Toggle */}
          <div className="flex items-center gap-2">
            {(searchQuery || location || spaceType || minPrice !== null || maxPrice !== null) && (
              <button
                onClick={handleResetFilters}
                className="text-teal-600 hover:text-teal-700 font-bold text-xs flex items-center gap-1.5 hover:underline py-2 px-3 rounded-lg hover:bg-teal-50/50 transition-all"
              >
                Reset Filters
              </button>
            )}

            {/* Showing X of Y */}
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Showing {listings.length} of {total}
            </span>

            {/* Map Toggle Switch */}
            <div className="hidden sm:flex items-center gap-3 border border-slate-200 bg-white px-4 py-2 rounded-xl">
              <span className="text-sm font-bold text-slate-800">Map view</span>
              <button
                onClick={() => setShowMap(!showMap)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
                  showMap ? 'bg-teal-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${
                    showMap ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ─── Main Content Split Screen Layout ─── */}
      <main className="flex-1 relative flex overflow-hidden">
        
        {/* Left Side: Listing Grid */}
        <section
          className={`flex flex-col h-[calc(100vh-140px)] overflow-y-auto transition-all duration-500 ease-in-out ${
            mobileView === 'list' ? 'block' : 'hidden lg:block'
          } ${
            showMap ? 'w-full lg:w-[60%]' : 'w-full'
          }`}
        >
          <div className={`px-6 py-6 mx-auto w-full flex-1 flex flex-col justify-between ${
            showMap ? 'max-w-4xl' : 'max-w-[1800px]'
          }`}>
            <div>
              {/* Meta stats info */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
                    Search Results
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 mt-2">
                    {loading && listings.length === 0 ? (
                      'Finding medical spaces...'
                    ) : (
                      `${total} ${total === 1 ? 'Space' : 'Spaces'} available`
                    )}
                    {location && <span className="text-teal-600"> near {location.split(',')[0]}</span>}
                  </h2>
                </div>
              </div>

              {/* Grid listings */}
              {loading && listings.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
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
                <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 px-6 mt-4">
                  <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <SlidersHorizontal className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">No matching spaces found</h3>
                  <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
                    Try broadening your filters, expanding your location bounds, or resetting the pricing queries.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="mt-5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div className={`grid gap-5 ${
                    showMap
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  }`}>
                  {listings.map((item) => (
                    <ListingGridCard
                      key={item.id}
                      listing={item}
                      onMouseEnter={() => setHoveredListingId(item.id)}
                      onMouseLeave={() => setHoveredListingId(null)}
                      isSaved={savedListingIds.includes(item.id)}
                      onToggleSave={(e) => handleToggleSave(e, item.id)}
                      onViewOnMap={() => handleViewOnMap(item)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Pagination Load More */}
            {page < totalPages && (
              <div className="text-center pt-10 pb-8 mt-4 border-t border-slate-100">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-slate-400 font-extrabold text-sm px-6 py-3 rounded-2xl transition-all shadow-sm disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {loading ? 'Loading...' : 'Load More Spaces'}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Right Side: Map — slides in/out */}
        <section
          className={`h-[calc(100vh-140px)] border-l border-slate-200 bg-slate-50 relative overflow-hidden transition-all duration-500 ease-in-out ${
            mobileView === 'map' ? 'block w-full' : 'hidden lg:block'
          } ${
            showMap ? 'lg:w-[40%]' : 'lg:w-0 lg:border-l-0'
          }`}
        >
          {/* Real Google Maps Container */}
          <div
            ref={mapRef}
            className={`w-full h-full ${mapsLoaded === true ? 'block' : 'hidden'}`}
          />

          {/* Floating Search this Area button */}
          {mapsLoaded && mapDragged && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
              <button
                onClick={handleSearchThisArea}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-black px-4 py-2.5 rounded-full shadow-lg flex items-center gap-1.5 transition-all transform hover:scale-105 active:scale-95"
              >
                <Search className="w-3.5 h-3.5" />
                Search this area
              </button>
            </div>
          )}

          {/* ─── Simulated Map Fallback UI ─── */}
          {mapsLoaded === false && (
            <div className="w-full h-full flex flex-col justify-between p-6 relative bg-slate-900 overflow-hidden font-sans">
              
              {/* Abstract Map Grid Lines & Background */}
              <div className="absolute inset-0 opacity-15 pointer-events-none">
                <div className="w-full h-full bg-[radial-gradient(#0D9488_1px,transparent_1px)] [background-size:24px_24px]" />
                <svg className="w-full h-full absolute inset-0 text-teal-500 opacity-20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 0 100 Q 200 150 400 50 T 800 200" fill="none" stroke="currentColor" strokeWidth="3" />
                  <path d="M 100 0 Q 300 400 600 200" fill="none" stroke="currentColor" strokeWidth="2" />
                  <circle cx="200" cy="120" r="100" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" />
                  <circle cx="500" cy="250" r="150" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" />
                </svg>
              </div>

              {/* Warning Banner */}
              <div className="bg-slate-800/80 border border-slate-700 text-slate-300 p-3 rounded-2xl text-xs flex items-start gap-2.5 z-10 backdrop-blur-md max-w-sm mx-auto shadow-xl">
                <Info className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-teal-400 block mb-0.5">Google Maps Sandbox Mode</span>
                  Active listings are placed on this simulated interactive board using their actual relative coordinate vectors. Click any pin to test the details window.
                </div>
              </div>

              {/* Simulated Interactive Markers */}
              <div className="flex-1 w-full relative">
                {simulatedMarkers.map((marker) => {
                  const isHovered = hoveredListingId === marker.id
                  const isSelected = activeInfoWindowListing?.id === marker.id
                  
                  return (
                    <div
                      key={marker.id}
                      className="absolute transition-all duration-300"
                      style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                    >
                      {/* Medical Cross Pin */}
                      <button
                        onClick={() => setActiveInfoWindowListing(marker.listing)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center border-2 border-white shadow-lg transition-transform ${
                          isHovered || isSelected
                            ? 'bg-teal-500 scale-125 z-30'
                            : 'bg-teal-600 hover:scale-110 z-20'
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-white">
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                      </button>

                      {/* Small text tag */}
                      <span className="absolute top-10 left-1/2 -translate-x-1/2 bg-slate-800/90 text-[10px] font-bold text-white px-2 py-0.5 rounded shadow whitespace-nowrap opacity-60 pointer-events-none">
                        {marker.listing.pricePerMonth ? `$${marker.listing.pricePerMonth}/mo` : marker.listing.pricePerHour ? `$${marker.listing.pricePerHour}/hr` : 'Click'}
                      </span>
                    </div>
                  )
                })}

                {/* Simulated Info Popover Card */}
                <AnimatePresence>
                  {activeInfoWindowListing && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      className="absolute bottom-6 left-1/2 -translate-x-1/2 w-64 bg-slate-800 border border-slate-700 rounded-3xl p-4 shadow-2xl z-40 text-left font-sans"
                    >
                      <button
                        onClick={() => setActiveInfoWindowListing(null)}
                        className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 hover:bg-slate-700/50 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-700 mb-3">
                        <img
                          src={activeInfoWindowListing.media?.[0]?.originalUrl || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800'}
                          alt={activeInfoWindowListing.title || ''}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider block">
                        {activeInfoWindowListing.spaceType ? activeInfoWindowListing.spaceType.replace(/_/g, ' ') : 'Medical Space'}
                      </span>
                      <h4 className="font-extrabold text-white text-sm mt-0.5 truncate">
                        {activeInfoWindowListing.title || 'Unnamed Space'}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 truncate">
                        {activeInfoWindowListing.city}, {activeInfoWindowListing.state}
                      </p>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700">
                        <span className="font-extrabold text-white text-sm">
                          {activeInfoWindowListing.pricePerMonth
                            ? `$${activeInfoWindowListing.pricePerMonth}/mo`
                            : activeInfoWindowListing.pricePerDay
                            ? `$${activeInfoWindowListing.pricePerDay}/day`
                            : activeInfoWindowListing.pricePerHour
                            ? `$${activeInfoWindowListing.pricePerHour}/hr`
                            : 'Contact Price'}
                        </span>
                        <a
                          href={`/property/${activeInfoWindowListing.slug}`}
                          className="bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-md active:scale-95"
                        >
                          View Details
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Status footer for fallback */}
              <div className="text-center text-[10px] text-slate-500 z-10">
                Interactive relative map mock coordinates — LinkMedicalSpaces
              </div>

            </div>
          )}

        </section>
      </main>

      {/* Floating Toggle Button for Mobile View */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 lg:hidden">
        <button
          onClick={() => setMobileView(mobileView === 'list' ? 'map' : 'list')}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-5 py-3 rounded-full flex items-center gap-2 shadow-2xl transition-all scale-105 active:scale-95 border border-slate-800"
        >
          {mobileView === 'list' ? (
            <>
              <Map className="w-4 h-4 text-teal-400" />
              <span>Map View</span>
            </>
          ) : (
            <>
              <List className="w-4 h-4 text-teal-400" />
              <span>List View</span>
            </>
          )}
        </button>
      </div>

    </div>
  )
}

// ─── Custom Listing Grid Card Component (Redesigned) ───
interface GridCardProps {
  listing: Listing
  onMouseEnter: () => void
  onMouseLeave: () => void
  isSaved?: boolean
  onToggleSave?: (e: React.MouseEvent) => void
  onViewOnMap?: () => void
}

function ListingGridCard({ listing, onMouseEnter, onMouseLeave, isSaved, onToggleSave, onViewOnMap }: GridCardProps) {
  const router = useRouter()
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const mediaList = listing.media && listing.media.length > 0
    ? listing.media
    : [{ id: 'fallback', originalUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800', order: 0 }]

  const cardPhotoCount = listing.media?.filter((m) => m.type === 'IMAGE' || !m.type).length || 0
  const cardVideoCount = listing.media?.filter((m) => m.type === 'VIDEO').length || 0

  let displayPrice = ''
  if (listing.pricePerMonth) displayPrice = `$${listing.pricePerMonth}/mo`
  else if (listing.pricePerDay) displayPrice = `$${listing.pricePerDay}/day`
  else if (listing.pricePerHour) displayPrice = `$${listing.pricePerHour}/hr`
  else displayPrice = 'Contact Price'

  // Build subtitle: sqft | spaceType
  // Build subtitle: sqft only
  const subtitleParts: string[] = []
  if (listing.squareFeet) subtitleParts.push(`${listing.squareFeet}sq.ft`)
  const subtitle = subtitleParts.join(' | ')

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

  const handleViewOnMapClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onViewOnMap?.()
  }

  return (
    <div
      onMouseEnter={() => {
        setIsHovered(true)
        onMouseEnter()
      }}
      onMouseLeave={() => {
        setIsHovered(false)
        onMouseLeave()
      }}
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
            <div key={m.id || idx} className="h-full w-full flex-shrink-0 relative bg-black/5" style={{ minWidth: '100%' }}>
              {m.type === 'VIDEO' ? (
                <video
                  src={m.originalUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  onClick={(e) => {
                    e.stopPropagation()
                    const video = e.currentTarget
                    if (video.paused) {
                      video.play()
                    } else {
                      video.pause()
                    }
                  }}
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={m.originalUrl}
                  alt={`${listing.title || 'Space'} - ${idx + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}
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
              // Show max 5 dots with sliding window
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
          onClick={onToggleSave}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow transition-all hover:scale-110 active:scale-90"
        >
          <Heart className={`w-4 h-4 transition-colors ${isSaved ? 'text-rose-500 fill-rose-500' : 'text-slate-500'}`} />
        </button>

        {/* View on Map Button */}
        <button
          onClick={handleViewOnMapClick}
          className="absolute bottom-3 right-3 z-20 bg-white/90 hover:bg-white text-slate-700 text-[11px] font-medium px-2.5 py-1 rounded-lg shadow flex items-center gap-1 transition-all hover:shadow-md"
        >
          <MapPinned className="w-3 h-3" />
          View on map
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

        {/* Price + subtitle + Media Counts */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-baseline">
            <span className="text-lg font-bold text-slate-900">{displayPrice}</span>
            {subtitle && (
              <span className="text-slate-400 text-xs ml-2">{subtitle}</span>
            )}
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
      </div>

    </div>
  )
}


export default function SearchSpacesPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SearchSpacesPage />
    </Suspense>
  );
}
