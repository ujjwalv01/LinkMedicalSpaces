'use client'

import { useEffect, useState } from 'react'
import { Loader2, Mail, Phone, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function EnquiriesTab({ listingId }: { listingId: string }) {
  const [loading, setLoading] = useState(true)
  const [enquiries, setEnquiries] = useState<any[]>([])

  useEffect(() => {
    async function fetchEnquiries() {
      try {
        const res = await fetch(`/api/listings/${listingId}/enquiries`)
        if (res.ok) setEnquiries(await res.json())
      } catch (err) {
        console.error('Failed to load enquiries', err)
      } finally {
        setLoading(false)
      }
    }
    fetchEnquiries()
  }, [listingId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 bg-white rounded-3xl border border-slate-200">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading enquiries...</p>
      </div>
    )
  }

  if (enquiries.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-sm mt-8">
        <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto text-amber-600 mb-6">
          <Mail className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">No enquiries yet</h3>
        <p className="text-slate-500 text-sm">When medical professionals are interested in your space, their enquiries will appear here.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <h3 className="font-bold text-slate-800 text-lg">Enquiries List</h3>
        <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2.5 py-1 rounded-full">{enquiries.length} total</span>
      </div>
      <div className="divide-y divide-slate-100">
        {enquiries.map((enq) => {
          const lastMessage = enq.messages?.[0]?.content || 'No message content'
          return (
            <div key={enq.id} className="p-6 hover:bg-slate-50 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {enq.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{enq.name}</h4>
                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 mt-1">
                      <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {enq.email}</span>
                      {enq.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {enq.phone}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDistanceToNow(new Date(enq.createdAt), { addSuffix: true })}
                </div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 ml-12">
                <p className="text-sm text-slate-600 italic line-clamp-2">"{lastMessage}"</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
