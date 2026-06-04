import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { PlusCircle, Building, CheckCircle2, Clock, AlertCircle, Eye, Bookmark, ExternalLink } from 'lucide-react'

export default async function OwnerDashboardHome() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  if (!userId) return null

  // Fetch stats and recent listings in parallel
  const [
    totalListings,
    publishedCount,
    draftCount,
    recentListings
  ] = await Promise.all([
    prisma.listing.count({ where: { userId } }),
    prisma.listing.count({ where: { userId, status: 'PUBLISHED' } }),
    prisma.listing.count({ where: { userId, status: 'DRAFT' } }),
    prisma.listing.findMany({
      where: { userId, status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        media: {
          orderBy: { order: 'asc' },
          take: 1
        }
      }
    })
  ])

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {session.user.name?.split(' ')[0] || 'Lister'}!
          </h1>
          <p className="text-slate-500 mt-1">Here's an overview of your spaces and performance.</p>
        </div>
        <Link
          href="/add-listing"
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-teal-600/20 active:scale-95 transition-all text-sm self-start sm:self-auto flex items-center gap-2"
        >
          <PlusCircle className="w-5 h-5" />
          Add New Listing
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <Building className="w-5 h-5 text-slate-600" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Total</span>
          </div>
          <p className="text-4xl font-extrabold text-slate-900">{totalListings}</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Published</span>
          </div>
          <p className="text-4xl font-extrabold text-emerald-600">{publishedCount}</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-slate-500" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Draft</span>
          </div>
          <p className="text-4xl font-extrabold text-slate-600">{draftCount}</p>
        </div>
      </div>

      {/* Recent Listings */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Recent Listings</h2>
          <Link href="/dashboard/owner/listings" className="text-sm font-semibold text-teal-600 hover:text-teal-700">
            View All →
          </Link>
        </div>
        
        {recentListings.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto text-teal-600 mb-6">
              <Building className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">No listings yet</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-8">
              List your exam rooms, clinical offices, or surgical spaces to start renting to medical professionals.
            </p>
            <Link
              href="/add-listing"
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-teal-600/20 active:scale-95 transition-all text-sm inline-block"
            >
              Add Your First Listing
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="hidden lg:flex items-center px-6 py-4 border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <div className="w-48 shrink-0">Photo</div>
              <div className="flex-[2] px-6">Property Info</div>
              <div className="flex-1 px-4">Added On</div>
              <div className="flex-1 px-4">Lease Type</div>
              <div className="flex-1 px-4">Status</div>
              <div className="flex-1 px-4 text-right">Price & Actions</div>
            </div>
            
            <div className="flex flex-col divide-y divide-slate-100">
              {recentListings.map((listing) => {
                const image = listing.media?.[0]?.originalUrl || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800'
                const displayPrice = listing.pricePerMonth 
                  ? `$${listing.pricePerMonth}/mo` 
                  : listing.pricePerDay 
                    ? `$${listing.pricePerDay}/day` 
                    : listing.pricePerHour 
                      ? `$${listing.pricePerHour}/hr` 
                      : 'Contact'

                return (
                  <div key={listing.id} className="flex flex-col lg:flex-row items-stretch hover:bg-slate-50 transition-colors">
                    {/* Photo */}
                    <div className="w-full lg:w-48 shrink-0 relative">
                      <Link 
                        href={listing.status === 'PUBLISHED' ? `/property/${listing.slug}` : `/dashboard/owner/listings/${listing.id}/edit`}
                        target={listing.status === 'PUBLISHED' ? "_blank" : "_self"}
                        className="block w-full h-48 lg:h-full relative overflow-hidden"
                      >
                        <img src={image} alt={listing.title || 'Listing'} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                      </Link>
                    </div>
                    
                    {/* Property Info */}
                    <div className="flex-[2] p-4 lg:p-6 flex flex-col justify-center">
                      <Link 
                        href={listing.status === 'PUBLISHED' ? `/property/${listing.slug}` : `/dashboard/owner/listings/${listing.id}/edit`}
                        target={listing.status === 'PUBLISHED' ? "_blank" : "_self"}
                        className="font-bold text-slate-900 text-[15px] mb-1 line-clamp-1 hover:text-teal-600 transition-colors"
                      >
                        {listing.title || 'Untitled Space'}
                      </Link>
                      <p className="text-sm text-slate-500 mb-3 line-clamp-1">{listing.description || `${listing.city}, ${listing.state}`}</p>
                      
                      <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{listing.examRooms || 0} Rooms</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>{listing.viewCount} Views</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                          <span>{listing.savedCount} Saves</span>
                        </div>
                      </div>
                    </div>

                    {/* Added On */}
                    <div className="flex-1 p-4 lg:p-6 flex flex-col justify-center lg:border-l border-slate-100">
                      <span className="lg:hidden text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Added On</span>
                      <span className="text-sm font-semibold text-slate-700">
                        {new Date(listing.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Lease Type */}
                    <div className="flex-1 p-4 lg:p-6 flex flex-col justify-center lg:border-l border-slate-100">
                      <span className="lg:hidden text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Lease Type</span>
                      <span className="text-sm font-semibold text-slate-700 capitalize">
                        {listing.leaseType?.toLowerCase().replace('_', ' ') || 'Sublease'}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="flex-1 p-4 lg:p-6 flex flex-col justify-center lg:border-l border-slate-100">
                      <span className="lg:hidden text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</span>
                      <div className="flex flex-col gap-2 items-start">
                        <span className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-md ${
                          listing.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' :
                          listing.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {listing.status}
                        </span>
                        {/* We could add a 'Featured' badge here if applicable later */}
                      </div>
                    </div>

                    {/* Price & Actions */}
                    <div className="flex-1 p-4 lg:p-6 flex flex-col justify-center lg:items-end lg:border-l border-slate-100 gap-2">
                      <div className="lg:hidden text-xs font-bold text-slate-400 uppercase tracking-wider mb-[-4px]">Price</div>
                      <div className="text-emerald-600 font-bold text-[15px] mb-1">
                        {displayPrice}
                      </div>
                      
                      <div className="flex flex-wrap lg:flex-col lg:items-end gap-2 mt-2">
                        <Link 
                          href={`/dashboard/owner/listings/${listing.id}/edit`}
                          className="text-[11px] font-bold text-slate-500 hover:text-teal-600 flex items-center gap-1.5 uppercase tracking-wider"
                        >
                          Edit
                        </Link>
                        {listing.status === 'PUBLISHED' && (
                          <Link 
                            href={`/property/${listing.slug}`}
                            target="_blank"
                            className="text-[11px] font-bold text-slate-500 hover:text-teal-600 flex items-center gap-1.5 uppercase tracking-wider"
                          >
                            View Live <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                        <Link 
                          href={`/dashboard/owner/listings/${listing.id}/info`}
                          className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1.5 uppercase tracking-wider"
                        >
                          Analytics
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
