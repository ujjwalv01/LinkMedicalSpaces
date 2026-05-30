'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import {  useEffect, useState, useCallback , Suspense } from 'react'
import { motion } from 'framer-motion'
import {
  User as UserIcon,
  LogOut,
  Building,
  Plus,
  Calendar,
  CreditCard,
  Settings,
  ShieldAlert,
  Loader2,
  Trash2,
  Edit,
  Camera,
  MapPin,
  CheckCircle,
  Clock,
  ExternalLink,
  Stethoscope
} from 'lucide-react'
import ListingCard from '@/components/listings/ListingCard'

type TabType = 'listings' | 'bookings' | 'profile' | 'subscription'

function DashboardPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<TabType>('listings')
  
  // Data States
  const [listings, setListings] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [loadingListings, setLoadingListings] = useState(false)
  const [loadingBookings, setLoadingBookings] = useState(false)

  // Profile Edit States
  const [profileName, setProfileName] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [profileBio, setProfileBio] = useState('')
  const [profileImage, setProfileImage] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)

  // Listing Edit Modal States
  const [editingListing, setEditingListing] = useState<any | null>(null)
  const [updatingListing, setUpdatingListing] = useState(false)

  // Global Errors
  const [error, setError] = useState<string | null>(null)

  // Verify Auth and Onboarding status
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin')
    } else if (status === 'authenticated' && session?.user) {
      const isOnboarded = (session.user as any).onboarded
      if (isOnboarded === false) {
        router.push('/onboarding')
      }

      // Sync form fields with session data
      setProfileName(session.user.name || '')
      setProfilePhone((session.user as any).phone || '')
      setProfileBio((session.user as any).bio || '')
      setProfileImage(session.user.image || '')
    }
  }, [status, session, router])

  // Sync active tab with search parameter if present
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['listings', 'bookings', 'profile', 'subscription'].includes(tabParam)) {
      setActiveTab(tabParam as TabType)
    }
  }, [searchParams])

  // Fetch user listings
  const fetchListings = useCallback(async () => {
    if (!session?.user?.id) return
    setLoadingListings(true)
    try {
      const res = await fetch('/api/listings?my=true')
      const data = await res.json()
      if (res.ok && data.listings) {
        setListings(data.listings)
      }
    } catch (err) {
      console.error('Failed to load listings', err)
    } finally {
      setLoadingListings(false)
    }
  }, [session])

  // Fetch user bookings
  const fetchBookings = useCallback(async () => {
    if (!session?.user?.id) return
    setLoadingBookings(true)
    try {
      const res = await fetch('/api/bookings')
      const data = await res.json()
      if (res.ok) {
        setBookings(data)
      }
    } catch (err) {
      console.error('Failed to load bookings', err)
    } finally {
      setLoadingBookings(false)
    }
  }, [session])

  // Fetch data on tab change
  useEffect(() => {
    if (status === 'authenticated') {
      if (activeTab === 'listings') {
        fetchListings()
      } else if (activeTab === 'bookings') {
        fetchBookings()
      }
    }
  }, [activeTab, status, fetchListings, fetchBookings])

  // Handle Listing Deletion
  const handleDeleteListing = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) return
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setListings((prev) => prev.filter((item) => item.id !== id))
      } else {
        const errData = await res.json()
        alert(errData.error || 'Failed to delete listing')
      }
    } catch (err) {
      alert('Failed to delete listing')
    }
  }

  // Handle Listing Edit Submission
  const handleUpdateListing = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingListing) return
    setUpdatingListing(true)
    try {
      const res = await fetch(`/api/listings/${editingListing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingListing.title,
          description: editingListing.description,
          pricePerMonth: editingListing.pricePerMonth ? parseFloat(editingListing.pricePerMonth) : null,
          pricePerDay: editingListing.pricePerDay ? parseFloat(editingListing.pricePerDay) : null,
          pricePerHour: editingListing.pricePerHour ? parseFloat(editingListing.pricePerHour) : null,
        }),
      })

      if (res.ok) {
        setEditingListing(null)
        fetchListings()
      } else {
        const errData = await res.json()
        alert(errData.error || 'Failed to update listing')
      }
    } catch (err) {
      alert('Failed to update listing')
    } finally {
      setUpdatingListing(false)
    }
  }

  // Handle Avatar Image Upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      setProfileImage(data.upload.secureUrl)
    } catch (err: any) {
      setError(err.message || 'Avatar upload failed')
    } finally {
      setUploadingAvatar(false)
    }
  }

  // Handle Profile Form Submission
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    setError(null)
    setProfileSuccess(false)

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone,
          bio: profileBio,
          image: profileImage,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update profile')

      // Refresh NextAuth Session
      await update({
        ...session,
        user: {
          ...session?.user,
          name: profileName,
          image: profileImage,
          phone: profilePhone,
          bio: profileBio,
        },
      })

      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save profile changes')
    } finally {
      setSavingProfile(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
      </div>
    )
  }

  if (!session?.user) return null

  const user = session.user
  const role = user.role || 'SEEKER'
  const isOwner = role === 'OWNER' || role === 'ADMIN' || role === 'SUPER_ADMIN'
  const subscriptionStatus = (user as any).subscriptionStatus || 'INACTIVE'
  const isSubscribed = subscriptionStatus === 'ACTIVE'
  const expiryDate = (user as any).subscriptionExpiry
    ? new Date((user as any).subscriptionExpiry).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'No Active Expiry'

  // Computed listing statistics
  const totalCount = listings.length
  const publishedCount = listings.filter((l) => l.status === 'PUBLISHED').length
  const draftCount = listings.filter((l) => l.status === 'DRAFT' || l.status === 'PENDING').length

  const navigationItems = [
    { id: 'listings', label: 'My Clinic Spaces', icon: Building, show: true },
    { id: 'add-listing', label: 'Add Listing', icon: Plus, show: true, action: () => router.push('/add-listing') },
    { id: 'bookings', label: 'Bookings', icon: Calendar, show: true },
    { id: 'profile', label: 'Profile Details', icon: Settings, show: true },
    { id: 'subscription', label: 'Subscription Plan', icon: CreditCard, show: true },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 sticky top-0 h-screen justify-between p-6">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center cursor-pointer flex-shrink-0" onClick={() => router.push('/')}>
            <img 
              src="/logo-new.png" 
              alt="LinkMedicalSpaces Orlando" 
              className="h-10 w-auto object-contain"
            />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navigationItems
              .filter((item) => item.show)
              .map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id

                return (
                  <button
                    key={item.id}
                    onClick={item.action ? item.action : () => setActiveTab(item.id as TabType)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-teal-50 text-teal-700 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {item.label}
                  </button>
                )
              })}
          </nav>
        </div>

        {/* Bottom Actions - Logout */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
              {profileImage ? (
                <img src={profileImage} alt={profileName} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 line-clamp-1">{profileName || 'Professional'}</p>
              <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded capitalize">
                {role.toLowerCase()}
              </span>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/signin' })}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Top Navigation & Bottom Navigation */}
      <div className="md:hidden flex flex-col w-full z-50">
        <header className="bg-white border-b border-slate-200 py-4 px-6 flex items-center justify-between sticky top-0">
          <div className="flex items-center cursor-pointer flex-shrink-0" onClick={() => router.push('/')}>
            <img 
              src="/logo-new.png" 
              alt="LinkMedicalSpaces Orlando" 
              className="h-8 w-auto object-contain"
            />
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/signin' })}
            className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        {/* Mobile Bottom Bar Nav */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-2 px-4 flex justify-around shadow-lg">
          {navigationItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id

              return (
                <button
                  key={item.id}
                  onClick={item.action ? item.action : () => setActiveTab(item.id as TabType)}
                  className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors ${
                    isActive ? 'text-teal-600 font-bold' : 'text-slate-400 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px]">{item.label.split(' ')[0]}</span>
                </button>
              )
            })}
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 space-y-8 pb-24 md:pb-10 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight capitalize">
              {activeTab === 'listings' && 'My Clinic Spaces'}
              {activeTab === 'bookings' && 'Reservations Dashboard'}
              {activeTab === 'profile' && 'Profile Details'}
              {activeTab === 'subscription' && 'Subscription Settings'}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Logged in as <span className="font-semibold text-teal-600">{user.email}</span>
            </p>
          </div>

          {activeTab === 'listings' && (
            <button
              onClick={() => router.push('/add-listing')}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-teal-600/20 active:scale-95 transition-all text-sm self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Add Listing
            </button>
          )}
        </div>

        {/* Stats Row - Displayed for Listings tab */}
        {activeTab === 'listings' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Listings</span>
              <p className="text-3xl font-extrabold text-slate-900">{totalCount}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Published</span>
              <p className="text-3xl font-extrabold text-emerald-600">{publishedCount}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Drafts/Pending</span>
              <p className="text-3xl font-extrabold text-slate-500">{draftCount}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Plan Expiry</span>
              <p className="text-sm font-extrabold text-teal-600 line-clamp-1 mt-2.5">
                {isSubscribed ? expiryDate : 'Not Subscribed'}
              </p>
            </div>
          </div>
        )}

        {/* TAB CONTENTS */}
        <div className="min-h-[400px]">
          {/* TAB: Listings */}
          {activeTab === 'listings' && (
            <div className="space-y-6">
              {loadingListings ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
                </div>
              ) : listings.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-6 shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto text-teal-600 border border-teal-100">
                    <Building className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-800">No listings yet</h3>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto">
                      List your exam rooms, clinical offices, or surgical spaces to rent or sublet.
                    </p>
                  </div>
                  <button
                    onClick={() => router.push('/add-listing')}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-teal-600/20 active:scale-95 transition-all text-sm"
                  >
                    Add Your First Listing
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {listings.map((item) => (
                    <ListingCard
                      key={item.id}
                      listing={item}
                      showActions={true}
                      onDelete={handleDeleteListing}
                      onEdit={(id) => setEditingListing(item)}
                      onContinue={(id) => router.push(`/add-listing?draftId=${id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: Bookings */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              {loadingBookings ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
                </div>
              ) : bookings.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-6 shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto text-teal-600 border border-teal-100">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-800">No bookings scheduled</h3>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto">
                      {isOwner
                        ? 'Bookings on your listings will appear here once medical professionals reserve them.'
                        : 'Explore listings and schedule an exam chair or clinical room reservation.'}
                    </p>
                  </div>
                  {!isOwner && (
                    <button
                      onClick={() => router.push('/')}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-teal-600/20 active:scale-95 transition-all text-sm"
                    >
                      Browse Spaces
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                          <th className="p-5">Space Details</th>
                          <th className="p-5">{isOwner ? 'Renter Info' : 'Owner Info'}</th>
                          <th className="p-5">Dates</th>
                          <th className="p-5">Total Price</th>
                          <th className="p-5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-600 text-sm divide-y divide-slate-100">
                        {bookings.map((booking) => {
                          const mainPhoto = booking.listing?.media?.[0]?.originalUrl || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=300'
                          const targetUser = isOwner ? booking.user : booking.listing?.user

                          return (
                            <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-5 flex items-center gap-3">
                                <img
                                  src={mainPhoto}
                                  alt={booking.listing.title}
                                  className="w-16 h-12 rounded-lg object-cover bg-slate-100 flex-shrink-0"
                                />
                                <div>
                                  <p className="font-bold text-slate-800 line-clamp-1">{booking.listing.title}</p>
                                  <p className="text-slate-400 text-xs flex items-center gap-0.5 mt-0.5">
                                    <MapPin className="w-3 h-3" />
                                    {booking.listing.city}, {booking.listing.state}
                                  </p>
                                </div>
                              </td>
                              <td className="p-5">
                                <p className="font-semibold text-slate-800">{targetUser?.name || 'N/A'}</p>
                                <p className="text-slate-400 text-xs">{targetUser?.email || ''}</p>
                                {targetUser?.phone && <p className="text-slate-400 text-[10px] mt-0.5">{targetUser.phone}</p>}
                              </td>
                              <td className="p-5">
                                <p className="font-medium text-slate-800">
                                  {new Date(booking.startDate).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                  })}{' '}
                                  -{' '}
                                  {new Date(booking.endDate).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </p>
                                <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  Active
                                </p>
                              </td>
                              <td className="p-5 font-bold text-slate-900">
                                ${booking.totalPrice.toFixed(2)}
                              </td>
                              <td className="p-5">
                                <span
                                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                                    booking.status === 'CONFIRMED'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                      : booking.status === 'PENDING'
                                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                                      : 'bg-slate-100 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  {booking.status.toLowerCase()}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: Profile */}
          {activeTab === 'profile' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm max-w-2xl">
              <form onSubmit={handleSaveProfile} className="space-y-6">
                {profileSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    Profile changes saved successfully!
                  </div>
                )}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl">
                    {error}
                  </div>
                )}

                {/* Avatar upload */}
                <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                  <div className="relative w-20 h-20 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {profileImage ? (
                      <img src={profileImage} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-8 h-8 text-slate-400" />
                    )}
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="relative cursor-pointer bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold px-4 py-2 rounded-xl text-xs border border-teal-200 flex items-center gap-1.5 transition-all">
                      <Camera className="w-3.5 h-3.5" />
                      Upload Avatar
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, or WebP. Max 10MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name field */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent text-sm transition-all"
                    />
                  </div>

                  {/* Phone field */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Phone Number</label>
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent text-sm transition-all"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                {/* Bio field */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Bio Description</label>
                  <textarea
                    rows={4}
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent text-sm transition-all resize-none"
                    placeholder="Tell others about your clinic specialties, clinical credentials, or practice."
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingProfile || uploadingAvatar}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-teal-600/20 active:scale-95 transition-all text-sm disabled:opacity-50 disabled:pointer-events-none"
                >
                  {savingProfile ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving changes...
                    </span>
                  ) : (
                    'Save Profile Details'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB: Subscription */}
          {activeTab === 'subscription' && isOwner && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm max-w-2xl space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Your Subscription</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Allows posting spaces on LinkMedicalSpaces.</p>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${
                    isSubscribed
                      ? 'bg-teal-50 text-teal-700 border-teal-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {isSubscribed ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Active Renewal
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4 animate-pulse" />
                      No Subscription
                    </>
                  )}
                </span>
              </div>

              {/* Sub status summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Billing Frequency</span>
                  <span className="font-bold text-slate-800 text-sm mt-1 block">Annual ($120.00 / year)</span>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Next Renewal Date</span>
                  <span className="font-bold text-slate-800 text-sm mt-1 block">{isSubscribed ? expiryDate : 'N/A'}</span>
                </div>
              </div>

              {/* Subscription info helper */}
              <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-2xl text-xs text-teal-800 leading-relaxed">
                Stripe subscriptions renew automatically. You can update billing details, change credit cards, or cancel renewals directly from your stripe checkout panel.
              </div>

              <div className="pt-2">
                {isSubscribed ? (
                  <button
                    onClick={() => alert('Customer billing portal integration will open here.')}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-5 py-3 rounded-xl flex items-center gap-1.5 text-xs transition-all active:scale-95"
                  >
                    Manage Billing Portal
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => router.push('/pricing')}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-teal-600/20 transition-all text-sm active:scale-95"
                  >
                    View Pricing Plans & Subscribe
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* LISTING EDIT OVERLAY MODAL */}
      {editingListing && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                <Edit className="w-5 h-5 text-teal-600" />
                Edit Space Listing
              </h3>
              <button
                onClick={() => setEditingListing(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 hover:bg-slate-50 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateListing} className="p-6 space-y-4">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Listing Title</label>
                <input
                  type="text"
                  required
                  value={editingListing.title}
                  onChange={(e) => setEditingListing({ ...editingListing, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent text-sm transition-all"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Description</label>
                <textarea
                  rows={4}
                  required
                  value={editingListing.description}
                  onChange={(e) => setEditingListing({ ...editingListing, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent text-sm transition-all resize-none"
                />
              </div>

              {/* Prices */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Price/Month ($)</label>
                  <input
                    type="number"
                    value={editingListing.pricePerMonth || ''}
                    onChange={(e) => setEditingListing({ ...editingListing, pricePerMonth: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-teal-600 focus:border-transparent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Price/Day ($)</label>
                  <input
                    type="number"
                    value={editingListing.pricePerDay || ''}
                    onChange={(e) => setEditingListing({ ...editingListing, pricePerDay: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-teal-600 focus:border-transparent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Price/Hour ($)</label>
                  <input
                    type="number"
                    value={editingListing.pricePerHour || ''}
                    onChange={(e) => setEditingListing({ ...editingListing, pricePerHour: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-teal-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingListing(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingListing}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-teal-600/10 text-xs flex items-center gap-1"
                >
                  {updatingListing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}


export default function DashboardPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <DashboardPage />
    </Suspense>
  );
}
