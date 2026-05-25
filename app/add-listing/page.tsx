'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader } from '@googlemaps/js-api-loader'
import { useDropzone } from 'react-dropzone'
import imageCompression from 'browser-image-compression'
import {
  Stethoscope,
  Building,
  Activity,
  Smile,
  Scan,
  FlaskConical,
  ClipboardList,
  MoreHorizontal,
  Plus,
  Minus,
  Check,
  MapPin,
  Search,
  ArrowLeft,
  ArrowRight,
  Loader2,
  X,
  Camera,
  Video,
  UploadCloud,
  Trash2,
  AlertCircle,
  HelpCircle,
  Eye,
  RefreshCw,
  VideoOff,
} from 'lucide-react'

// Space type categories
const SPACE_TYPES = [
  { id: 'CLINIC_ROOM', label: 'Clinic Room', icon: Activity, description: 'General practice exam rooms' },
  { id: 'OPERATION_THEATRE', label: 'Operation Theatre', icon: FlaskConical, description: 'Surgical suites & procedure rooms' },
  { id: 'CONSULTATION_ROOM', label: 'Consultation Room', icon: ClipboardList, description: 'Doctor offices & consultation spaces' },
  { id: 'DENTAL_CHAIR', label: 'Dental Chair', icon: Smile, description: 'Equipped dental operatories' },
  { id: 'IMAGING_SUITE', label: 'Imaging Suite', icon: Scan, description: 'X-Ray, MRI, or Ultrasound rooms' },
  { id: 'LAB_SPACE', label: 'Lab Space', icon: Building, description: 'Diagnostics or research laboratory space' },
  { id: 'OTHER', label: 'Other Space', icon: MoreHorizontal, description: 'Medical spas or unique wellness spaces' },
]

// Common medical amenities
const AMENITIES_LIST = [
  { id: 'WiFi', label: 'High-Speed WiFi' },
  { id: 'Parking', label: 'Private Parking' },
  { id: 'Reception', label: 'Reception Desk' },
  { id: 'Waiting Area', label: 'Waiting Room' },
  { id: 'Medical Equipment', label: 'Basic Medical Equipment' },
  { id: 'Sterilization Unit', label: 'Sterilization Station' },
  { id: 'Wheelchair Access', label: 'ADA Wheelchair Accessible' },
  { id: 'Emergency Exit', label: 'Emergency Exits & Lighting' },
  { id: 'CCTV', label: '24/7 Security CCTV' },
]

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

export default function AddListingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // State Management
  const [currentStep, setCurrentStep] = useState(1)
  const [draftId, setDraftId] = useState<string | null>(null)
  
  // Step 1: Space Type
  const [selectedSpaceType, setSelectedSpaceType] = useState<string | null>(null)
  
  // Step 2: Space Details
  const [title, setTitle] = useState('')
  const [rooms, setRooms] = useState(1)
  const [squareFeet, setSquareFeet] = useState('')
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  
  // Step 3: Location
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [country, setCountry] = useState('US')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)

  // Step 4: Photo Gallery
  const [uploadedPhotos, setUploadedPhotos] = useState<any[]>([])
  const [photoUploadProgress, setPhotoUploadProgress] = useState<Record<string, number>>({})
  const [photoErrors, setPhotoErrors] = useState<Record<string, string>>({})
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(null)

  // Step 5: Video
  const [uploadedVideo, setUploadedVideo] = useState<any | null>(null)
  const [videoUploadProgress, setVideoUploadProgress] = useState<number | null>(null)
  const [videoError, setVideoError] = useState<string | null>(null)
  
  // Webcam Recording States
  const [isRecordingMode, setIsRecordingMode] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null)
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null)
  const [recordingSeconds, setRecordingSeconds] = useState(0)

  // Loading States
  const [loadingDraft, setLoadingDraft] = useState(true)
  const [savingDraft, setSavingDraft] = useState(false)
  const [mapsLoaded, setMapsLoaded] = useState(false)

  // Refs
  const mapRef = useRef<HTMLDivElement>(null)
  const autocompleteInputRef = useRef<HTMLInputElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerInstanceRef = useRef<any>(null)
  const webcamVideoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin')
    }
  }, [status, router])

  // Load existing draft listing on mount
  useEffect(() => {
    if (status !== 'authenticated') return

    const loadDraft = async () => {
      try {
        const res = await fetch('/api/listings/draft')
        const draft = await res.json()
        
        if (res.ok && draft) {
          setDraftId(draft.id)
          setSelectedSpaceType(draft.spaceType)
          setTitle(draft.title || '')
          setRooms(draft.rooms || 1)
          setSquareFeet(draft.squareFeet ? draft.squareFeet.toString() : '')
          
          let parsedAmenities = []
          try {
            parsedAmenities = typeof draft.amenities === 'string' 
              ? JSON.parse(draft.amenities) 
              : draft.amenities || []
          } catch (_) {
            parsedAmenities = []
          }
          setSelectedAmenities(parsedAmenities)

          setAddress(draft.address || '')
          setCity(draft.city || '')
          setState(draft.state || '')
          setZipCode(draft.zipCode || '')
          setCountry(draft.country || 'US')
          setLatitude(draft.latitude)
          setLongitude(draft.longitude)

          // Load related media
          const media = draft.media || []
          const photos = media.filter((m: any) => m.type === 'IMAGE')
          const video = media.find((m: any) => m.type === 'VIDEO') || null
          
          setUploadedPhotos(photos)
          setUploadedVideo(video)

          // Determine step restoration
          if (!draft.spaceType) {
            setCurrentStep(1)
          } else if (!draft.title || !draft.squareFeet) {
            setCurrentStep(2)
          } else if (!draft.address) {
            setCurrentStep(3)
          } else if (photos.length < 3) {
            setCurrentStep(4)
          } else {
            setCurrentStep(5)
          }
        }
      } catch (err) {
        console.error('Failed to load draft:', err)
      } finally {
        setLoadingDraft(false)
      }
    }

    loadDraft()
  }, [status])

  // Google Maps Integration (Step 3)
  useEffect(() => {
    if (currentStep !== 3) return

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
    if (!apiKey || apiKey === 'your-google-maps-api-key') {
      setMapsLoaded(false)
      return
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places'],
    }) as any

    loader.load().then((google: any) => {
      setMapsLoaded(true)
      
      const defaultLatLng = { lat: latitude || 28.6139, lng: longitude || 77.2090 }

      if (mapRef.current) {
        const map = new google.maps.Map(mapRef.current, {
          center: defaultLatLng,
          zoom: latitude ? 15 : 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        })
        mapInstanceRef.current = map

        const marker = new google.maps.Marker({
          position: defaultLatLng,
          map: map,
          draggable: true,
        })
        markerInstanceRef.current = marker

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

            let streetAddress = ''
            let parsedCity = ''
            let parsedState = ''
            let parsedZip = ''
            let parsedCountry = 'US'

            const addressComponents = place.address_components || []
            addressComponents.forEach((component: any) => {
              const types = component.types
              if (types.includes('street_number')) {
                streetAddress = component.long_name + ' ' + streetAddress
              }
              if (types.includes('route')) {
                streetAddress += component.long_name
              }
              if (types.includes('locality')) {
                parsedCity = component.long_name
              }
              if (types.includes('administrative_area_level_1')) {
                parsedState = component.short_name
              }
              if (types.includes('postal_code')) {
                parsedZip = component.long_name
              }
              if (types.includes('country')) {
                parsedCountry = component.short_name
              }
            })

            setAddress(streetAddress || place.formatted_address || '')
            setCity(parsedCity)
            setState(parsedState)
            setZipCode(parsedZip)
            setCountry(parsedCountry)
          })
        }

        map.addListener('click', (e: any) => {
          const clickedLat = e.latLng.lat()
          const clickedLng = e.latLng.lng()
          setLatitude(clickedLat)
          setLongitude(clickedLng)
          marker.setPosition({ lat: clickedLat, lng: clickedLng })
        })

        marker.addListener('dragend', () => {
          const position = marker.getPosition()
          if (position) {
            setLatitude(position.lat())
            setLongitude(position.lng())
          }
        })
      }
    }).catch((err: any) => console.error('Failed to load Google Maps script', err))
  }, [currentStep, latitude, longitude])

  // Save progress draft to DB
  const saveDraftProgress = async (nextStepIndex?: number) => {
    setSavingDraft(true)
    try {
      const res = await fetch('/api/listings/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: draftId || undefined,
          spaceType: selectedSpaceType,
          title: title || undefined,
          rooms: rooms || 1,
          squareFeet: squareFeet ? parseFloat(squareFeet) : undefined,
          amenities: selectedAmenities,
          address: address || undefined,
          city: city || undefined,
          state: state || undefined,
          zipCode: zipCode || undefined,
          country,
          latitude,
          longitude,
        }),
      })

      const data = await res.json()
      if (res.ok && data) {
        setDraftId(data.id)
        if (nextStepIndex) {
          setCurrentStep(nextStepIndex)
        } else {
          router.push('/dashboard')
        }
      } else {
        alert(data.error || 'Failed to save draft progress')
      }
    } catch (err) {
      alert('Failed to save draft progress')
    } finally {
      setSavingDraft(false)
    }
  }

  // React-dropzone config for images (Step 4)
  const onDropImages = async (acceptedFiles: File[]) => {
    if (!draftId) return
    
    // Check constraints
    if (uploadedPhotos.length + acceptedFiles.length > 20) {
      alert('Maximum of 20 photos allowed.')
      return
    }

    acceptedFiles.forEach(async (file) => {
      // Early hints: immediate preview object url
      const previewUrl = URL.createObjectURL(file)
      const placeholderPhoto = {
        id: `temp-${Date.now()}-${Math.random()}`,
        originalUrl: previewUrl,
        caption: '',
        status: 'uploading',
        name: file.name,
      }

      setUploadedPhotos((prev) => [...prev, placeholderPhoto])
      setPhotoUploadProgress((prev) => ({ ...prev, [file.name]: 5 }))

      try {
        // Compress client-side
        const compressionOptions = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          initialQuality: 0.8,
        }
        
        const compressedFile = await imageCompression(file, compressionOptions)
        
        const formData = new FormData()
        formData.append('file', compressedFile, file.name)
        formData.append('listingId', draftId)

        // Upload to Cloudinary
        const responseData = await uploadWithProgress(
          '/api/upload/image',
          formData,
          (progress) => {
            setPhotoUploadProgress((prev) => ({ ...prev, [file.name]: progress }))
          }
        )

        // Replace placeholder with saved DB record
        setUploadedPhotos((prev) =>
          prev.map((photo) => (photo.name === file.name ? responseData.media : photo))
        )
      } catch (err: any) {
        setPhotoErrors((prev) => ({ ...prev, [file.name]: err.message || 'Upload failed' }))
        setUploadedPhotos((prev) => prev.filter((photo) => photo.name !== file.name))
      } finally {
        setPhotoUploadProgress((prev) => {
          const copy = { ...prev }
          delete copy[file.name]
          return copy
        })
      }
    })
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropImages,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
  })

  // Delete image from DB & Cloudinary
  const handleDeletePhoto = async (photoId: string, url: string) => {
    // Extract public ID from Cloudinary URL
    const match = url.match(/\/v\d+\/([^\s]+)\.[a-z]+$/i)
    const publicId = match ? match[1] : null

    if (!publicId) return

    try {
      setUploadedPhotos((prev) => prev.filter((p) => p.id !== photoId))
      await fetch(`/api/upload/${publicId}`, { method: 'DELETE' })
    } catch (err) {
      console.error('Failed to delete photo', err)
    }
  }

  // Update photo caption on blur
  const handleUpdateCaption = async (photoId: string, caption: string) => {
    try {
      setUploadedPhotos((prev) =>
        prev.map((p) => (p.id === photoId ? { ...p, caption } : p))
      )
      await fetch(`/api/listings/media/${photoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption }),
      })
    } catch (err) {
      console.error('Failed to update caption', err)
    }
  }

  // HTML5 Drag-and-drop sorting
  const handlePhotoDragStart = (index: number) => {
    setDraggedPhotoIndex(index)
  }

  const handlePhotoDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
  }

  const handlePhotoDrop = async (e: React.DragEvent, targetIndex: number) => {
    if (draggedPhotoIndex === null || draggedPhotoIndex === targetIndex) return

    const reordered = [...uploadedPhotos]
    const [moved] = reordered.splice(draggedPhotoIndex, 1)
    reordered.splice(targetIndex, 0, moved)

    const withNewOrders = reordered.map((photo, idx) => ({ ...photo, order: idx }))
    setUploadedPhotos(withNewOrders)
    setDraggedPhotoIndex(null)

    // Save order in DB
    try {
      await Promise.all(
        withNewOrders.map((photo) =>
          fetch(`/api/listings/media/${photo.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: photo.order }),
          })
        )
      )
    } catch (err) {
      console.error('Failed to save media order changes', err)
    }
  }

  // Step 5: Video Capture & Upload
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !draftId) return

    setVideoUploadProgress(5)
    setVideoError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('listingId', draftId)

    try {
      const responseData = await uploadWithProgress(
        '/api/upload/video',
        formData,
        (progress) => setVideoUploadProgress(progress)
      )
      setUploadedVideo(responseData.media)
    } catch (err: any) {
      setVideoError(err.message || 'Video upload failed')
    } finally {
      setVideoUploadProgress(null)
    }
  }

  const handleDeleteVideo = async () => {
    if (!uploadedVideo) return
    const match = uploadedVideo.originalUrl.match(/\/v\d+\/([^\s]+)\.[a-z0-9]+$/i)
    const publicId = match ? match[1] : null

    if (!publicId) return

    try {
      setUploadedVideo(null)
      await fetch(`/api/upload/${publicId}`, { method: 'DELETE' })
    } catch (err) {
      console.error('Failed to delete video', err)
    }
  }

  // Webcam Recording controls (MediaRecorder API)
  const startWebcam = async () => {
    setVideoError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      })
      setWebcamStream(stream)
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = stream
      }
      setIsRecordingMode(true)
    } catch (err) {
      setVideoError('Camera access denied. Please allow permissions.')
    }
  }

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach((track) => track.stop())
      setWebcamStream(null)
    }
    setIsRecordingMode(false)
    setIsRecording(false)
    setRecordingSeconds(0)
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
  }

  const startRecording = () => {
    if (!webcamStream) return
    recordedChunksRef.current = []
    
    // Choose support mimeType
    let options = { mimeType: 'video/webm;codecs=vp9,opus' }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm;codecs=vp8,opus' }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm' }
      }
    }

    try {
      const recorder = new MediaRecorder(webcamStream, options)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/mp4' })
        setRecordedVideoBlob(blob)
      }

      recorder.start(10) // slice chunks of 10ms
      setIsRecording(true)

      // Start timer countdown limit 60s
      setRecordingSeconds(0)
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 60) {
            handleStopRecording()
            return 60
          }
          return prev + 1
        })
      }, 1000)
    } catch (e) {
      setVideoError('Failed to initialize webcam recorder.')
    }
  }

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
    }
  }

  const handleUploadRecordedVideo = async () => {
    if (!recordedVideoBlob || !draftId) return

    setVideoUploadProgress(5)
    setVideoError(null)

    const file = new File([recordedVideoBlob], 'webcam-record.mp4', { type: 'video/mp4' })
    const formData = new FormData()
    formData.append('file', file)
    formData.append('listingId', draftId)

    try {
      const responseData = await uploadWithProgress(
        '/api/upload/video',
        formData,
        (progress) => setVideoUploadProgress(progress)
      )
      setUploadedVideo(responseData.media)
      stopWebcam()
      setRecordedVideoBlob(null)
    } catch (err: any) {
      setVideoError(err.message || 'Recorded video upload failed')
    } finally {
      setVideoUploadProgress(null)
    }
  }

  const handleNext = () => {
    if (currentStep < 5) {
      saveDraftProgress(currentStep + 1)
    } else {
      saveDraftProgress() // Steps 4-5 done, redirects to dashboard
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Amenities checklist toggle
  const toggleAmenity = (id: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const isStepValid = () => {
    if (currentStep === 1) return !!selectedSpaceType
    if (currentStep === 2) return title.trim().length >= 5 && squareFeet !== '' && parseFloat(squareFeet) > 0
    if (currentStep === 3) return address.trim() !== '' && city.trim() !== '' && state.trim() !== '' && zipCode.trim() !== ''
    if (currentStep === 4) return uploadedPhotos.length >= 3 // Min 3 photos
    if (currentStep === 5) return true // Optional video step
    return false
  }

  // Timer format helper
  const formatTimer = (secs: number) => {
    const min = Math.floor(secs / 60)
    const sec = secs % 60
    return `${min}:${sec < 10 ? '0' : ''}${sec}`
  }

  if (status === 'loading' || loadingDraft) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      {/* Top Progress bar */}
      <header className="bg-white border-b border-slate-100 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-sm">Step {currentStep} of 7</span>
            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-600 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 7) * 100}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => saveDraftProgress()}
            disabled={savingDraft}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-900 font-semibold text-xs border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {savingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
            Save & Exit
          </button>
        </div>
      </header>

      {/* Steps Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10 md:py-16">
        <AnimatePresence mode="wait">
          {/* STEP 1: Space Type */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="space-y-3">
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  What type of medical space are you listing?
                </h2>
                <p className="text-slate-500 text-sm">
                  Select the category that best represents your clinical infrastructure.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {SPACE_TYPES.map((type) => {
                  const IconComponent = type.icon
                  const isSelected = selectedSpaceType === type.id

                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedSpaceType(type.id)}
                      className={`text-left p-5 rounded-2xl border-2 transition-all flex flex-col justify-between h-40 hover:shadow-md ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-teal-600 text-white' : 'bg-slate-50 text-slate-500'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{type.label}</h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-snug">{type.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 2: Space Details */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  Tell us more about your space
                </h2>
                <p className="text-slate-500 text-sm">
                  Give medical professionals an overview of the room layout and available amenities.
                </p>
              </div>

              <div className="space-y-6">
                {/* Title Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Listing Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Premium Dental Chair in Modern Clinic"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent text-sm transition-all"
                  />
                  <p className="text-[10px] text-slate-400">At least 5 characters. Keep it clear and descriptive.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Square Footage Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Square Footage (sq. ft.)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 150"
                      value={squareFeet}
                      onChange={(e) => setSquareFeet(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent text-sm transition-all"
                    />
                  </div>

                  {/* Bed/Room Counter */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Rooms / Beds Count</label>
                    <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 w-36 py-1.5 px-3 rounded-xl justify-between">
                      <button
                        type="button"
                        onClick={() => setRooms(Math.max(1, rooms - 1))}
                        className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                      <span className="font-extrabold text-slate-800 text-sm">{rooms}</span>
                      <button
                        type="button"
                        onClick={() => setRooms(rooms + 1)}
                        className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Amenities checklist */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Space Amenities</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {AMENITIES_LIST.map((amenity) => {
                      const checked = selectedAmenities.includes(amenity.id)

                      return (
                        <button
                          key={amenity.id}
                          type="button"
                          onClick={() => toggleAmenity(amenity.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                            checked
                              ? 'border-teal-500 bg-teal-50/15 text-teal-800'
                              : 'border-slate-200 hover:border-slate-300 text-slate-600'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                              checked ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 bg-white'
                            }`}
                          >
                            {checked && <Check className="w-3 h-3" />}
                          </div>
                          <span>{amenity.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Location */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  Where is your space located?
                </h2>
                <p className="text-slate-500 text-sm">
                  Search or click on the map to pin the clinic location.
                </p>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={autocompleteInputRef}
                  type="text"
                  placeholder={mapsLoaded ? "Search clinic address..." : "Search simulation (Maps offline)..."}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent text-sm shadow-sm"
                />
              </div>

              <div
                ref={mapRef}
                className="w-full h-64 rounded-2xl border border-slate-200 bg-slate-100 overflow-hidden relative flex items-center justify-center text-slate-400 shadow-sm"
              >
                {!mapsLoaded && (
                  <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center border border-teal-100 text-teal-600">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-slate-800 font-bold text-xs">Simulated Coordinates Enabled</p>
                      <p className="text-[10px] text-slate-400 max-w-xs mt-1">
                        Please type address details below. Pin coordinates will auto-calculate on draft save.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Street Address</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-1 focus:ring-teal-600 focus:border-transparent text-xs"
                    placeholder="e.g. 101 Medical Center Pkwy"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-1 focus:ring-teal-600 focus:border-transparent text-xs"
                    placeholder="e.g. Orlando"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">State / Province</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-1 focus:ring-teal-600 focus:border-transparent text-xs"
                    placeholder="e.g. FL"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Zip / PIN Code</label>
                  <input
                    type="text"
                    required
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-1 focus:ring-teal-600 focus:border-transparent text-xs"
                    placeholder="e.g. 32801"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Country</label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-1 focus:ring-teal-600 focus:border-transparent text-xs"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Photo Gallery */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  Add photos of your medical space
                </h2>
                <p className="text-slate-500 text-sm">
                  Upload at least 3 photos (max 20). Drag cards to reorder. Cover photo is shown first.
                </p>
              </div>

              {/* Upload Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
                  isDragActive
                    ? 'border-teal-500 bg-teal-50/10'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input {...getInputProps()} />
                <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Drag & drop files here, or click to upload</p>
                  <p className="text-xs text-slate-400 mt-1">Supports JPG, PNG, or WebP. Max 10MB per image.</p>
                </div>
              </div>

              {/* Upload Failure Alerts */}
              {Object.keys(photoErrors).length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-2 text-xs text-red-800">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    Failed uploads:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    {Object.entries(photoErrors).map(([name, err]) => (
                      <li key={name}>
                        <span className="font-bold">{name}</span>: {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Photos Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {uploadedPhotos.map((photo, index) => {
                  const isUploading = photo.status === 'uploading'
                  const progressPct = photoUploadProgress[photo.name] || 0
                  const isCover = index === 0

                  return (
                    <div
                      key={photo.id}
                      draggable={!isUploading}
                      onDragStart={() => handlePhotoDragStart(index)}
                      onDragOver={(e) => handlePhotoDragOver(e, index)}
                      onDrop={(e) => handlePhotoDrop(e, index)}
                      className={`relative aspect-[4/3] rounded-2xl border overflow-hidden bg-slate-100 shadow-sm flex flex-col justify-between group transition-all ${
                        isUploading ? 'opacity-80 border-slate-200' : 'border-slate-200 hover:border-slate-300 hover:shadow-md cursor-grab active:cursor-grabbing'
                      }`}
                    >
                      {/* Photo Thumbnail */}
                      <img src={photo.originalUrl} alt={`Space ${index + 1}`} className="absolute inset-0 w-full h-full object-cover" />

                      {/* Cover Photo Badge */}
                      {isCover && (
                        <span className="absolute top-3 left-3 bg-teal-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-full shadow z-10">
                          Cover Photo
                        </span>
                      )}

                      {/* Delete Button */}
                      {!isUploading && (
                        <button
                          onClick={() => handleDeletePhoto(photo.id, photo.originalUrl)}
                          className="absolute top-3 right-3 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 w-7 h-7 rounded-full shadow border border-slate-100 flex items-center justify-center z-10 transition-colors"
                          title="Delete Photo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}

                      {/* Loading/Progress Overlay */}
                      {isUploading && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 space-y-2 z-10">
                          <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
                          <span className="text-[10px] font-bold text-slate-500">Compressing & Uploading</span>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-teal-600 h-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
                          </div>
                        </div>
                      )}

                      {/* Caption text block */}
                      {!isUploading && (
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent z-10 opacity-90 group-hover:opacity-100 transition-opacity">
                          <input
                            type="text"
                            placeholder="Add photo caption..."
                            defaultValue={photo.caption || ''}
                            onBlur={(e) => handleUpdateCaption(photo.id, e.target.value)}
                            className="w-full bg-black/40 hover:bg-black/60 focus:bg-white text-white focus:text-slate-800 placeholder-slate-300 focus:placeholder-slate-400 text-[10px] font-semibold px-2 py-1 rounded border border-transparent focus:border-slate-300 focus:outline-none transition-all"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 5: Video Uploader */}
          {currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    Add a video tour <span className="text-slate-400 font-normal text-lg">(Optional)</span>
                  </h2>
                  <button
                    onClick={() => saveDraftProgress(currentStep + 1)}
                    className="text-xs font-semibold text-slate-500 hover:text-teal-600"
                  >
                    Skip step
                  </button>
                </div>
                <p className="text-slate-500 text-sm">
                  Upload a walk-through video or record a short tour using your device camera.
                </p>
              </div>

              {videoError && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-2xl">
                  {videoError}
                </div>
              )}

              {/* Video Player Display if uploaded */}
              {uploadedVideo ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm max-w-xl mx-auto">
                  <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-slate-900 border border-slate-100 shadow">
                    <video src={uploadedVideo.secureUrl} controls className="w-full h-full object-contain" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-teal-600" />
                        Video Tour Uploaded
                      </p>
                      <p className="text-slate-400 text-[10px] mt-0.5">Delivery compressed via Cloudinary</p>
                    </div>
                    <button
                      onClick={handleDeleteVideo}
                      className="bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 border border-red-200 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Video
                    </button>
                  </div>
                </div>
              ) : isRecordingMode ? (
                /* Webcam recording container */
                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 max-w-xl mx-auto shadow-sm">
                  <div className="aspect-[16/9] rounded-2xl bg-slate-900 overflow-hidden border border-slate-800 shadow relative">
                    {/* Recording flashing light */}
                    {isRecording && (
                      <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-red-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-full shadow animate-pulse">
                        <div className="w-2 h-2 bg-white rounded-full" />
                        REC {formatTimer(recordingSeconds)}
                      </div>
                    )}
                    
                    {/* Live webcam video feed */}
                    <video ref={webcamVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  </div>

                  <div className="flex justify-between items-center flex-wrap gap-3">
                    <button
                      onClick={stopWebcam}
                      disabled={isRecording}
                      className="text-xs text-slate-500 hover:text-slate-800 font-bold px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all disabled:opacity-50"
                    >
                      Cancel Webcam
                    </button>

                    <div className="flex items-center gap-2">
                      {!isRecording && !recordedVideoBlob && (
                        <button
                          onClick={startRecording}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-red-600/10 flex items-center gap-1.5 active:scale-95 transition-all"
                        >
                          <Video className="w-4 h-4" />
                          Start Recording
                        </button>
                      )}

                      {isRecording && (
                        <button
                          onClick={handleStopRecording}
                          className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5 active:scale-95 transition-all"
                        >
                          <VideoOff className="w-4 h-4" />
                          Stop Recording
                        </button>
                      )}

                      {recordedVideoBlob && !isRecording && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={startRecording}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 flex items-center gap-1.5 transition-all"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Retake
                          </button>
                          
                          <button
                            onClick={handleUploadRecordedVideo}
                            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-teal-600/15 flex items-center gap-1.5 transition-all"
                          >
                            <UploadCloud className="w-4 h-4" />
                            Upload Recording
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Choose Upload Type buttons */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  {/* File Upload Zone */}
                  <label className="bg-white rounded-3xl border border-slate-200 hover:border-teal-500 shadow-sm p-8 text-center flex flex-col items-center justify-center cursor-pointer transition-all hover:shadow-md h-56 space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Upload Video File</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        MP4, MOV formats. Max file size: 500MB.
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Browser Webcam capture Zone */}
                  <button
                    onClick={startWebcam}
                    className="bg-white rounded-3xl border border-slate-200 hover:border-teal-500 shadow-sm p-8 text-center flex flex-col items-center justify-center cursor-pointer transition-all hover:shadow-md h-56 space-y-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Record Tour Live</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Use device camera to record a video directly.
                      </p>
                    </div>
                  </button>
                </div>
              )}

              {/* Video upload progress bar */}
              {videoUploadProgress !== null && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center max-w-md mx-auto space-y-3 shadow-sm">
                  <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Uploading Video Tour</p>
                    <p className="text-slate-400 text-xs mt-1">Please do not close this tab during upload.</p>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-teal-600 h-full transition-all duration-300" style={{ width: `${videoUploadProgress}%` }} />
                  </div>
                  <span className="text-xs text-teal-600 font-bold">{videoUploadProgress}% Completed</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Navigation Bar */}
      <footer className="border-t border-slate-100 bg-white py-4 px-6 sticky bottom-0 z-45">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1 || savingDraft}
            className={`flex items-center gap-1.5 text-sm font-semibold transition-all ${
              currentStep === 1 || savingDraft
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={!isStepValid() || savingDraft || videoUploadProgress !== null}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-3 rounded-xl text-sm flex items-center gap-1.5 shadow-lg shadow-teal-600/10 active:scale-97 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {savingDraft ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Autosaving...
              </>
            ) : currentStep === 5 ? (
              <>
                Save & Finish Steps 1-5
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  )
}
