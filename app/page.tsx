'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader } from '@googlemaps/js-api-loader'
import {
  Building,
  Search,
  MapPin,
  Stethoscope,
  Scissors,
  Microscope,
  Shield,
  Star,
  Users,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import TestimonialSlider from '@/components/TestimonialSlider'
import AvailableSpacesPlaceholder from '@/components/AvailableSpacesPlaceholder'

const CATEGORIES = [
  {
    icon: Stethoscope,
    label: 'Exam Rooms',
    value: 'EXAM_ROOM',
    description: 'Equipped medical chambers for consultations & exams',
  },
  {
    icon: Building,
    label: 'Dental Practices',
    value: 'DENTAL_OFFICE',
    description: 'Chairs & suites ready for general or specialist dentistry',
  },
  {
    icon: Scissors,
    label: 'Surgical Suites',
    value: 'SURGICAL_SUITE',
    description: 'Sterile outpatient surgical rooms & recovery bays',
  },
  {
    icon: Microscope,
    label: 'Labs & Research',
    value: 'LAB',
    description: 'Diagnostic labs with professional grade services',
  },
]

export default function Home() {
  const router = useRouter()
  
  // Search parameters
  const [location, setLocation] = useState('')
  const [otherLocation, setOtherLocation] = useState('')
  const [spaceType, setSpaceType] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  
  const autocompleteInputRef = useRef<HTMLInputElement>(null)

  // Initialize autocomplete for main hero search box
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
    if (!apiKey || apiKey === 'your-google-maps-api-key') return

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places'],
    }) as any

    loader.load().then((google: any) => {
      if (autocompleteInputRef.current) {
        const autocomplete = new google.maps.places.Autocomplete(autocompleteInputRef.current, {
          types: ['(regions)'],
        })

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          if (!place.geometry || !place.geometry.location) return

          setLat(place.geometry.location.lat())
          setLng(place.geometry.location.lng())
          setOtherLocation(place.formatted_address || place.name || '')
        })
      }
    }).catch((err: any) => {
      console.error('Failed to load Google Maps inside home', err)
    })
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    
    const finalLocation = location === 'Other' ? otherLocation : location
    if (finalLocation) params.set('city', finalLocation)
    if (spaceType) params.set('spaceType', spaceType)
    if (lat !== null) params.set('lat', lat.toString())
    if (lng !== null) params.set('lng', lng.toString())

    router.push(`/search-spaces?${params.toString()}`)
  }

  const selectCategory = (val: string) => {
    router.push(`/search-spaces?spaceType=${val}`)
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-white border-b border-slate-100 overflow-hidden py-16 sm:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50/30 via-transparent to-slate-50 opacity-70" />
        
        <div className="max-w-[1200px] mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Airbnb for Medical Office Listings</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
              <span className="text-slate-800">Find &amp; Book</span> <br />
              <span className="text-slate-800">Specialized</span> <br />
              <span className="text-teal-600">Medical</span> <span className="text-slate-800">Spaces</span>
            </h1>
            
            <p className="text-slate-600 text-base sm:text-lg max-w-xl leading-relaxed">
              Connect with clinics, hospitals, and medical hosts offering fully-equipped exam rooms, dental operatories, surgical suites, and laboratories. Rent by the hour, day, or month.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100/70 px-4 py-2 rounded-xl">
                <Shield className="w-4 h-4 text-teal-600" />
                <span>Verified Provider Profiles</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100/70 px-4 py-2 rounded-xl">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>HIPAA-Compliant Layouts</span>
              </div>
            </div>
          </div>

          {/* Hero Right: Search Card Container */}
          <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-100/80">
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Search spaces</h3>
            <p className="text-slate-500 text-xs font-medium mb-6">Discover clinical environments near you</p>
            
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Location</label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 hover:border-slate-350 rounded-xl px-3 py-3 transition-colors">
                    <MapPin className="w-4.5 h-4.5 text-slate-400" />
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="bg-transparent text-sm font-semibold outline-none text-slate-800 w-full cursor-pointer appearance-none"
                    >
                      <option value="">Select Location</option>
                      <option value="Orlando, FL">Orlando, FL</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {location === 'Other' && (
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 hover:border-slate-350 rounded-xl px-3 py-3 transition-colors">
                      <input
                        ref={autocompleteInputRef}
                        type="text"
                        placeholder="Enter state or province name..."
                        value={otherLocation}
                        onChange={(e) => setOtherLocation(e.target.value)}
                        className="bg-transparent text-sm font-semibold outline-none text-slate-800 placeholder-slate-400 w-full"
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Space Type</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 hover:border-slate-350 rounded-xl px-3 py-3 transition-colors">
                  <Building className="w-4.5 h-4.5 text-slate-400" />
                  <select
                    value={spaceType}
                    onChange={(e) => setSpaceType(e.target.value)}
                    className="bg-transparent text-sm font-semibold outline-none text-slate-800 w-full cursor-pointer"
                  >
                    <option value="">All Space Types</option>
                    <option value="EXAM_ROOM">Exam Room</option>
                    <option value="DENTAL_OFFICE">Dental Office</option>
                    <option value="SURGICAL_SUITE">Surgical Suite</option>
                    <option value="LAB">Laboratory</option>
                    <option value="THERAPY_ROOM">Therapy Room</option>
                    <option value="IMAGING_CENTER">Imaging Center</option>
                    <option value="FULL_OFFICE">Full Medical Office</option>
                    <option value="MEDICAL_SPA">Medical Spa</option>
                    <option value="URGENT_CARE">Urgent Care</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-teal-600/10 flex items-center justify-center gap-2 active:scale-[0.98] transition-all pt-3"
              >
                <Search className="w-4 h-4" />
                <span>Search Available Spaces</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16 max-w-[1200px] mx-auto px-6 w-full">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Browse by Medical Category</h2>
          <p className="text-slate-500 text-sm mt-2 font-medium">Select a category to filter listings instantly</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORIES.map((cat, idx) => {
            const Icon = cat.icon
            return (
              <div
                key={idx}
                onClick={() => selectCategory(cat.value)}
                className="group cursor-pointer bg-white border border-slate-200/70 hover:border-teal-500/80 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-slate-100/50 flex flex-col items-start gap-4 active:scale-98"
              >
                <div className="p-3 bg-teal-50 text-teal-600 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 group-hover:text-teal-700 transition-colors">{cat.label}</h4>
                  <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">{cat.description}</p>
                </div>
                <div className="mt-auto pt-2 flex items-center gap-1 text-[11px] font-bold text-teal-600 group-hover:translate-x-1 transition-transform">
                  <span>Explore Listings</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 bg-slate-100/50 border-y border-slate-200/50">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">How LinkMedicalSpaces Works</h2>
            <p className="text-slate-500 text-sm mt-2 font-medium">Connecting space providers and practitioners seamlessly</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-extrabold text-lg mx-auto border border-teal-100">
                1
              </div>
              <h4 className="font-extrabold text-slate-800">Search specialized offices</h4>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-xs mx-auto">
                Specify your location and medical spatial needs. Check equipment capabilities and HIPAA layout plans.
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-extrabold text-lg mx-auto border border-teal-100">
                2
              </div>
              <h4 className="font-extrabold text-slate-800">Submit inquiry directly</h4>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-xs mx-auto">
                Connect directly with medical clinic hosts to discuss schedules, pricing tiers, and space sharing agreements.
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-extrabold text-lg mx-auto border border-teal-100">
                3
              </div>
              <h4 className="font-extrabold text-slate-800">Finalize and practice</h4>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-xs mx-auto">
                Check in to your custom clinical room. Rent by the hour or sublease on structured terms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Available Spaces Placeholder */}
      <AvailableSpacesPlaceholder />

      {/* Testimonials */}
      <TestimonialSlider />

      {/* CTA Host banner */}
      <section className="py-16 max-w-[1200px] mx-auto px-6 w-full">
        <div className="bg-gradient-to-r from-teal-600 to-slate-800 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none" />
          
          <div className="max-w-xl space-y-6 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Have idle clinic space or operatory slots?</h2>
            <p className="text-white/90 text-sm leading-relaxed">
              Earn secondary income by listing exam tables, surgical suites, or unused laboratory time. We make clinic sharing simple and secure.
            </p>
            
            <button
              onClick={() => router.push('/list-your-space')}
              className="inline-flex items-center gap-2 bg-white text-teal-800 font-bold px-6 py-3 rounded-xl hover:bg-slate-55 transition-colors shadow shadow-teal-900/10 active:scale-98"
            >
              <span>Host Your Space</span>
              <Users className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
