'use client'

import {  useState, useEffect, useRef , Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader } from '@googlemaps/js-api-loader'
import { useDropzone } from 'react-dropzone'
import imageCompression from 'browser-image-compression'
import {
  MapPin,
  Loader2,
  UploadCloud,
  Trash2,
  AlertCircle,
  Plus,
  Check,
  ChevronDown,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

// XHR upload helper for progress tracking
const uploadWithProgress = (
  url: string,
  formData: FormData,
  onProgress: (progress: number) => void
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const pct = Math.round((event.loaded / event.total) * 100)
        onProgress(pct)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText))
      } else {
        try {
          const errData = JSON.parse(xhr.responseText)
          reject(new Error(errData.error || 'Upload failed'))
        } catch (_) {
          reject(new Error(xhr.statusText || 'Upload failed'))
        }
      }
    }

    xhr.onerror = () => reject(new Error('Network connection error'))
    xhr.send(formData)
  })
}

// US States list
const US_STATES = [
  { value: '', label: '- Select -' },
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' }, { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' }, { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' }, { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' }, { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' }, { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' }, { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' }, { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' }, { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' }, { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' }, { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' }, { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' }, { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' }, { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' }, { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' }, { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' }, { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
]

const HEAR_ABOUT_OPTIONS = [
  '- Select -',
  'Google Search',
  'Social Media',
  'Referral from a colleague',
  'Medical conference or event',
  'Email newsletter',
  'Other',
]

const SUBLEASE_INSPIRATIONS = [
  "It's a new practice and I haven't grown into the entire space",
  "I'm not utilizing the whole office and I hate waste!",
  "My office space is expensive and I'd like help to offset some of that cost",
  'Private practice margins are shrinking and I want to run lean',
  "I'm cutting back and don't need all this space anymore",
  "Something else we haven't thought of",
]

function AddListingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const region = searchParams.get('region') || 'orlando'

  // Draft state
  const [draftId, setDraftId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loadingDraft, setLoadingDraft] = useState(true)

  // Form fields matching reference screenshots
  const [entireOffice, setEntireOffice] = useState<boolean | null>(null)
  const [examRooms, setExamRooms] = useState('')
  const [availability, setAvailability] = useState<'full_time' | 'part_time' | null>(null)
  const [leaseType, setLeaseType] = useState<'primary' | 'sublease' | null>(null)
  const [areasAvailable, setAreasAvailable] = useState<string[]>([])
  const [amenitiesIncluded, setAmenitiesIncluded] = useState<string[]>([])
  const [otherAmenities, setOtherAmenities] = useState('')
  const [constructionType, setConstructionType] = useState<'new' | 'established' | null>(null)
  const [description, setDescription] = useState('')

  // Address fields
  const [streetAddress, setStreetAddress] = useState('')
  const [streetAddress2, setStreetAddress2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)

  // Professionals
  const [targetProfessionals, setTargetProfessionals] = useState<string[]>([])

  const [featuredImage, setFeaturedImage] = useState<any | null>(null)
  const [additionalImages, setAdditionalImages] = useState<any[]>([])
  const [propertyVideo, setPropertyVideo] = useState<any | null>(null)
  const [photoUploadProgress, setPhotoUploadProgress] = useState<Record<string, number>>({})

  // Pricing
  const [monthlyRent, setMonthlyRent] = useState('')

  // We're curious
  const [hearAboutUs, setHearAboutUs] = useState('')
  const [subleaseInspirations, setSubleaseInspirations] = useState<string[]>([])

  // Relationship
  const [relationship, setRelationship] = useState<'owner' | 'broker' | null>(null)

  // Contact
  const [contactMethods, setContactMethods] = useState<string[]>([])
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')

  // Brand Ambassador
  const [brandAmbassador, setBrandAmbassador] = useState<boolean | null>(null)

  // Attestation
  const [attestation1, setAttestation1] = useState(false)
  const [attestation2, setAttestation2] = useState(false)
  const [attestation3, setAttestation3] = useState(false)

  // Electronic Signature
  const [signatureName, setSignatureName] = useState('')

  // Google Maps
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const autocompleteInputRef = useRef<HTMLInputElement>(null)

  // Redirect if unauthenticated (bypassed for viewing workflow)
  /*
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin')
    }
  }, [status, router])
  */

  // Pre-fill contact info from session
  useEffect(() => {
    if (session?.user) {
      if (session.user.name) setContactName(session.user.name)
      if (session.user.email) setContactEmail(session.user.email)
    }
  }, [session])

  // Create draft on mount
  useEffect(() => {
    if (status === 'unauthenticated') {
      setLoadingDraft(false)
      return
    }
    if (status !== 'authenticated') return

    const initDraft = async () => {
      try {
        // Check for existing draft
        const checkRes = await fetch('/api/listings/draft')
        if (checkRes.ok) {
          const draft = await checkRes.json()
          if (draft?.id) {
            setDraftId(draft.id)
            // Restore fields from draft
            setDescription(draft.description || '')
            setStreetAddress(draft.address || '')
            setCity(draft.city || '')
            setState(draft.state || '')
            setZipCode(draft.zipCode || '')
            setLatitude(draft.latitude)
            setLongitude(draft.longitude)
            setMonthlyRent(draft.pricePerMonth ? draft.pricePerMonth.toString() : '')

            // Load media
            const media = draft.media || []
            const photos = media.filter((m: any) => m.type === 'IMAGE')
            const videos = media.filter((m: any) => m.type === 'VIDEO')
            if (photos.length > 0) {
              setFeaturedImage(photos[0])
              setAdditionalImages(photos.slice(1))
            }
            if (videos.length > 0) {
              setPropertyVideo(videos[0])
            }

            setLoadingDraft(false)
            return
          }
        }

        // Create new draft
        const res = await fetch('/api/listings/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ spaceType: 'EXAM_ROOM' }),
        })
        const data = await res.json()
        if (res.ok && data?.id) {
          setDraftId(data.id)
        }
      } catch (err) {
        console.error('Failed to init draft:', err)
      } finally {
        setLoadingDraft(false)
      }
    }

    initDraft()
  }, [status])

  // Google Maps
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
    if (!apiKey || apiKey === 'your-google-maps-api-key') return

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places'],
    }) as any

    loader.load().then((google: any) => {
      setMapsLoaded(true)

      if (mapRef.current) {
        const defaultLatLng = { lat: latitude || 28.5383, lng: longitude || -81.3792 }
        const map = new google.maps.Map(mapRef.current, {
          center: defaultLatLng,
          zoom: latitude ? 15 : 10,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        })

        const marker = new google.maps.Marker({
          position: defaultLatLng,
          map,
          draggable: true,
        })

        if (autocompleteInputRef.current) {
          const autocomplete = new google.maps.places.Autocomplete(autocompleteInputRef.current, {
            types: ['address'],
          })

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace()
            if (!place.geometry || !place.geometry.location) return

            const newLat = place.geometry.location.lat()
            const newLng = place.geometry.location.lng()
            setLatitude(newLat)
            setLongitude(newLng)
            map.setCenter({ lat: newLat, lng: newLng })
            map.setZoom(16)
            marker.setPosition({ lat: newLat, lng: newLng })

            const addressComponents = place.address_components || []
            let parsedStreet = ''
            let parsedCity = ''
            let parsedState = ''
            let parsedZip = ''
            addressComponents.forEach((comp: any) => {
              const types = comp.types
              if (types.includes('street_number')) parsedStreet = comp.long_name + ' '
              if (types.includes('route')) parsedStreet += comp.long_name
              if (types.includes('locality')) parsedCity = comp.long_name
              if (types.includes('administrative_area_level_1')) parsedState = comp.short_name
              if (types.includes('postal_code')) parsedZip = comp.long_name
            })

            setStreetAddress(parsedStreet || place.formatted_address || '')
            setCity(parsedCity)
            setState(parsedState)
            setZipCode(parsedZip)
          })
        }

        marker.addListener('dragend', () => {
          const pos = marker.getPosition()
          if (pos) {
            setLatitude(pos.lat())
            setLongitude(pos.lng())
          }
        })
      }
    }).catch((err: any) => console.error('Maps failed:', err))
  }, [])

  // Image upload handlers
  const handleFeaturedImageUpload = async (files: File[]) => {
    if (!draftId || files.length === 0) return
    const file = files[0]
    const key = `featured-${Date.now()}`
    setPhotoUploadProgress((p) => ({ ...p, [key]: 5 }))

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, initialQuality: 0.8,
      })
      const formData = new FormData()
      formData.append('file', compressed, file.name)
      formData.append('listingId', draftId)

      const data = await uploadWithProgress('/api/upload/image', formData, (p) => {
        setPhotoUploadProgress((prev) => ({ ...prev, [key]: p }))
      })
      setFeaturedImage(data.media)
    } catch (err: any) {
      console.error('Featured image upload failed:', err)
    } finally {
      setPhotoUploadProgress((p) => { const c = { ...p }; delete c[key]; return c })
    }
  }

  const handleAdditionalImageUpload = async (files: File[]) => {
    if (!draftId) return

    for (const file of files) {
      const key = `additional-${Date.now()}-${Math.random()}`
      setPhotoUploadProgress((p) => ({ ...p, [key]: 5 }))

      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, initialQuality: 0.8,
        })
        const formData = new FormData()
        formData.append('file', compressed, file.name)
        formData.append('listingId', draftId)

        const data = await uploadWithProgress('/api/upload/image', formData, (p) => {
          setPhotoUploadProgress((prev) => ({ ...prev, [key]: p }))
        })
        setAdditionalImages((prev) => [...prev, data.media])
      } catch (err: any) {
        console.error('Additional image upload failed:', err)
      } finally {
        setPhotoUploadProgress((p) => { const c = { ...p }; delete c[key]; return c })
      }
    }
  }

  const handleCaptionUpdate = async (imageId: string, caption: string) => {
    try {
      await fetch(`/api/listings/media/${imageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption }),
      })
    } catch (err) {
      console.error('Failed to update caption:', err)
    }
  }

  const handleDeleteImage = async (imageId: string, url: string, type: 'featured' | 'additional' | 'video') => {
    const match = url.match(/\/v\d+\/([^\s]+)\.[a-z0-9]+$/i)
    const publicId = match ? match[1] : null
    if (!publicId) return

    try {
      if (type === 'featured') setFeaturedImage(null)
      else if (type === 'video') setPropertyVideo(null)
      else setAdditionalImages((prev) => prev.filter((p) => p.id !== imageId))
      await fetch(`/api/upload/${publicId}`, { method: 'DELETE' })
    } catch (err) {
      console.error('Failed to delete media:', err)
    }
  }

  const handleVideoUpload = async (files: File[]) => {
    const file = files[0]
    if (!file || !draftId) return

    const key = `video-${Date.now()}`
    setPhotoUploadProgress((p) => ({ ...p, [key]: 5 }))

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('listingId', draftId)

      const data = await uploadWithProgress('/api/upload/video', formData, (p) => {
        setPhotoUploadProgress((prev) => ({ ...prev, [key]: p }))
      })
      setPropertyVideo(data.media)
    } catch (err: any) {
      console.error('Video upload failed:', err)
    } finally {
      setPhotoUploadProgress((p) => { const c = { ...p }; delete c[key]; return c })
    }
  }

  const featuredDropzone = useDropzone({
    onDrop: handleFeaturedImageUpload,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
  })

  const additionalDropzone = useDropzone({
    onDrop: handleAdditionalImageUpload,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
  })

  const videoDropzone = useDropzone({
    onDrop: handleVideoUpload,
    accept: { 'video/*': ['.mp4', '.mov', '.webm'] },
    maxFiles: 1,
  })

  const [generatingDesc, setGeneratingDesc] = useState(false)
  const generateAIDescription = async () => {
    if (!streetAddress || !city) {
      alert('Please fill in your address and city first so we can describe the location!')
      return
    }
    setGeneratingDesc(true)
    setDescription('')
    try {
      const res = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: streetAddress,
          city,
          state,
          rooms: examRooms,
          rent: monthlyRent,
          amenities: amenitiesIncluded,
          constructionType,
          targetProfessionals,
        }),
      })
      if (!res.ok || !res.body) throw new Error('Failed to generate')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let done = false
      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        const chunkValue = decoder.decode(value, { stream: true })
        setDescription((prev) => prev + chunkValue)
      }
    } catch (err) {
      console.error(err)
      alert('Failed to generate description. Please try again.')
    } finally {
      setGeneratingDesc(false)
    }
  }

  // Toggle helpers
  const toggleArrayItem = (arr: string[], item: string, setter: (val: string[]) => void) => {
    setter(arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item])
  }

  // Submit
  const handleSubmit = async () => {
    if (!draftId) return

    // Validate required fields
    if (!streetAddress || !city || !state || !zipCode) {
      setSubmitError('Please fill in your complete address.')
      return
    }
    if (!attestation1 || !attestation2 || !attestation3) {
      setSubmitError('Please accept all attestation checkboxes.')
      return
    }
    if (!signatureName.trim()) {
      setSubmitError('Please provide your electronic signature.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      // Save draft with all data
      await fetch('/api/listings/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: draftId,
          spaceType: 'EXAM_ROOM',
          title: `Medical Space at ${streetAddress}, ${city}`,
          rooms: examRooms ? parseInt(examRooms) : 1,
          address: streetAddress,
          city,
          state,
          zipCode,
          country: 'US',
          latitude,
          longitude,
          description,
          pricePerMonth: monthlyRent ? parseFloat(monthlyRent) : null,
          amenities: [
            ...amenitiesIncluded,
            ...areasAvailable.map((a) => `Area: ${a}`),
            ...(otherAmenities ? [`Other: ${otherAmenities}`] : []),
            ...(entireOffice !== null ? [`Entire Office: ${entireOffice ? 'Yes' : 'No'}`] : []),
            ...(availability ? [`Availability: ${availability}`] : []),
            ...(leaseType ? [`Lease Type: ${leaseType}`] : []),
            ...(constructionType ? [`Construction: ${constructionType}`] : []),
            ...targetProfessionals.map((p) => `Target: ${p}`),
            ...(relationship ? [`Relationship: ${relationship}`] : []),
            ...contactMethods.map((m) => `Contact via: ${m}`),
            ...(hearAboutUs ? [`Heard from: ${hearAboutUs}`] : []),
            ...subleaseInspirations.map((s) => `Inspiration: ${s}`),
            ...(brandAmbassador !== null ? [`Brand Ambassador: ${brandAmbassador ? 'Yes' : 'No'}`] : []),
          ],
          availabilityHours: {
            contactName,
            contactEmail,
            contactPhone,
            signatureName,
            region,
          },
        }),
      })

      // Save pricing
      await fetch(`/api/listings/${draftId}/pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pricePerMonth: monthlyRent ? parseFloat(monthlyRent) : null,
        }),
      })

      // Publish
      const publishRes = await fetch(`/api/listings/${draftId}/publish`, { method: 'PUT' })
      const publishData = await publishRes.json()

      if (publishRes.ok && publishData.success) {
        setSubmitSuccess(true)
      } else {
        setSubmitError(publishData.error || 'Failed to submit listing.')
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Submission failed.')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading' || loadingDraft) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    )
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-6 shadow-lg">
            <div className="w-16 h-16 bg-teal-50 border border-teal-200 rounded-full flex items-center justify-center text-teal-600 mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Listing Submitted!</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Your listing has been submitted successfully. Our team will review it and it will be live on the platform shortly.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Navbar />

      {/* Header */}
      <section className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-100 pt-10 pb-6 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-teal-600">List Your Space</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            It's easy to get started on Link Medical Spaces
          </h1>
          <p className="text-slate-500 text-sm">Share some basic info, choose a listing plan and publish your space.</p>
        </div>
      </section>

      {/* Form Body */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-8 space-y-10">

        {/* Region Selector (locked) */}
        <div className="relative">
          <select
            value={region}
            disabled
            className="w-full sm:w-80 appearance-none bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none cursor-not-allowed opacity-80"
          >
            <option value="orlando">Orlando Area</option>
            <option value="other">Other</option>
          </select>
          <ChevronDown className="absolute right-4 sm:left-72 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Where is your space located? */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Where is your space located?</h2>

          {/* Map container */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
            <div ref={mapRef} className="w-full h-52" />
            {!mapsLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                <p className="text-xs text-slate-500 font-medium text-center px-6">
                  We could not connect to the Google Maps autocomplete service, but you can add an address manually.
                </p>
              </div>
            )}
          </div>

          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              ref={autocompleteInputRef}
              type="text"
              placeholder="Enter address"
              className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 hover:border-slate-300 focus:border-teal-500 rounded-xl text-sm font-medium outline-none transition-colors"
            />
          </div>
        </section>

        {/* Tell us more about your space */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Tell us more about your space</h2>
            <p className="text-xs text-slate-500">This information will help you find right match for your space</p>
          </div>

          <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-6">

            {/* Entire office? */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800">Is your entire office available for leasing?</label>
              <div className="flex gap-2">
                {['Yes', 'No'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setEntireOffice(opt === 'Yes')}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                      entireOffice === (opt === 'Yes')
                        ? 'border-slate-800 bg-slate-800 text-white'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Exam rooms count */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800">How many exam rooms are available to sublet or lease?</label>
              <div className="relative">
                <select
                  value={examRooms}
                  onChange={(e) => setExamRooms(e.target.value)}
                  className="w-full appearance-none bg-white border-2 border-slate-200 hover:border-slate-300 focus:border-teal-500 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-colors cursor-pointer"
                >
                  <option value="">- Select -</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n.toString()}>{n}{n === 10 ? '+' : ''}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Full time or part time? */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800">Is your space available full time or part-time?</label>
              <div className="flex gap-2">
                {[{ v: 'full_time', l: 'Full Time' }, { v: 'part_time', l: 'Part Time' }].map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setAvailability(opt.v as any)}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                      availability === opt.v
                        ? 'border-slate-800 bg-slate-800 text-white'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Lease type */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800">Is this a primary lease or sublease?</label>
              <div className="flex gap-2">
                {[{ v: 'primary', l: 'Primary Lease' }, { v: 'sublease', l: 'Sublease' }].map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setLeaseType(opt.v as any)}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                      leaseType === opt.v
                        ? 'border-slate-800 bg-slate-800 text-white'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Areas available */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800">Other than exam rooms, what areas are available for use by lessee?</label>
              <div className="flex flex-wrap gap-2">
                {['Waiting Room', 'Restroom', 'Break Room', 'Office', 'Other'].map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleArrayItem(areasAvailable, area, setAreasAvailable)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                      areasAvailable.includes(area)
                        ? 'border-slate-800 bg-slate-800 text-white'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[10px] ${
                      areasAvailable.includes(area) ? 'bg-white text-slate-800 border-white' : 'border-slate-300'
                    }`}>
                      {areasAvailable.includes(area) && <Check className="w-2.5 h-2.5" />}
                    </span>
                    {area}
                  </button>
                ))}
              </div>
            </div>

            {/* Amenities included */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800">Amenities included</label>
              <div className="flex flex-wrap gap-2">
                {['Utilities', 'Internet', 'Cleaning Services'].map((am) => (
                  <button
                    key={am}
                    type="button"
                    onClick={() => toggleArrayItem(amenitiesIncluded, am, setAmenitiesIncluded)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                      amenitiesIncluded.includes(am)
                        ? 'border-slate-800 bg-slate-800 text-white'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[10px] ${
                      amenitiesIncluded.includes(am) ? 'bg-white text-slate-800 border-white' : 'border-slate-300'
                    }`}>
                      {amenitiesIncluded.includes(am) && <Check className="w-2.5 h-2.5" />}
                    </span>
                    {am}
                  </button>
                ))}
              </div>
            </div>

            {/* Other amenities */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800">Other amenities available</label>
              <input
                type="text"
                value={otherAmenities}
                onChange={(e) => setOtherAmenities(e.target.value)}
                className="w-full border-2 border-slate-200 hover:border-slate-300 focus:border-teal-500 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
              />
            </div>

            {/* Construction Type */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800">Construction Type</label>
              <div className="flex gap-2">
                {[{ v: 'new', l: 'New Construction' }, { v: 'established', l: 'Established Building' }].map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setConstructionType(opt.v as any)}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                      constructionType === opt.v
                        ? 'border-slate-800 bg-slate-800 text-white'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Property Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-800">Property Description</label>
                <button
                  type="button"
                  onClick={generateAIDescription}
                  disabled={generatingDesc}
                  className="text-xs font-bold text-teal-600 hover:text-teal-700 disabled:opacity-50"
                >
                  {generatingDesc ? 'Generating...' : 'Auto-generate Description'}
                </button>
              </div>
              <p className="text-xs text-slate-500">Highlight the best aspects of your office and what makes it attractive to potential tenants. Include any special features or add details regarding availability, etc.</p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full border-2 border-slate-200 hover:border-slate-300 focus:border-teal-500 rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-y"
              />
            </div>
          </div>
        </section>

        {/* Confirm your space address */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Confirm your space address</h2>

          <div className="bg-white border-2 border-slate-200 rounded-2xl divide-y divide-slate-200">
            <input
              type="text"
              placeholder="Street Address"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              className="w-full px-4 py-3 text-sm font-medium outline-none rounded-t-2xl"
            />
            <input
              type="text"
              placeholder="Street Address line 2 (optional)"
              value={streetAddress2}
              onChange={(e) => setStreetAddress2(e.target.value)}
              className="w-full px-4 py-3 text-sm font-medium outline-none"
            />
            <input
              type="text"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-3 text-sm font-medium outline-none"
            />
            <div className="relative">
              <label className="absolute left-4 top-1 text-[10px] font-semibold text-slate-400">State / Province</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full appearance-none bg-white px-4 pt-5 pb-3 text-sm font-medium outline-none cursor-pointer"
              >
                {US_STATES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <input
              type="text"
              placeholder="Zip Code"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className="w-full px-4 py-3 text-sm font-medium outline-none rounded-b-2xl"
            />
          </div>
        </section>

        {/* Which professionals */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Which professionals is your space available to?</h2>
          <div className="flex flex-wrap gap-2">
            {['Physicians (MD/DO)', 'Other Healthcare Professionals'].map((prof) => (
              <button
                key={prof}
                type="button"
                onClick={() => toggleArrayItem(targetProfessionals, prof, setTargetProfessionals)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                  targetProfessionals.includes(prof)
                    ? 'border-slate-800 bg-slate-800 text-white'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[10px] ${
                  targetProfessionals.includes(prof) ? 'bg-white text-slate-800 border-white' : 'border-slate-300'
                }`}>
                  {targetProfessionals.includes(prof) && <Check className="w-2.5 h-2.5" />}
                </span>
                {prof}
              </button>
            ))}
          </div>
        </section>

        {/* Make your space stand out */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Make your space stand out</h2>
            <p className="text-xs text-slate-500">Share nice images of your space</p>
          </div>

          <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
            {/* Featured Image */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800">Featured Image</label>
              {featuredImage ? (
                <div className="space-y-2">
                  <div className="relative w-40 h-28 rounded-xl overflow-hidden border border-slate-200">
                    <img src={featuredImage.originalUrl} alt="Featured" className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleDeleteImage(featuredImage.id, featuredImage.originalUrl, 'featured')}
                      className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    defaultValue={featuredImage.caption || ''}
                    placeholder="Add a caption..."
                    onBlur={(e) => handleCaptionUpdate(featuredImage.id, e.target.value)}
                    className="w-40 px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                  />
                </div>
              ) : (
                <div
                  {...featuredDropzone.getRootProps()}
                  className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-xl p-4 cursor-pointer transition-colors text-center"
                >
                  <input {...featuredDropzone.getInputProps()} />
                  <p className="text-sm font-semibold text-slate-600">Upload or select image</p>
                </div>
              )}
            </div>

            {/* Additional Images */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800">Property Additional Images</label>
              <div className="flex flex-wrap gap-3">
                {additionalImages.map((img) => (
                  <div key={img.id} className="space-y-2">
                    <div className="relative w-28 h-20 rounded-xl overflow-hidden border border-slate-200">
                      <img src={img.originalUrl} alt="Additional" className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleDeleteImage(img.id, img.originalUrl, 'additional')}
                        className="absolute top-1 right-1 bg-white/90 rounded-full p-0.5 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <input
                      type="text"
                      defaultValue={img.caption || ''}
                      placeholder="Add a caption..."
                      onBlur={(e) => handleCaptionUpdate(img.id, e.target.value)}
                      className="w-28 px-2 py-1 text-[10px] border border-slate-200 rounded-md outline-none focus:border-teal-500"
                    />
                  </div>
                ))}
              </div>
              <div
                {...additionalDropzone.getRootProps()}
                className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-xl p-4 cursor-pointer transition-colors text-center"
              >
                <input {...additionalDropzone.getInputProps()} />
                <p className="text-sm font-semibold text-slate-600">Upload or select image</p>
              </div>
              <button
                type="button"
                onClick={() => (document.querySelector('[data-additional-trigger]') as HTMLElement)?.click()}
                className="flex items-center gap-1 text-sm font-bold text-teal-600 hover:text-teal-700 mt-1"
              >
                <Plus className="w-4 h-4" /> Add new
              </button>
            </div>

            {/* Property Video */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-sm font-bold text-slate-800">Property Video (Optional)</label>
              <p className="text-xs text-slate-500 mb-2">Upload a virtual tour or walkthrough video of your space.</p>
              {propertyVideo ? (
                <div className="space-y-2">
                  <div className="relative w-48 h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
                    <video src={propertyVideo.originalUrl} controls className="w-full h-full object-contain" />
                    <button
                      onClick={() => handleDeleteImage(propertyVideo.id, propertyVideo.originalUrl, 'video')}
                      className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-red-500 hover:bg-red-50 z-10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    defaultValue={propertyVideo.caption || ''}
                    placeholder="Add a video caption..."
                    onBlur={(e) => handleCaptionUpdate(propertyVideo.id, e.target.value)}
                    className="w-48 px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                  />
                </div>
              ) : (
                <div
                  {...videoDropzone.getRootProps()}
                  className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-xl p-6 cursor-pointer transition-colors text-center"
                >
                  <input {...videoDropzone.getInputProps()} />
                  <p className="text-sm font-semibold text-slate-600">Upload video (Max 500MB)</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Monthly asking rent */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Monthly asking rent</h2>
          <div className="relative w-full sm:w-80">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">$</span>
            <input
              type="number"
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(e.target.value)}
              placeholder="0"
              className="w-full pl-8 pr-4 py-3 border-2 border-slate-200 hover:border-slate-300 focus:border-teal-500 rounded-xl text-sm font-medium outline-none transition-colors"
            />
          </div>
        </section>

        {/* We're curious */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">We're curious</h2>

          <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800">How did you hear about us?</label>
              <div className="relative">
                <select
                  value={hearAboutUs}
                  onChange={(e) => setHearAboutUs(e.target.value)}
                  className="w-full appearance-none bg-white border-2 border-slate-200 hover:border-slate-300 focus:border-teal-500 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-colors cursor-pointer"
                >
                  {HEAR_ABOUT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt === '- Select -' ? '' : opt}>{opt}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800">What is your inspiration to sublease your office? (check all that applies)</label>
              <div className="flex flex-col gap-2">
                {SUBLEASE_INSPIRATIONS.map((ins) => (
                  <button
                    key={ins}
                    type="button"
                    onClick={() => toggleArrayItem(subleaseInspirations, ins, setSubleaseInspirations)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-left text-sm font-medium border-2 transition-all ${
                      subleaseInspirations.includes(ins)
                        ? 'border-slate-800 bg-slate-800 text-white'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                      subleaseInspirations.includes(ins) ? 'bg-white text-slate-800 border-white' : 'border-slate-300'
                    }`}>
                      {subleaseInspirations.includes(ins) && <Check className="w-3 h-3" />}
                    </span>
                    {ins}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Relationship to advertised property */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Relationship to advertised property</h2>
          <p className="text-sm text-slate-600">You're the</p>
          <div className="flex flex-wrap gap-2">
            {[{ v: 'owner', l: 'Property Owner/Tenant or their representative' }, { v: 'broker', l: 'Broker/Agent representing property' }].map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() => setRelationship(opt.v as any)}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                  relationship === opt.v
                    ? 'border-slate-800 bg-slate-800 text-white'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {opt.l}
              </button>
            ))}
          </div>
        </section>

        {/* Contact preferences */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">How would you like to be contacted by prospective lessees/tenants?</h2>

          <div className="flex gap-2 mb-4">
            {['Email', 'Phone'].map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => toggleArrayItem(contactMethods, method, setContactMethods)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                  contactMethods.includes(method)
                    ? 'border-slate-800 bg-slate-800 text-white'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[10px] ${
                  contactMethods.includes(method) ? 'bg-white text-slate-800 border-white' : 'border-slate-300'
                }`}>
                  {contactMethods.includes(method) && <Check className="w-2.5 h-2.5" />}
                </span>
                {method}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Contact Name</label>
              <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Contact Person Name" className="w-full border-2 border-slate-200 focus:border-teal-500 rounded-xl px-4 py-3 text-sm outline-none transition-colors" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Contact Email</label>
              <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Enter your email" className="w-full border-2 border-slate-200 focus:border-teal-500 rounded-xl px-4 py-3 text-sm outline-none transition-colors" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Contact Phone</label>
              <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Enter your phone" className="w-full border-2 border-slate-200 focus:border-teal-500 rounded-xl px-4 py-3 text-sm outline-none transition-colors" />
            </div>
          </div>
        </section>

        {/* Brand Ambassador */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Were you referred by a Brand Ambassador?</h2>
          <div className="flex gap-2">
            {['Yes', 'No'].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setBrandAmbassador(opt === 'Yes')}
                className={`px-5 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                  brandAmbassador === (opt === 'Yes')
                    ? 'border-slate-800 bg-slate-800 text-white'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </section>

        {/* Attestation */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Attestation</h2>
          <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={attestation1} onChange={(e) => setAttestation1(e.target.checked)} className="w-4 h-4 mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer" />
              <span className="text-sm text-slate-700 leading-relaxed">
                I have read and agree to the <a href="#" className="text-teal-600 underline font-semibold">Terms and Policies</a>, <a href="#" className="text-teal-600 underline font-semibold">Disclaimer</a>, and <a href="#" className="text-teal-600 underline font-semibold">Privacy Policy</a>.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={attestation2} onChange={(e) => setAttestation2(e.target.checked)} className="w-4 h-4 mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer" />
              <span className="text-sm text-slate-700 leading-relaxed">
                I confirm that I am the property owner or have the legal authority to advertise this property. I further confirm that this listing does not violate any exclusive agency or brokerage agreements, and I accept full responsibility for the accuracy of the information provided.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={attestation3} onChange={(e) => setAttestation3(e.target.checked)} className="w-4 h-4 mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer" />
              <span className="text-sm text-slate-700 leading-relaxed">
                By uploading images, I confirm I have the legal right to use and distribute these materials and that doing so does not violate any copyright or licensing agreements with third parties.
              </span>
            </label>
          </div>
        </section>

        {/* Electronic Signature Agreement */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Electronic Signature Agreement</h2>
          <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              By typing your name below and submitting this form, you acknowledge and agree that this constitutes your electronic signature. You affirm that all information provided is accurate to the best of your knowledge and that you have the legal right to advertise this property. This electronic signature is legally binding and has the same force and effect as a handwritten signature.
            </p>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Full Name</label>
              <input
                type="text"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="Please enter your full name"
                className="w-full border-2 border-slate-200 focus:border-teal-500 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Listing Submission Disclaimer */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Listing Submission Disclaimer</h2>
          <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 sm:p-6 max-h-40 overflow-y-auto">
            <p className="text-xs font-bold text-slate-700 uppercase mb-2">PLEASE BE ADVISED:</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              LinkMedicalSpaces and Link Medical Spaces LLC and its affiliates (collectively, the "Platform") operates solely as an online advertising venue for property owners, landlords, tenants, and interested parties to share and discover available medical office spaces.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed mt-2">
              The Platform does not act as a real estate broker, agent, or intermediary, does not alter or nullify any exclusive agreements you may have with your real estate agent, broker, and/or other real estate professional.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed mt-2">
              By submitting a listing, you represent and warrant that you are the rightful owner or authorized representative of the property and that the information provided is accurate and complete. The Platform reserves the right to remove listings that violate our terms of service or contain inaccurate information.
            </p>
          </div>
        </section>

        {/* Error */}
        {submitError && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {submitError}
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4 pb-8">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-lg py-4 rounded-xl shadow-lg shadow-rose-500/20 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </button>
        </div>
      </main>

      <Footer />
    </div>
  )
}


export default function AddListingPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AddListingPage />
    </Suspense>
  );
}
