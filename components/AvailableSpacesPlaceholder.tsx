'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, ArrowRight, Image as ImageIcon } from 'lucide-react'

export default function AvailableSpacesPlaceholder() {
  const router = useRouter()
  const [listings, setListings] = useState<any[]>([])

  useEffect(() => {
    async function fetchListings() {
      try {
        const res = await fetch('/api/listings?limit=4')
        const data = await res.json()
        if (data.listings) {
          setListings(data.listings)
        }
      } catch (err) {
        console.error('Failed to fetch listings', err)
      }
    }
    fetchListings()
  }, [])

  // Use real listings if available, otherwise show 4 empty placeholder boxes
  const displayItems = listings.length > 0 ? listings : Array(4).fill(null)

  return (
    <section className="py-20 bg-white border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-teal-600 mb-3">
            Available Now
          </p>
          <h2 className="text-3xl sm:text-4xl font-light text-slate-800 tracking-tight">
            Explore Medical Office Spaces Near You
          </h2>
        </div>

        {/* 4 Box Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {displayItems.map((space, idx) => (
            <div 
              key={idx} 
              className={`group ${space ? 'cursor-pointer' : ''}`}
              onClick={() => space && space.slug && router.push(`/listings/${space.slug}`)}
            >
              {/* Image Placeholder Box */}
              <div className="aspect-[4/3] w-full bg-slate-100 rounded-xl mb-4 flex items-center justify-center border border-slate-200 group-hover:border-teal-300 transition-colors overflow-hidden">
                {space?.media?.[0]?.optimizedUrl ? (
                  <img src={space.media[0].optimizedUrl} alt="Space" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-10 h-10 text-slate-300" strokeWidth={1} />
                )}
              </div>
              {/* Address Text */}
              {space ? (
                <div>
                  <p className="text-sm font-semibold text-slate-600 group-hover:text-teal-600 transition-colors leading-snug">
                    {space.address || 'Address Hidden'}
                  </p>
                  {(space.city || space.state) && (
                    <p className="text-xs text-slate-400 mt-1">{space.city}, {space.state}</p>
                  )}
                </div>
              ) : (
                <div className="h-4 bg-slate-100 rounded w-3/4"></div>
              )}
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => router.push('/search-spaces')}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 rounded-lg border-2 border-slate-800 text-slate-800 font-bold text-sm hover:bg-slate-800 hover:text-white transition-all"
          >
            <span>View All Spaces</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => router.push('/list-your-space')}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 rounded-lg border-2 border-slate-800 text-slate-800 font-bold text-sm hover:bg-slate-800 hover:text-white transition-all"
          >
            <span>Post Your Requirements</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
