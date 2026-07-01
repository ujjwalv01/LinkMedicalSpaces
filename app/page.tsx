'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import {
  Building,
  Search,
  MapPin,
  Shield,
  Star,
  ArrowRight
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import TestimonialSlider from '@/components/TestimonialSlider'
import AvailableSpacesPlaceholder from '@/components/AvailableSpacesPlaceholder'
import Image from 'next/image'
import Link from 'next/link'

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

    setOptions({
      key: apiKey,
      v: 'weekly',
    })

    importLibrary("places").then(() => {
      const google = (window as any).google;
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

  const sections = [
    {
      image: '/lms-1.jpg',
      heading: 'Connecting Docs With Medical Office Space',
      text: 'The only space on the internet where you can look specifically for medical office space, whether to lease or sublet. The only space on the internet where you can list even part of your office, even part-time.',
    },
    {
      image: '/lms-2.jpg',
      heading: 'Optimize Your Medical Office Space',
      text: "Are you utilizing your medical office well? Turn it into a passive income stream and help out a colleague. Sublet what you don't use, when you don't use it.",
      buttonLabel: 'Post Your Space',
      buttonLink: '/list-your-space'
    },
    {
      image: '/lms-3.jpg',
      heading: 'Start Lean, Stay Lean',
      text: "You may have noticed, the healthcare landscape is changing. Reimbursements and the cost of doing business are going in opposite directions. If you're going to thrive in private practice, you have to go lean. Focus on office space- it's probably the biggest expense for a medical practice.",
      buttonLabel: 'Find Your Medical Office',
      buttonLink: '/search-spaces'
    },
    {
      image: '/lms-4.jpg',
      heading: 'Work On Your Terms. Even In Medicine.',
      text: "It's 2025. About time that flexibility became more norm than exception. Even in medicine. Shared workspace has been around for a while now, for good reason. It's time we embraced it too. Even in medicine.",
      buttonLabel: 'Join the Flexible Workspace',
      buttonLink: '/search-spaces'
    },
    {
      image: '/lms-5.jpg',
      heading: 'Zero Realtor Commissions',
      text: 'By connecting healthcare professionals directly with medical office space, we save you thousands on commissions!',
      buttonLabel: 'Post Your Space',
      buttonLink: '/list-your-space'
    }
  ]

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Navbar />
      
      {/* Hero Header */}
      <div className="w-full bg-[#e8edf2] py-4 px-6 text-center shadow-sm relative z-20">
        <h2 className="text-xl sm:text-2xl font-bold text-[#204066] mb-1">Peer-to-peer medical office sublease.</h2>
        <p className="text-[#3b5998] text-sm sm:text-base font-medium">Simple. Affordable. Built for the Future of Private Practice.</p>
      </div>

      {/* Hero Split Section */}
      <section className="flex flex-col md:flex-row w-full min-h-[calc(100vh-160px)]">
        {/* Left Half (Red) */}
        <div className="w-full md:w-1/2 bg-[#eb5253] flex flex-col justify-center items-center text-center p-12 sm:p-20 relative overflow-hidden group">
          <div className="relative z-10 space-y-6 max-w-md mx-auto flex flex-col items-center">
            <p className="text-white text-xs sm:text-sm font-bold tracking-[0.2em]">I&apos;M LOOKING TO</p>
            <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              Sublease Unused Office Space.
            </h1>
            <button
              onClick={() => router.push('/list-your-space')}
              className="mt-8 border border-white/80 hover:bg-white hover:text-[#eb5253] text-white transition-all duration-300 rounded-none px-8 py-3 flex flex-col items-center group-hover:scale-105"
            >
              <div className="flex items-center gap-2 font-bold text-lg">
                <span>Post Your Space</span>
                <ArrowRight className="w-5 h-5" />
              </div>
              <div className="text-[10px] sm:text-xs font-bold opacity-90 mt-1 uppercase tracking-wider">Only $120/year</div>
            </button>
          </div>
        </div>

        {/* Right Half (Blue) */}
        <div className="w-full md:w-1/2 bg-[#4c668b] flex flex-col justify-center items-center text-center p-12 sm:p-20 relative overflow-hidden group">
          <div className="relative z-10 space-y-6 max-w-md mx-auto flex flex-col items-center">
            <p className="text-white text-xs sm:text-sm font-bold tracking-[0.2em]">I&apos;M LOOKING FOR</p>
            <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              Affordable Office Spaces
            </h1>
            <button
              onClick={() => router.push('/search-spaces')}
              className="mt-8 border border-white/80 hover:bg-white hover:text-[#4c668b] text-white transition-all duration-300 rounded-none px-8 py-3 flex items-center gap-2 group-hover:scale-105 h-[68px]"
            >
              <span className="font-bold text-lg">Explore Available Spaces</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Featured On Section (Marquee Slider) */}
      <section className="border-b border-slate-100 bg-white py-12 overflow-hidden">
        <div className="w-full">
          <p className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-10">Featured On</p>
          <div className="relative w-full overflow-hidden flex">
            <div className="animate-marquee flex w-max opacity-70 hover:opacity-100 transition-opacity duration-300">
              <div className="flex gap-16 pr-16 items-center">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="relative w-28 h-12 md:w-36 md:h-16 grayscale hover:grayscale-0 transition-all duration-300 shrink-0">
                    <Image
                      src={`/F-${i + 1}.png`}
                      alt={`Featured on ${i + 1}`}
                      fill
                      className="object-contain"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-16 pr-16 items-center">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={`dup-${i}`} className="relative w-28 h-12 md:w-36 md:h-16 grayscale hover:grayscale-0 transition-all duration-300 shrink-0">
                    <Image
                      src={`/F-${i + 1}.png`}
                      alt={`Featured on ${i + 1}`}
                      fill
                      className="object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Alternating Content Sections */}
      <div className="bg-slate-50/50">
        {sections.map((section, idx) => {
          const isEven = idx % 2 === 1
          return (
            <section key={idx} className="py-16 sm:py-24 max-w-[1200px] mx-auto px-6">
              <div className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-24 ${isEven ? 'lg:flex-row-reverse' : ''}`}>
                <div className="w-full lg:w-1/2">
                  <div className="relative aspect-video lg:aspect-[4/3] w-full mx-auto rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50">
                    <Image
                      src={section.image}
                      alt={section.heading}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="w-full lg:w-1/2 space-y-6">
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                    {section.heading}
                  </h2>
                  <p className="text-slate-600 text-lg leading-relaxed">
                    {section.text}
                  </p>
                  {section.buttonLabel && section.buttonLink && (
                    <div className="pt-4">
                      <Link 
                        href={section.buttonLink}
                        className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-teal-600/20 active:scale-[0.98] transition-all"
                      >
                        {section.buttonLabel}
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )
        })}
      </div>

      <AvailableSpacesPlaceholder />
      
      <TestimonialSlider />

      <Footer />
    </div>
  )
}
