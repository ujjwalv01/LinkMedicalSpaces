// Shared TypeScript types for LinkMedicalSpaces

export type UserRole = 'ADMIN' | 'PROVIDER' | 'SEEKER'

export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'PENDING_REVIEW'
export type ListingType = 'LEASE' | 'SUBLET' | 'SHARED' | 'HOURLY'
export type SpaceType =
  | 'EXAM_ROOM'
  | 'SURGICAL_SUITE'
  | 'IMAGING_CENTER'
  | 'DENTAL_OFFICE'
  | 'THERAPY_ROOM'
  | 'LAB'
  | 'FULL_OFFICE'
  | 'MEDICAL_SPA'
  | 'URGENT_CARE'
  | 'OTHER'

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'REJECTED'
export type SubscriptionPlan = 'FREE' | 'BASIC' | 'PRO'
export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'TRIALING'

// ─── Display Labels ──────────────────────────────────────────────────────────

export const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  EXAM_ROOM: 'Exam Room',
  SURGICAL_SUITE: 'Surgical Suite',
  IMAGING_CENTER: 'Imaging Center',
  DENTAL_OFFICE: 'Dental Office',
  THERAPY_ROOM: 'Therapy Room',
  LAB: 'Laboratory',
  FULL_OFFICE: 'Full Medical Office',
  MEDICAL_SPA: 'Medical Spa',
  URGENT_CARE: 'Urgent Care',
  OTHER: 'Other',
}

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  LEASE: 'For Lease',
  SUBLET: 'Sublet',
  SHARED: 'Shared Space',
  HOURLY: 'Hourly',
}

// ─── Common Amenities ────────────────────────────────────────────────────────

export const AMENITIES_LIST = [
  'HIPAA Compliant',
  'Electronic Health Records',
  'X-Ray Equipment',
  'Lab Services',
  'Waiting Room',
  'Reception Desk',
  'Private Parking',
  'ADA Accessible',
  'High-Speed WiFi',
  'Video Conferencing',
  'Break Room',
  'Storage Space',
  'Medical Waste Disposal',
  'Security System',
  'Air Filtration System',
  'Exam Tables Included',
  'Sterilization Equipment',
  '24/7 Access',
  'Cleaning Services',
  'Billing Support',
] as const

// ─── Medical Specialties ─────────────────────────────────────────────────────

export const MEDICAL_SPECIALTIES = [
  'All Specialties',
  'Internal Medicine',
  'Family Medicine',
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'Neurology',
  'Oncology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Pulmonology',
  'Radiology',
  'Rheumatology',
  'Urology',
  'OB/GYN',
  'Ophthalmology',
  'ENT',
  'Physical Therapy',
  'Occupational Therapy',
  'Dentistry',
  'Orthodontics',
  'Chiropractic',
  'Aesthetics',
  'Urgent Care',
] as const

// ─── Search Filters ──────────────────────────────────────────────────────────

export interface SearchFilters {
  query?: string
  city?: string
  state?: string
  spaceType?: SpaceType
  listingType?: ListingType
  minPrice?: number
  maxPrice?: number
  minSqFt?: number
  specialty?: string
  amenities?: string[]
  page?: number
  limit?: number
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular'
}

// ─── Listing with relations ───────────────────────────────────────────────────

export interface ListingWithDetails {
  id: string
  slug: string
  title: string
  description: string
  spaceType: SpaceType
  listingType: ListingType
  status: ListingStatus
  address: string
  city: string
  state: string
  zipCode: string
  latitude?: number | null
  longitude?: number | null
  pricePerMonth?: number | null
  pricePerHour?: number | null
  pricePerDay?: number | null
  squareFeet?: number | null
  amenities: string[]
  specialties: string[]
  viewCount: number
  createdAt: Date
  images: {
    id: string
    url: string
    alt?: string | null
    isPrimary: boolean
    order: number
  }[]
  owner: {
    id: string
    name?: string | null
    image?: string | null
    specialty?: string | null
    isVerified: boolean
  }
  reviews: {
    id: string
    rating: number
  }[]
  _count?: {
    favorites: number
    reviews: number
  }
}

// ─── NextAuth session extension ───────────────────────────────────────────────

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
    }
  }

  interface User {
    role: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
  }
}
