import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { PlusCircle, Building, MapPin, Eye, Bookmark, ExternalLink } from 'lucide-react'

export default async function OwnerListingsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  if (!userId) return null

  const statusParam = searchParams.status as string | undefined
  const whereClause: any = { userId }
  
  if (statusParam === 'PUBLISHED' || statusParam === 'DRAFT') {
    whereClause.status = statusParam
  }

  const listings = await prisma.listing.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      media: {
        orderBy: { order: 'asc' },
        take: 1
      }
    }
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            My Clinic Spaces
          </h1>
          <p className="text-slate-500 mt-1">Manage your medical listings and check their performance.</p>
        </div>
        <Link
          href="/add-listing"
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-teal-600/20 active:scale-95 transition-all text-sm self-start sm:self-auto flex items-center gap-2"
        >
          <PlusCircle className="w-5 h-5" />
          Add New Listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-sm mt-12">
          <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto text-teal-600 mb-6">
            <Building className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">No listings yet</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-8">
            You haven't added any clinical spaces. Click below to list your first space.
          </p>
          <Link
            href="/add-listing"
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-teal-600/20 active:scale-95 transition-all text-sm inline-block"
          >
            Add Your First Listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {listings.map((listing) => {
            const image = listing.media?.[0]?.originalUrl || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800'
            const availabilityHours = listing.availabilityHours as any || {}
            const region = availabilityHours.region === 'other' ? 'Non-Orlando' : 'Orlando'
            
            let displayPrice = ''
            if (listing.pricePerMonth) displayPrice = `$${listing.pricePerMonth}/mo`
            else if (listing.pricePerDay) displayPrice = `$${listing.pricePerDay}/day`
            else if (listing.pricePerHour) displayPrice = `$${listing.pricePerHour}/hr`
            else displayPrice = 'Contact Price'

            return (
              <div key={listing.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col">
                <div className="relative h-56 overflow-hidden bg-slate-100 block">
                  <img src={image} alt={listing.title || 'Listing'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 left-4">
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm backdrop-blur-md ${
                      listing.status === 'PUBLISHED' ? 'bg-emerald-500/90 text-white' :
                      listing.status === 'PENDING' ? 'bg-amber-500/90 text-white' :
                      listing.status === 'REJECTED' ? 'bg-red-500/90 text-white' :
                      'bg-slate-900/70 text-white'
                    }`}>
                      {listing.status}
                    </span>
                  </div>

                  {/* Region Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm backdrop-blur-md bg-white/90 text-slate-800">
                      {region}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-slate-900 text-lg mb-1 line-clamp-1">{listing.title || 'Untitled Space'}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mb-4">
                    <MapPin className="w-3.5 h-3.5" />
                    {listing.city || 'Unknown'}, {listing.state || 'Unknown'}
                  </p>
                  
                  <div className="flex items-center gap-6 mb-6">
                    <p className="font-extrabold text-teal-700">{displayPrice}</p>
                    <div className="flex gap-4 ml-auto text-slate-500">
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <Eye className="w-4 h-4" />
                        {listing.viewCount}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <Bookmark className="w-4 h-4" />
                        {listing.savedCount}
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-3">
                    <Link
                      href={`/dashboard/owner/listings/${listing.id}/edit`}
                      className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold px-4 py-2.5 rounded-xl text-sm text-center transition-colors"
                    >
                      Edit Listing
                    </Link>
                    <Link
                      href={listing.status === 'PUBLISHED' ? `/property/${listing.slug}` : `/dashboard/owner/listings/${listing.id}/edit`}
                      target={listing.status === 'PUBLISHED' ? '_blank' : '_self'}
                      className="bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 font-bold px-4 py-2.5 rounded-xl text-sm text-center transition-colors flex items-center justify-center gap-1.5"
                    >
                      View Live
                      {listing.status === 'PUBLISHED' && <ExternalLink className="w-3.5 h-3.5" />}
                    </Link>
                  </div>

                  <div className="mt-3">
                    <Link
                      href={`/dashboard/owner/listings/${listing.id}/info`}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold px-4 py-2.5 rounded-xl text-sm text-center transition-colors w-full flex items-center justify-center gap-1.5"
                    >
                      Analytics & Enquiries
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
