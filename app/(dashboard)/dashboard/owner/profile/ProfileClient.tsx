'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, Phone, FileText, BadgeCheck, Loader2, Edit3, X, Check } from 'lucide-react'

type UserData = {
  id: string
  name: string | null
  email: string
  phone: string | null
  bio: string | null
  mciNumber: string | null
  image: string | null
  verificationStatus: string
  role: string
  userSubType: string | null
}

export default function ProfileClient({ user }: { user: UserData }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: user.name || '',
    phone: user.phone || '',
    bio: user.bio || '',
    mciNumber: user.mciNumber || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setIsEditing(false)
        router.refresh()
      } else {
        alert('Failed to update profile')
      }
    } catch (err) {
      alert('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header Cover Area */}
      <div className="h-32 bg-slate-900 relative">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
        >
          {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <div className="px-8 pb-8">
        {/* Avatar */}
        <div className="relative -mt-16 mb-8 flex justify-between items-end">
          <div className="w-32 h-32 bg-white rounded-2xl p-2 shadow-lg">
            <div className="w-full h-full rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center">
              {user.image ? (
                <img src={user.image} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-slate-300" />
              )}
            </div>
          </div>
          {!isEditing && (
            <div className="mb-2 flex gap-2">
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-50 text-teal-700">
                {user.role === 'OWNER' ? 'Lister' : 'Seeker'}
              </span>
              {user.userSubType && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 capitalize">
                  {user.userSubType.replace('_', ' ')}
                </span>
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                  placeholder="e.g. Dr. Jane Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-700">Professional Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-none"
                  placeholder="Tell potential renters about your practice..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <User className="w-4 h-4" /> Full Name
                </div>
                <p className="text-lg font-bold text-slate-900">{user.name || 'Not provided'}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <Mail className="w-4 h-4" /> Email Address
                </div>
                <p className="text-lg font-bold text-slate-900">{user.email}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <Phone className="w-4 h-4" /> Phone Number
                </div>
                <p className="text-lg font-bold text-slate-900">{user.phone || 'Not provided'}</p>
              </div>

            </div>

            <div className="pt-8 border-t border-slate-100">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                <FileText className="w-4 h-4" /> Professional Bio
              </div>
              <p className="text-slate-700 leading-relaxed max-w-3xl whitespace-pre-line">
                {user.bio || 'You haven\'t added a bio yet. Click Edit Profile to add one.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
