import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { PlusCircle, Building, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentListings.map((listing) => {
              const image = listing.media?.[0]?.originalUrl || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800'
              return (
                <div key={listing.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col">
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    <img src={image} alt={listing.title || 'Listing'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-4 left-4">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm backdrop-blur-md ${
                        listing.status === 'PUBLISHED' ? 'bg-emerald-500/90 text-white' :
                        listing.status === 'PENDING' ? 'bg-amber-500/90 text-white' :
                        'bg-slate-900/70 text-white'
                      }`}>
                        {listing.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-slate-900 text-lg mb-1 line-clamp-1">{listing.title || 'Untitled Space'}</h3>
                    <p className="text-sm text-slate-500 mb-4">{listing.city}, {listing.state}</p>
                    
                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex gap-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Views</span>
                          <span className="text-sm font-semibold text-slate-700">{listing.viewCount}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saved</span>
                          <span className="text-sm font-semibold text-slate-700">{listing.savedCount}</span>
                        </div>
                      </div>
                      <Link 
                        href={`/dashboard/owner/listings/${listing.id}/edit`}
                        className="text-teal-600 hover:bg-teal-50 font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
