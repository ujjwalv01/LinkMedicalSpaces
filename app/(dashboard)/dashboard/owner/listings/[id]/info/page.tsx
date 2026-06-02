import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, BarChart3, MessageSquare, Inbox } from 'lucide-react'
import InfoTabsClient from './InfoTabsClient'
import AnalyticsTab from './AnalyticsTab'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'

export default async function ListingInfoPage({ params }: { params: { id: string } }) {
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    select: { id: true, title: true, status: true }
  })

  if (!listing) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/owner/listings"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-teal-600 hover:border-teal-200 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            {listing.title || 'Untitled Listing'}
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
              listing.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              listing.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {listing.status}
            </span>
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Analytics, enquiries, and inbox messages for this specific space.</p>
        </div>
      </div>

      <InfoTabsClient listingId={listing.id} />
    </div>
  )
}
