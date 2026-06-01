
'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader } from '@googlemaps/js-api-loader'
import { useDropzone } from 'react-dropzone'
import imageCompression from 'browser-image-compression'
import {
  MapPin, Loader2, UploadCloud, Trash2, AlertCircle, Plus, Check, ChevronDown,
  Stethoscope, Activity, ChevronLeft, Map, Camera, CheckCircle2,
  CheckCircle, XCircle, Clock, Hourglass, FileText, PenTool,
  Sofa, Droplet, Coffee, Briefcase, HelpCircle,
  Zap, Wifi, Sparkles, Hammer, Building,
  User, Users, Mail, Phone, Home, Minus, X
} from 'lucide-react'

const uploadWithProgress = (url: string, formData: FormData, onProgress: (p: number) => void): Promise<any> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText))
      else reject(new Error('Upload failed'))
    }
    xhr.onerror = () => reject(new Error('Network connection error'))
    xhr.send(formData)
  })
}

const US_STATES = [
  { value: '', label: '- Select -' },
  { value: 'FL', label: 'Florida' },
  { value: 'Other', label: 'Other' },
]

const HEAR_ABOUT_OPTIONS = [
  '- Select -', 'Google Search', 'Social Media', 'Referral from a colleague',
  'Medical conference or event', 'Email newsletter', 'Other',
]

const SUBLEASE_INSPIRATIONS = [
  "It's a new practice and I haven't grown into the entire space",
  "I'm not utilizing the whole office and I hate waste!",
  "My office space is expensive and I'd like help to offset some of that cost",
  'Private practice margins are shrinking and I want to run lean',
  "I'm cutting back and don't need all this space anymore",
  "Something else we haven't thought of",
]

const TOTAL_STEPS = 8

function AddListingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const region = searchParams.get('region') || 'orlando'

  const [currentStep, setCurrentStep] = useState(1)

  const [draftId, setDraftId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<{ message: string, step?: number } | null>(null)
  const [loadingDraft, setLoadingDraft] = useState(true)

  const [entireOffice, setEntireOffice] = useState<boolean | null>(null)
  const [examRooms, setExamRooms] = useState('1')
  const [availability, setAvailability] = useState<string | null>(null)
  const [leaseType, setLeaseType] = useState<string | null>(null)
  const [areasAvailable, setAreasAvailable] = useState<string[]>([])
  const [otherAreaText, setOtherAreaText] = useState('')
  const [amenitiesIncluded, setAmenitiesIncluded] = useState<string[]>([])
  const [otherAmenities, setOtherAmenities] = useState('')
  const [constructionType, setConstructionType] = useState<string | null>(null)
  const [description, setDescription] = useState('')

  const [streetAddress, setStreetAddress] = useState('')
  const [streetAddress2, setStreetAddress2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [otherState, setOtherState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)

  const [targetProfessionals, setTargetProfessionals] = useState<string[]>([])

  const [featuredImage, setFeaturedImage] = useState<any | null>(null)
  const [additionalImages, setAdditionalImages] = useState<any[]>([])
  const [propertyVideo, setPropertyVideo] = useState<any | null>(null)
  const [photoUploadProgress, setPhotoUploadProgress] = useState<Record<string, number>>({})

  const [monthlyRent, setMonthlyRent] = useState('')
  const [hearAboutUs, setHearAboutUs] = useState('')
  const [subleaseInspirations, setSubleaseInspirations] = useState<string[]>([])
  const [relationship, setRelationship] = useState<string | null>(null)
  const [contactMethods, setContactMethods] = useState<string[]>([])
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [brandAmbassador, setBrandAmbassador] = useState<boolean | null>(null)
  const [attestation1, setAttestation1] = useState(false)
  const [attestation2, setAttestation2] = useState(false)
  const [attestation3, setAttestation3] = useState(false)
  const [signatureName, setSignatureName] = useState('')

  const [mapsLoaded, setMapsLoaded] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const autocompleteInputRef = useRef<HTMLInputElement>(null)
  const isImageProcessing = useRef<boolean>(false)
  const featuredImageRef = useRef<any>(null)
  const [generatingDesc, setGeneratingDesc] = useState(false)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user) {
      if (session.user.name) setContactName(session.user.name)
      if (session.user.email) setContactEmail(session.user.email)
    }
  }, [session])

  useEffect(() => {
    if (status === 'unauthenticated') {
      setLoadingDraft(false)
      return
    }
    if (status !== 'authenticated') return

    const continueDraftId = searchParams.get('draftId')

    const initDraft = async () => {
      try {
        // Only load existing draft data when continuing a specific draft via ?draftId=xxx
        if (continueDraftId) {
          const checkRes = await fetch(`/api/listings/draft?id=${continueDraftId}`)
          if (checkRes.ok) {
            const draft = await checkRes.json()
            if (draft?.id) {
              setDraftId(draft.id)
              setDescription(draft.description || '')
              setStreetAddress(draft.address || '')
              setCity(draft.city || '')
              setState(draft.state || '')
              setZipCode(draft.zipCode || '')
              setLatitude(draft.latitude)
              setLongitude(draft.longitude)
              setMonthlyRent(draft.pricePerMonth ? draft.pricePerMonth.toString() : '')

              setCurrentStep(2)

              if (draft.rooms) setExamRooms(draft.rooms.toString())
              
              let parsedAmenities: string[] = []
              if (typeof draft.amenities === 'string') {
                try { parsedAmenities = JSON.parse(draft.amenities) } catch(e) {}
              } else if (Array.isArray(draft.amenities)) {
                parsedAmenities = draft.amenities
              }

              if (parsedAmenities.length > 0) {
                const parseArr = (prefix: string) => parsedAmenities.filter((a: string) => a.startsWith(prefix)).map((a: string) => a.replace(prefix, ''))
                
                const rawAmenities = parsedAmenities.filter((a: string) => !a.includes(': '))
                setAmenitiesIncluded(rawAmenities)
                
                setAreasAvailable(parseArr('Area: '))
                
                const otherArea = parseArr('Other Area: ')[0]
                if (otherArea) setOtherAreaText(otherArea)
                
                const otherAmen = parseArr('Other: ')[0]
                if (otherAmen) setOtherAmenities(otherAmen)
                
                const entireOff = parseArr('Entire Office: ')[0]
                if (entireOff === 'Yes') setEntireOffice(true)
                if (entireOff === 'No') setEntireOffice(false)
                
                const avail = parseArr('Availability: ')[0]
                if (avail) setAvailability(avail)
                
                const lease = parseArr('Lease Type: ')[0]
                if (lease) setLeaseType(lease)
                
                const constr = parseArr('Construction: ')[0]
                if (constr) setConstructionType(constr)
                
                setTargetProfessionals(parseArr('Target: '))
                
                const rel = parseArr('Relationship: ')[0]
                if (rel) setRelationship(rel)
                
                setContactMethods(parseArr('Contact via: '))
                
                const hear = parseArr('Heard from: ')[0]
                if (hear) setHearAboutUs(hear)
                
                setSubleaseInspirations(parseArr('Inspiration: '))
                
                const brandAmb = parseArr('Brand Ambassador: ')[0]
                if (brandAmb === 'Yes') setBrandAmbassador(true)
                if (brandAmb === 'No') setBrandAmbassador(false)
              }

              if (draft.availabilityHours) {
                const ah = draft.availabilityHours as any
                if (ah.contactName) setContactName(ah.contactName)
                if (ah.contactEmail) setContactEmail(ah.contactEmail)
                if (ah.contactPhone) setContactPhone(ah.contactPhone)
                if (ah.signatureName) setSignatureName(ah.signatureName)
              }

              const media = draft.media || []
              const photos = media.filter((m: any) => m.type === 'IMAGE')
              const videos = media.filter((m: any) => m.type === 'VIDEO')
              if (photos.length > 0) {
                featuredImageRef.current = photos[0]
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
        }

        // No draftId in URL → fresh form, don't create anything in DB yet
        // Draft will be created on-demand when user clicks "Save & Exit" or uploads images
      } catch (err) {
        console.error('Failed to init draft:', err)
      } finally {
        setLoadingDraft(false)
      }
    }
    initDraft()
  }, [status, searchParams])

  useEffect(() => {
    if (currentStep !== 2) return // Only load map on step 2

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
    if (!apiKey || apiKey === 'your-google-maps-api-key') return

    const loader = new Loader({ apiKey, version: 'weekly', libraries: ['places'] }) as any
    loader.load().then((google: any) => {
      setMapsLoaded(true)
      if (mapRef.current) {
        const defaultLatLng = { lat: latitude || 28.5383, lng: longitude || -81.3792 }
        const map = new google.maps.Map(mapRef.current, {
          center: defaultLatLng, zoom: latitude ? 15 : 10,
          mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
        })
        const marker = new google.maps.Marker({ position: defaultLatLng, map, draggable: true })

        if (autocompleteInputRef.current) {
          const autocomplete = new google.maps.places.Autocomplete(autocompleteInputRef.current, { types: ['address'] })
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
            let parsedStreet = '', parsedCity = '', parsedState = '', parsedZip = ''
            addressComponents.forEach((comp: any) => {
              if (comp.types.includes('street_number')) parsedStreet = comp.long_name + ' '
              if (comp.types.includes('route')) parsedStreet += comp.long_name
              if (comp.types.includes('locality')) parsedCity = comp.long_name
              if (comp.types.includes('administrative_area_level_1')) parsedState = comp.short_name
              if (comp.types.includes('postal_code')) parsedZip = comp.long_name
            })
            setStreetAddress(parsedStreet || place.formatted_address || '')
            setCity(parsedCity)
            setState(parsedState)
            setZipCode(parsedZip)
          })
        }
        marker.addListener('dragend', () => {
          const pos = marker.getPosition()
          if (pos) { setLatitude(pos.lat()); setLongitude(pos.lng()) }
        })
      }
    }).catch((err: any) => console.error('Maps failed:', err))
  }, [currentStep, latitude, longitude])

  // Lazily create a draft in DB only when actually needed (e.g. image upload)
  const ensureDraftId = async (): Promise<string | null> => {
    if (draftId) return draftId
    try {
      const res = await fetch('/api/listings/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceType: 'EXAM_ROOM' }),
      })
      const data = await res.json()
      if (res.ok && data?.id) {
        setDraftId(data.id)
        return data.id
      }
    } catch (err) {
      console.error('Failed to create draft:', err)
    }
    return null
  }

  const handleImageUpload = async (files: File[]) => {
    if (isImageProcessing.current) return
    isImageProcessing.current = true
    
    try {
      const currentDraftId = await ensureDraftId()
      if (!currentDraftId) return
      for (const file of files) {
        const tempId = `local-${Date.now()}-${Math.random()}`
        const localUrl = URL.createObjectURL(file)
        const optimisticMedia = { id: tempId, originalUrl: localUrl, uploading: true }
        
        // Use ref for synchronous check — never nest setState calls
        if (!featuredImageRef.current) {
          featuredImageRef.current = optimisticMedia
          setFeaturedImage(optimisticMedia)
        } else {
          setAdditionalImages(prev => [...prev, optimisticMedia])
        }
        
        // Upload in background without blocking
        ;(async () => {
          const key = `image-${tempId}`
          setPhotoUploadProgress(p => ({ ...p, [key]: 5 }))
          try {
            const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, initialQuality: 0.8 })
            const formData = new FormData()
            formData.append('file', compressed, file.name)
            formData.append('listingId', currentDraftId)
            const data = await uploadWithProgress('/api/upload/image', formData, (p: number) => setPhotoUploadProgress(prev => ({ ...prev, [key]: p })))
            
            // Replace optimistic preview with real data — no nested setState
            if (featuredImageRef.current?.id === tempId) {
              featuredImageRef.current = data.media
              setFeaturedImage(data.media)
            } else {
              setAdditionalImages(prev => prev.map(img => img.id === tempId ? data.media : img))
            }
          } catch (err: any) {
            console.error(err)
            // Remove failed upload — no nested setState
            if (featuredImageRef.current?.id === tempId) {
              featuredImageRef.current = null
              setFeaturedImage(null)
            } else {
              setAdditionalImages(prev => prev.filter(img => img.id !== tempId))
            }
          } finally {
            setPhotoUploadProgress(p => { const c = { ...p }; delete c[key]; return c })
          }
        })()
      }
    } finally {
      setTimeout(() => { isImageProcessing.current = false }, 300)
    }
  }

  const handleCaptionUpdate = async (imageId: string, caption: string) => {
    try {
      await fetch(`/api/listings/media/${imageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption }),
      })
    } catch (err: any) { console.error(err) }
  }

  const handleDeleteImage = async (imageId: string, url: string, type: string) => {
    const match = url.match(/\/v\d+\/([^\s]+)\.[a-z0-9]+$/i)
    const publicId = match ? match[1] : null
    if (!publicId) return
    try {
      if (type === 'featured') {
        // Read current additional images and promote first one, no nested setState
        setAdditionalImages(prev => {
          const remaining = [...prev]
          const promoted = remaining.shift() || null
          featuredImageRef.current = promoted
          setFeaturedImage(promoted)
          return remaining
        })
      }
      else if (type === 'video') setPropertyVideo(null)
      else setAdditionalImages(prev => prev.filter((p: any) => p.id !== imageId))
      await fetch(`/api/upload/${publicId}`, { method: 'DELETE' })
    } catch (err: any) { console.error(err) }
  }

  const handleVideoUpload = async (files: File[]) => {
    const file = files[0]
    if (!file) return
    const currentDraftId = await ensureDraftId()
    if (!currentDraftId) return
    const key = `video-${Date.now()}`
    setPhotoUploadProgress(p => ({ ...p, [key]: 5 }))
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('listingId', currentDraftId)
      const data = await uploadWithProgress('/api/upload/video', formData, (p: number) => setPhotoUploadProgress(prev => ({ ...prev, [key]: p })))
      setPropertyVideo(data.media)
    } catch (err: any) {
      console.error(err)
    } finally {
      setPhotoUploadProgress(p => { const c = { ...p }; delete c[key]; return c })
    }
  }

  const imageDropzone = useDropzone({ onDrop: handleImageUpload, accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] } })
  const videoDropzone = useDropzone({ onDrop: handleVideoUpload, accept: { 'video/*': ['.mp4', '.mov', '.webm'] }, maxFiles: 1 })

  const generateAIDescription = async () => {
    if (!streetAddress || !city) return alert('Please fill in your address and city first!')
    setGeneratingDesc(true)
    setDescription('')
    try {
      const res = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: streetAddress, city, state, rooms: examRooms, rent: monthlyRent,
          amenities: amenitiesIncluded, constructionType, targetProfessionals,
        }),
      })
      if (!res.ok || !res.body) throw new Error('Failed to generate')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let done = false
      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        setDescription(prev => prev + decoder.decode(value, { stream: true }))
      }
    } catch (err) {
      console.error(err)
      alert('Failed to generate description.')
    } finally {
      setGeneratingDesc(false)
    }
  }

  const toggleArrayItem = (arr: string[], item: string, setter: (val: string[]) => void) => setter(arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item])

  const handleSaveAndExit = async () => {
    try {
      const payload = {
        ...(draftId ? { id: draftId } : {}),
        spaceType: 'EXAM_ROOM',
        title: streetAddress ? `Medical Space at ${streetAddress}, ${city}` : 'Draft Listing',
        rooms: examRooms ? parseInt(examRooms) : 1,
        address: streetAddress,
        city,
        state: state === 'Other' ? otherState : state,
        zipCode,
        country: 'US',
        latitude,
        longitude,
        description,
        pricePerMonth: monthlyRent ? parseFloat(monthlyRent) : null,
        amenities: [
          ...amenitiesIncluded,
          ...areasAvailable.map(a => `Area: ${a}`),
          ...(areasAvailable.includes('Other') && otherAreaText ? [`Other Area: ${otherAreaText}`] : []),
          ...(otherAmenities ? [`Other: ${otherAmenities}`] : []),
          ...(entireOffice !== null ? [`Entire Office: ${entireOffice ? 'Yes' : 'No'}`] : []),
          ...(availability ? [`Availability: ${availability}`] : []),
          ...(leaseType ? [`Lease Type: ${leaseType}`] : []),
          ...(constructionType ? [`Construction: ${constructionType}`] : []),
          ...targetProfessionals.map(p => `Target: ${p}`),
          ...(relationship ? [`Relationship: ${relationship}`] : []),
          ...contactMethods.map(m => `Contact via: ${m}`),
          ...(hearAboutUs ? [`Heard from: ${hearAboutUs}`] : []),
          ...subleaseInspirations.map(s => `Inspiration: ${s}`),
          ...(brandAmbassador !== null ? [`Brand Ambassador: ${brandAmbassador ? 'Yes' : 'No'}`] : []),
        ],
        availabilityHours: { contactName, contactEmail, contactPhone, signatureName, region },
      }

      const res = await fetch('/api/listings/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const savedDraft = await res.json()
      const savedId = draftId || savedDraft?.id

      if (savedId && monthlyRent) {
        await fetch(`/api/listings/${savedId}/pricing`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pricePerMonth: parseFloat(monthlyRent) }),
        })
      }
    } catch(e) {
      console.error(e)
    }
    router.push('/dashboard')
  }

  const handleSubmit = async () => {
    if (!latitude || !longitude) {
      setSubmitError({ message: 'Please search and select your address from the "Enter address" dropdown to set the map location.', step: 2 })
      return
    }
    if (!streetAddress || !city || !state || !zipCode || (state === 'Other' && !otherState)) {
      setSubmitError({ message: 'Please fill in your complete address.', step: 2 })
      return
    }
    if (targetProfessionals.length === 0) {
      setSubmitError({ message: 'Please select at least one professional category.', step: 3 })
      return
    }
    if (entireOffice === null) {
      setSubmitError({ message: 'Please specify if your entire office is available.', step: 3 })
      return
    }
    if (!availability) {
      setSubmitError({ message: 'Please specify if the space is available full time or part time.', step: 3 })
      return
    }
    if (!leaseType) {
      setSubmitError({ message: 'Please specify the lease type.', step: 3 })
      return
    }
    if (!constructionType) {
      setSubmitError({ message: 'Please select the construction type.', step: 4 })
      return
    }
    if (!featuredImage) {
      setSubmitError({ message: 'Please upload a featured image for your space.', step: 5 })
      return
    }
    if (!description || description.trim().length < 10) {
      setSubmitError({ message: 'Please provide a description of at least 10 characters.', step: 6 })
      return
    }
    if (!monthlyRent || parseFloat(monthlyRent) <= 0) {
      setSubmitError({ message: 'Please provide a valid monthly base rent.', step: 7 })
      return
    }
    if (!relationship) {
      setSubmitError({ message: 'Please specify your relationship to the property.', step: 7 })
      return
    }
    if (!contactName.trim() || !contactEmail.trim() || !contactPhone.trim()) {
      setSubmitError({ message: 'Please provide complete contact details (Name, Email, Phone).', step: 7 })
      return
    }
    if (!attestation1 || !attestation2 || !attestation3) {
      setSubmitError({ message: 'Please accept all attestation checkboxes.', step: 8 })
      return
    }
    if (!signatureName.trim()) {
      setSubmitError({ message: 'Please provide your electronic signature.', step: 8 })
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    let currentDraftId = draftId
    if (!currentDraftId) {
      currentDraftId = await ensureDraftId()
      if (!currentDraftId) {
        setSubmitError({ message: 'Failed to initialize listing draft.' })
        setSubmitting(false)
        return
      }
    }

    try {
      await fetch('/api/listings/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentDraftId,
          spaceType: 'EXAM_ROOM',
          title: `Medical Space at ${streetAddress}, ${city}`,
          rooms: examRooms ? parseInt(examRooms) : 1,
          address: streetAddress,
          city,
          state: state === 'Other' ? otherState : state,
          zipCode,
          country: 'US',
          latitude,
          longitude,
          description,
          pricePerMonth: monthlyRent ? parseFloat(monthlyRent) : null,
          amenities: [
            ...amenitiesIncluded,
            ...areasAvailable.map(a => `Area: ${a}`),
            ...(areasAvailable.includes('Other') && otherAreaText ? [`Other Area: ${otherAreaText}`] : []),
            ...(otherAmenities ? [`Other: ${otherAmenities}`] : []),
            ...(entireOffice !== null ? [`Entire Office: ${entireOffice ? 'Yes' : 'No'}`] : []),
            ...(availability ? [`Availability: ${availability}`] : []),
            ...(leaseType ? [`Lease Type: ${leaseType}`] : []),
            ...(constructionType ? [`Construction: ${constructionType}`] : []),
            ...targetProfessionals.map(p => `Target: ${p}`),
            ...(relationship ? [`Relationship: ${relationship}`] : []),
            ...contactMethods.map(m => `Contact via: ${m}`),
            ...(hearAboutUs ? [`Heard from: ${hearAboutUs}`] : []),
            ...subleaseInspirations.map(s => `Inspiration: ${s}`),
            ...(brandAmbassador !== null ? [`Brand Ambassador: ${brandAmbassador ? 'Yes' : 'No'}`] : []),
          ],
          availabilityHours: { contactName, contactEmail, contactPhone, signatureName, region },
        }),
      })

      await fetch(`/api/listings/${currentDraftId}/pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pricePerMonth: monthlyRent ? parseFloat(monthlyRent) : null }),
      })

      const publishRes = await fetch(`/api/listings/${currentDraftId}/publish`, { method: 'PUT' })
      const publishData = await publishRes.json()

      if (publishRes.ok && publishData.success) {
        setSubmitSuccess(true)
      } else {
        setSubmitError({ message: publishData.error || 'Failed to submit listing.' })
      }
    } catch (err: any) {
      setSubmitError({ message: err.message || 'Submission failed.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Reusable square choice box component
  const ChoiceBox = ({ label, icon: Icon, selected, onClick, small = false }: any) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex ${small ? 'flex-row items-center gap-4 px-5 h-20' : 'flex-col justify-between items-start p-5 h-36'} text-left rounded-2xl border-2 transition-all ${
        selected
          ? 'border-[#1a2b49] bg-[#1a2b49] shadow-md ring-1 ring-[#1a2b49]'
          : 'border-slate-200 hover:border-slate-800 bg-white'
      }`}
    >
      <Icon className={`${small ? 'w-6 h-6 flex-shrink-0' : 'w-8 h-8'} ${selected ? 'text-white' : 'text-slate-700'}`} />
      <span className={`font-semibold ${small ? 'text-sm leading-snug' : 'text-base'} ${selected ? 'text-white' : 'text-slate-900'}`}>{label}</span>
    </button>
  )

  if (status === 'loading' || loadingDraft) {
    return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-10 h-10 text-teal-600 animate-spin" /></div>
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <header className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
           <img src="/logo-new.png" alt="Logo" className="h-8 w-auto object-contain cursor-pointer" onClick={() => router.push('/')} />
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-6 shadow-lg">
            <div className="w-16 h-16 bg-teal-50 border border-teal-200 rounded-full flex items-center justify-center text-teal-600 mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-[#1a2b49]">Listing Submitted!</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Your listing has been submitted successfully. Our team will review it and it will be live on the platform shortly.
            </p>
            <button onClick={() => router.push('/dashboard')} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition-colors">
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans overflow-x-hidden">
      {/* Top Header */}
      <header className="flex justify-between items-center px-6 py-4 bg-white z-50">
         <img src="/logo-new.png" alt="Logo" className="h-8 w-auto object-contain cursor-pointer" onClick={() => router.push('/')} />
         <button onClick={handleSaveAndExit} className="px-5 py-2 rounded-full text-sm font-semibold bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 transition-colors shadow-sm">
           Save & exit
         </button>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col items-center pb-32 px-6 ${currentStep === 1 ? 'justify-center' : 'pt-10'}`}>
        <div className={`w-full animate-in fade-in slide-in-from-bottom-4 duration-500 ${currentStep === 1 ? 'max-w-[1300px]' : 'max-w-2xl space-y-8'}`}>
           
           {/* Intro Step */}
           {currentStep === 1 && (
             <div className="flex flex-col md:flex-row items-center justify-between gap-10 lg:gap-24 py-10 md:py-20">
               {/* Left Side */}
               <div className="flex-[1.2] text-left pr-4 lg:pr-10">
                 <h1 className="text-[44px] md:text-[54px] lg:text-[64px] font-semibold text-[#1a2b49] leading-[1.15] tracking-tight">
                   It's easy to get started<br className="hidden lg:block" /> on Link <span className="text-[#E51D53]">Medical</span> Spaces
                 </h1>
               </div>

               {/* Right Side */}
               <div className="flex-1 w-full max-w-[550px] space-y-10 md:space-y-12">
                 
                 {/* Step 1 */}
                 <div className="flex gap-6 items-start border-b border-slate-100 pb-10">
                   <div className="text-2xl font-semibold text-[#1a2b49] pt-1">1</div>
                   <div className="flex-1">
                     <h3 className="text-2xl font-semibold text-[#1a2b49]">Tell us about your place</h3>
                     <p className="text-slate-500 mt-3 leading-relaxed text-[17px]">Share some basic info, such as where it is and what professionals it's available to.</p>
                   </div>
                   <div className="w-24 h-24 hidden sm:flex items-center justify-center">
                     <Map className="w-12 h-12 text-[#E51D53] opacity-80" strokeWidth={1.5} />
                   </div>
                 </div>

                 {/* Step 2 */}
                 <div className="flex gap-6 items-start border-b border-slate-100 pb-10">
                   <div className="text-2xl font-semibold text-[#1a2b49] pt-1">2</div>
                   <div className="flex-1">
                     <h3 className="text-2xl font-semibold text-[#1a2b49]">Make it stand out</h3>
                     <p className="text-slate-500 mt-3 leading-relaxed text-[17px]">Add 5 or more photos plus a description — we'll help you out with AI generation.</p>
                   </div>
                   <div className="w-24 h-24 hidden sm:flex items-center justify-center">
                     <Camera className="w-12 h-12 text-[#E51D53] opacity-80" strokeWidth={1.5} />
                   </div>
                 </div>

                 {/* Step 3 */}
                 <div className="flex gap-6 items-start">
                   <div className="text-2xl font-semibold text-[#1a2b49] pt-1">3</div>
                   <div className="flex-1">
                     <h3 className="text-2xl font-semibold text-[#1a2b49]">Finish up and publish</h3>
                     <p className="text-slate-500 mt-3 leading-relaxed text-[17px]">Choose a monthly rent, verify a few details, then publish your listing.</p>
                   </div>
                   <div className="w-24 h-24 hidden sm:flex items-center justify-center">
                     <CheckCircle2 className="w-12 h-12 text-[#E51D53] opacity-80" strokeWidth={1.5} />
                   </div>
                 </div>

               </div>
             </div>
           )}

           {currentStep === 2 && (
             <div className="space-y-8">
                <h1 className="text-3xl font-bold text-[#1a2b49]">Where's your place located?</h1>
                <p className="text-slate-500">Your address is only shared with guests after they've made a reservation.</p>
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                  <div ref={mapRef} className="w-full h-64" />
                  {!mapsLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                      <p className="text-xs text-slate-500 font-medium text-center px-6">Loading maps...</p>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input ref={autocompleteInputRef} type="text" placeholder="Enter address *" className="w-full pl-10 pr-4 py-4 border-2 border-slate-200 hover:border-slate-300 focus:border-slate-800 rounded-xl text-sm font-medium outline-none transition-colors" />
                </div>
                
                <h2 className="text-xl font-bold text-[#1a2b49] pt-4">Confirm your address</h2>
                <div className="bg-white border-2 border-slate-200 rounded-2xl divide-y divide-slate-200 overflow-hidden">
                  <input type="text" placeholder="Street Address *" value={streetAddress} onChange={e => setStreetAddress(e.target.value)} className="w-full px-4 py-4 text-sm font-medium outline-none" />
                  <input type="text" placeholder="Street Address line 2 (optional)" value={streetAddress2} onChange={e => setStreetAddress2(e.target.value)} className="w-full px-4 py-4 text-sm font-medium outline-none" />
                  <input type="text" placeholder="City *" value={city} onChange={e => setCity(e.target.value)} className="w-full px-4 py-4 text-sm font-medium outline-none" />
                  <div className="relative">
                    <label className="absolute left-4 top-1.5 text-[10px] font-semibold text-slate-400">State / Province <span className="text-red-500">*</span></label>
                    <select value={state} onChange={e => setState(e.target.value)} className="w-full appearance-none bg-white px-4 pt-6 pb-2 text-sm font-medium outline-none cursor-pointer">
                      {US_STATES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                  {state === 'Other' && (
                    <input type="text" placeholder="Enter state or province name... *" value={otherState} onChange={e => setOtherState(e.target.value)} className="w-full px-4 py-4 text-sm font-medium outline-none bg-slate-50 border-t border-slate-200" />
                  )}
                  <input type="text" placeholder="Zip Code *" value={zipCode} onChange={e => setZipCode(e.target.value)} className="w-full px-4 py-4 text-sm font-medium outline-none" />
                </div>
             </div>
           )}

           {currentStep === 3 && (
             <div className="space-y-8">
               <h1 className="text-3xl font-bold text-[#1a2b49]">Tell us about your place</h1>
               
               <div className="flex flex-col gap-4">
                 <label className="text-lg font-semibold text-[#1a2b49]">Which professionals is your space available to? <span className="text-red-500">*</span></label>
                 <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                 <ChoiceBox
                   label="Physicians (MD/DO)"
                   icon={Stethoscope}
                   small
                   selected={targetProfessionals.includes('Physicians (MD/DO)')}
                   onClick={() => toggleArrayItem(targetProfessionals, 'Physicians (MD/DO)', setTargetProfessionals)}
                 />
                 <ChoiceBox
                   label="Other Healthcare Professionals"
                   icon={Activity}
                   small
                   selected={targetProfessionals.includes('Other Healthcare Professionals')}
                   onClick={() => toggleArrayItem(targetProfessionals, 'Other Healthcare Professionals', setTargetProfessionals)}
                 />
                 </div>
               </div>

               <hr className="border-slate-200" />

               <div className="flex flex-col gap-4">
                 <label className="text-lg font-semibold text-[#1a2b49]">Is your entire office available for leasing? <span className="text-red-500">*</span></label>
                 <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                   <ChoiceBox
                     label="Yes"
                     icon={CheckCircle}
                     small
                     selected={entireOffice === true}
                     onClick={() => setEntireOffice(true)}
                   />
                   <ChoiceBox
                     label="No"
                     icon={XCircle}
                     small
                     selected={entireOffice === false}
                     onClick={() => setEntireOffice(false)}
                   />
                 </div>
               </div>

               <hr className="border-slate-200" />

               <div className="flex flex-col gap-2">
                 <label className="text-lg font-semibold text-[#1a2b49]">How many exam rooms are available? <span className="text-red-500">*</span></label>
                 <div className="flex items-center gap-5 pt-2">
                   <button type="button" onClick={() => setExamRooms(Math.max(1, parseInt(examRooms || '1') - 1).toString())} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" disabled={parseInt(examRooms || '1') <= 1}>
                     <Minus className="w-5 h-5" />
                   </button>
                   <span className="text-xl font-medium text-slate-900 w-8 text-center">{examRooms || '1'}</span>
                   <button type="button" onClick={() => setExamRooms((parseInt(examRooms || '1') + 1).toString())} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors">
                     <Plus className="w-5 h-5" />
                   </button>
                 </div>
               </div>

               <hr className="border-slate-200" />

               <div className="flex flex-col gap-4">
                 <label className="text-lg font-semibold text-[#1a2b49]">Is your space available full time or part-time? <span className="text-red-500">*</span></label>
                 <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                   <ChoiceBox
                     label="Full Time"
                     icon={Clock}
                     small
                     selected={availability === 'full_time'}
                     onClick={() => setAvailability('full_time')}
                   />
                   <ChoiceBox
                     label="Part Time"
                     icon={Hourglass}
                     small
                     selected={availability === 'part_time'}
                     onClick={() => setAvailability('part_time')}
                   />
                 </div>
               </div>

               <hr className="border-slate-200" />
               
               <div className="flex flex-col gap-4">
                 <label className="text-lg font-semibold text-[#1a2b49]">Lease type <span className="text-red-500">*</span></label>
                 <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                   <ChoiceBox
                     label="Primary Lease"
                     icon={FileText}
                     small
                     selected={leaseType === 'primary'}
                     onClick={() => setLeaseType('primary')}
                   />
                   <ChoiceBox
                     label="Sublease"
                     icon={PenTool}
                     small
                     selected={leaseType === 'sublease'}
                     onClick={() => setLeaseType('sublease')}
                   />
                 </div>
               </div>
             </div>
           )}

           {currentStep === 4 && (
             <div className="space-y-8">
               <h1 className="text-3xl font-bold text-[#1a2b49]">Share some basics about your place</h1>
               
               <div className="space-y-8">
                  <div className="flex flex-col gap-4">
                    <label className="text-lg font-semibold text-[#1a2b49]">Other available areas</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <ChoiceBox label="Waiting Room" icon={Sofa} small selected={areasAvailable.includes('Waiting Room')} onClick={() => toggleArrayItem(areasAvailable, 'Waiting Room', setAreasAvailable)} />
                      <ChoiceBox label="Restroom" icon={Droplet} small selected={areasAvailable.includes('Restroom')} onClick={() => toggleArrayItem(areasAvailable, 'Restroom', setAreasAvailable)} />
                      <ChoiceBox label="Break Room" icon={Coffee} small selected={areasAvailable.includes('Break Room')} onClick={() => toggleArrayItem(areasAvailable, 'Break Room', setAreasAvailable)} />
                      <ChoiceBox label="Office" icon={Briefcase} small selected={areasAvailable.includes('Office')} onClick={() => toggleArrayItem(areasAvailable, 'Office', setAreasAvailable)} />
                      <ChoiceBox label="Other" icon={HelpCircle} small selected={areasAvailable.includes('Other')} onClick={() => toggleArrayItem(areasAvailable, 'Other', setAreasAvailable)} />
                    </div>
                    {areasAvailable.includes('Other') && (
                      <input type="text" placeholder="Please specify other area..." value={otherAreaText} onChange={e => setOtherAreaText(e.target.value)} className="w-full mt-2 border-2 border-slate-200 focus:border-slate-800 rounded-xl px-4 py-4 text-base outline-none transition-colors" />
                    )}
                  </div>
                  
                  <hr className="border-slate-200" />

                  <div className="flex flex-col gap-4">
                    <label className="text-lg font-semibold text-[#1a2b49]">Amenities included</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <ChoiceBox label="Utilities" icon={Zap} small selected={amenitiesIncluded.includes('Utilities')} onClick={() => toggleArrayItem(amenitiesIncluded, 'Utilities', setAmenitiesIncluded)} />
                      <ChoiceBox label="Internet" icon={Wifi} small selected={amenitiesIncluded.includes('Internet')} onClick={() => toggleArrayItem(amenitiesIncluded, 'Internet', setAmenitiesIncluded)} />
                      <ChoiceBox label="Cleaning Services" icon={Sparkles} small selected={amenitiesIncluded.includes('Cleaning Services')} onClick={() => toggleArrayItem(amenitiesIncluded, 'Cleaning Services', setAmenitiesIncluded)} />
                    </div>
                  </div>
                  <input type="text" placeholder="Other amenities..." value={otherAmenities} onChange={e => setOtherAmenities(e.target.value)} className="w-full border-2 border-slate-200 focus:border-slate-800 rounded-xl px-4 py-4 text-base outline-none transition-colors" />

                  <hr className="border-slate-200" />

                  <div className="flex flex-col gap-4">
                    <label className="text-lg font-semibold text-[#1a2b49]">Construction Type <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                      <ChoiceBox label="New Construction" icon={Hammer} small selected={constructionType === 'new'} onClick={() => setConstructionType('new')} />
                      <ChoiceBox label="Established Building" icon={Building} small selected={constructionType === 'established'} onClick={() => setConstructionType('established')} />
                    </div>
                  </div>
               </div>
             </div>
           )}

           {currentStep === 6 && (
             <div className="space-y-8">
               <div className="space-y-2">
                 <h1 className="text-3xl font-bold text-[#1a2b49]">Create your description <span className="text-red-500">*</span></h1>
                 <p className="text-slate-500">Share what makes your place special.</p>
               </div>
               
               <div className="space-y-4">
                 <button type="button" onClick={generateAIDescription} disabled={generatingDesc} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold rounded-lg transition-colors flex items-center gap-2">
                    {generatingDesc ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Auto-generate Description (AI)'}
                 </button>
                 <textarea value={description} onChange={e => setDescription(e.target.value)} rows={10} placeholder="We have a great exam room available..." className="w-full border-2 border-slate-200 focus:border-slate-800 rounded-2xl px-5 py-4 text-base outline-none transition-colors resize-y leading-relaxed" />
               </div>
             </div>
           )}

           {currentStep === 5 && (
             <div className="space-y-8">
               <div className="space-y-2">
                 <h1 className="text-3xl font-bold text-[#1a2b49]">Add some photos of your space</h1>
                 <p className="text-slate-500">You'll need at least one photo to get started. The first photo will be used as the thumbnail.</p>
               </div>
               
               <div className="space-y-6">
                 <div>
                   <label className="text-lg font-bold text-[#1a2b49] block mb-3">Photos <span className="text-red-500">*</span></label>
                   
                   <div className="overflow-hidden block">
                      {!featuredImage ? (
                        <div {...imageDropzone.getRootProps()} className="float-left w-full sm:w-[280px] h-[280px] mr-4 mb-4 border-[2px] border-dashed border-slate-300 hover:border-slate-800 hover:bg-slate-50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors text-center p-4">
                          <input {...imageDropzone.getInputProps()} />
                          <UploadCloud className="w-12 h-12 text-slate-400 mb-4" />
                          <p className="text-lg font-semibold text-slate-700">Drag your photo here *</p>
                          <p className="text-sm text-slate-500 mt-2">or click to browse</p>
                        </div>
                      ) : (
                        <div className="float-left w-[280px] h-[280px] mr-4 mb-4 relative rounded-xl overflow-hidden border-2 border-[#E51D53] group">
                          <img src={featuredImage.originalUrl} alt="Thumbnail" onClick={() => setZoomedImage(featuredImage.originalUrl)} className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                          {featuredImage.uploading ? (
                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-20">
                              <Loader2 className="w-8 h-8 animate-spin text-[#E51D53]" />
                            </div>
                          ) : (
                            <button onClick={() => handleDeleteImage(featuredImage.id, featuredImage.originalUrl, 'featured')} className="absolute top-3 right-3 bg-white/90 rounded-full p-2 text-slate-700 hover:text-red-600 shadow-sm transition-colors opacity-0 group-hover:opacity-100 z-10">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      )}
                      
                      {additionalImages.map(img => (
                        <div key={img.id} className="float-left w-[132px] h-[132px] mr-4 mb-4 relative rounded-xl overflow-hidden border border-slate-200 group">
                          <img src={img.originalUrl} alt="Additional" onClick={() => setZoomedImage(img.originalUrl)} className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                          {img.uploading ? (
                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-20">
                              <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
                            </div>
                          ) : (
                            <button onClick={() => handleDeleteImage(img.id, img.originalUrl, 'additional')} className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 text-slate-700 hover:text-red-600 shadow-sm transition-colors opacity-0 group-hover:opacity-100 z-10">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      
                      {featuredImage && (
                        <div {...imageDropzone.getRootProps()} className="float-left w-[132px] h-[132px] mr-4 mb-4 border-[2px] border-dashed border-slate-300 hover:border-slate-800 hover:bg-slate-50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
                          <input {...imageDropzone.getInputProps()} />
                          <Plus className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                    </div>
                 </div>

                 <div className="pt-6 border-t border-slate-200">
                   <label className="text-lg font-bold text-[#1a2b49] block mb-3">Property Video (Optional)</label>
                   {propertyVideo ? (
                     <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group">
                       <video src={propertyVideo.originalUrl} controls className="w-full h-full object-contain" />
                       <button onClick={() => handleDeleteImage(propertyVideo.id, propertyVideo.originalUrl, 'video')} className="absolute top-4 right-4 bg-white/90 rounded-full p-2 text-slate-700 hover:text-red-600 shadow-sm transition-colors opacity-0 group-hover:opacity-100">
                         <Trash2 className="w-5 h-5" />
                       </button>
                     </div>
                   ) : (
                     <div {...videoDropzone.getRootProps()} className="border-[2px] border-dashed border-slate-300 hover:border-slate-800 hover:bg-slate-50 rounded-2xl p-8 cursor-pointer transition-colors text-center flex flex-col items-center justify-center">
                       <input {...videoDropzone.getInputProps()} />
                       <p className="font-semibold text-slate-700">Upload video (Max 500MB)</p>
                     </div>
                   )}
                 </div>
               </div>
             </div>
           )}

           {currentStep === 7 && (
             <div className="space-y-8">
               <h1 className="text-3xl font-bold text-[#1a2b49]">Now, set your monthly base rent <span className="text-red-500">*</span></h1>
               <p className="text-slate-500">You can change it anytime.</p>
               <div className="flex justify-center py-10">
                 <div className="relative max-w-sm w-full">
                   <span className="absolute left-6 top-1/2 -translate-y-1/2 text-4xl font-bold text-slate-900">$</span>
                   <input type="number" value={monthlyRent} onChange={e => setMonthlyRent(e.target.value)} placeholder="0 *" className="w-full pl-16 pr-6 py-6 border-2 border-slate-200 focus:border-slate-800 rounded-3xl text-4xl font-extrabold text-slate-900 outline-none transition-colors text-center shadow-sm" />
                 </div>
               </div>
               
               <hr className="border-slate-200" />
               
               <div className="space-y-8 pt-4">
                 <h2 className="text-2xl font-bold text-[#1a2b49]">Contact & Relationship</h2>
                 
                 <div className="space-y-4">
                    <label className="text-lg font-semibold text-[#1a2b49] block">Your relationship to the property <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <ChoiceBox label="Property Owner/Tenant" icon={User} small selected={relationship === 'owner'} onClick={() => setRelationship('owner')} />
                      <ChoiceBox label="Broker/Agent" icon={Users} small selected={relationship === 'broker'} onClick={() => setRelationship('broker')} />
                    </div>
                 </div>

                 <div className="space-y-4 pt-8">
                    <label className="text-lg font-semibold text-[#1a2b49] block mb-2">Contact details</label>
                   <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Contact Person Name *" className="w-full border-2 border-slate-200 focus:border-slate-800 rounded-xl px-5 py-4 text-base outline-none transition-colors" />
                   <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="Email Address *" className="w-full border-2 border-slate-200 focus:border-slate-800 rounded-xl px-5 py-4 text-base outline-none transition-colors" />
                   <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="Phone Number *" className="w-full border-2 border-slate-200 focus:border-slate-800 rounded-xl px-5 py-4 text-base outline-none transition-colors" />
                 </div>
               </div>
             </div>
           )}

           {currentStep === 8 && (
             <div className="space-y-8">
               <div className="space-y-2">
                 <h1 className="text-3xl font-bold text-[#1a2b49]">Finish up and publish</h1>
                 <p className="text-slate-500">Just a few final details before your listing goes live.</p>
               </div>

               <div className="space-y-6">
                 <div>
                   <label className="text-base font-semibold text-[#1a2b49] block mb-2">How did you hear about us?</label>
                   <div className="relative">
                     <select value={hearAboutUs} onChange={e => setHearAboutUs(e.target.value)} className="w-full appearance-none bg-white border-2 border-slate-200 focus:border-slate-800 rounded-xl px-5 py-4 text-base font-medium outline-none transition-colors cursor-pointer">
                       {HEAR_ABOUT_OPTIONS.map(opt => <option key={opt} value={opt === '- Select -' ? '' : opt}>{opt}</option>)}
                     </select>
                     <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                   </div>
                 </div>

                 <div>
                   <label className="text-base font-semibold text-[#1a2b49] block mb-3">Inspiration to sublease</label>
                   <div className="flex flex-col gap-3">
                     {SUBLEASE_INSPIRATIONS.map(ins => (
                       <label key={ins} className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                         <input type="checkbox" checked={subleaseInspirations.includes(ins)} onChange={() => toggleArrayItem(subleaseInspirations, ins, setSubleaseInspirations)} className="w-5 h-5 mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer" />
                         <span className="text-sm font-medium text-slate-700">{ins}</span>
                       </label>
                     ))}
                   </div>
                 </div>

                 <div className="pt-4 space-y-4">
                   <label className="text-lg font-semibold text-[#1a2b49] block mb-1">Referred by Brand Ambassador?</label>
                   <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                     <ChoiceBox label="Yes" icon={CheckCircle} small selected={brandAmbassador === true} onClick={() => setBrandAmbassador(true)} />
                     <ChoiceBox label="No" icon={XCircle} small selected={brandAmbassador === false} onClick={() => setBrandAmbassador(false)} />
                   </div>
                 </div>

                 <div className="space-y-4 pt-6 border-t border-slate-200">
                   <h2 className="text-xl font-bold text-[#1a2b49]">Attestation & Signature</h2>
                   
                   <label className="flex items-start gap-4">
                     <input type="checkbox" checked={attestation1} onChange={e => setAttestation1(e.target.checked)} className="w-5 h-5 mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer" />
                     <span className="text-sm text-slate-600">I have read and agree to the <a href="#" className="text-slate-900 underline font-semibold">Terms and Policies</a>, <a href="#" className="text-slate-900 underline font-semibold">Disclaimer</a>, and <a href="#" className="text-slate-900 underline font-semibold">Privacy Policy</a>.</span>
                   </label>
                   <label className="flex items-start gap-4">
                     <input type="checkbox" checked={attestation2} onChange={e => setAttestation2(e.target.checked)} className="w-5 h-5 mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer" />
                     <span className="text-sm text-slate-600">I confirm that I am the property owner or have the legal authority to advertise this property.</span>
                   </label>
                   <label className="flex items-start gap-4">
                     <input type="checkbox" checked={attestation3} onChange={e => setAttestation3(e.target.checked)} className="w-5 h-5 mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer" />
                     <span className="text-sm text-slate-600">By uploading images, I confirm I have the legal right to use and distribute these materials.</span>
                   </label>

                   <div className="pt-4">
                     <input type="text" value={signatureName} onChange={e => setSignatureName(e.target.value)} placeholder="Type your full name as electronic signature *" className="w-full border-2 border-slate-200 focus:border-slate-800 rounded-xl px-5 py-4 text-base outline-none transition-colors" />
                   </div>
                 </div>

                  {submitError && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <div>
                        {submitError.message}
                        {submitError.step && (
                          <button 
                            onClick={() => { 
                              setCurrentStep(submitError.step!); 
                              setSubmitError(null);
                              window.scrollTo({ top: 0, behavior: 'smooth' }); 
                            }}
                            className="ml-2 underline font-bold hover:text-red-900 transition-colors"
                          >
                            Go to Step {submitError.step}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
               </div>
             </div>
           )}

        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
         {/* Progress Bar (Hidden on Intro Step) */}
         {currentStep > 1 && (
           <div className="h-1.5 w-full bg-slate-100 absolute top-0 left-0">
             <div className="h-full bg-slate-900 transition-all duration-300 ease-in-out" style={{ width: `${((currentStep - 1) / (TOTAL_STEPS - 1)) * 100}%` }} />
           </div>
         )}
         
         <div className={`flex items-center px-8 py-4 ${currentStep === 1 ? 'justify-end' : 'justify-between'}`}>
            {currentStep > 1 && (
              <button onClick={handleBack} className="font-semibold text-slate-900 hover:bg-slate-100 px-5 py-2.5 rounded-lg transition-colors">
                <u className="no-underline">Back</u>
              </button>
            )}
            
            <button 
              onClick={handleNext} 
              disabled={submitting || Object.keys(photoUploadProgress).length > 0}
              className={`font-bold text-white px-8 py-3.5 rounded-lg transition-all active:scale-95 flex items-center gap-2 ${
                currentStep === 1 ? 'bg-[#E51D53] hover:bg-rose-600' : 
                currentStep === TOTAL_STEPS ? 'bg-[#E51D53] hover:bg-rose-600' : 
                'bg-slate-900 hover:bg-slate-800'
              } disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {submitting || Object.keys(photoUploadProgress).length > 0 ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {currentStep === 1 ? 'Get started' : currentStep === TOTAL_STEPS ? 'Publish' : 'Next'}
            </button>
         </div>
      </footer>

      {zoomedImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setZoomedImage(null)}>
          <button 
            onClick={() => setZoomedImage(null)} 
            className="absolute top-6 right-6 text-white/70 hover:text-white p-2 rounded-full bg-black/50 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          <img src={zoomedImage} alt="Zoomed" className="max-w-full max-h-full object-contain cursor-default" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}

export default function AddListingPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 text-slate-900 animate-spin" /></div>}>
      <AddListingPage />
    </Suspense>
  )
}
