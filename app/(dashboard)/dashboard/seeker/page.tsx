import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { unstable_cache } from 'next/cache'
import Link from 'next/link'
import { Search } from 'lucide-react'
import SavedListingsClient from './SavedListingsClient'

export const dynamic = 'force-dynamic' // Ensure page is dynamic since we use session

async function getSavedListings(userId: string) {
  const getCachedListings = unstable_cache(
    async (id: string) => {
      const saved = await prisma.savedListing.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          createdAt: true,
          listing: {
            select: {
              id: true,
              title: true,
              slug: true,
              spaceType: true,
              pricePerHour: true,
              pricePerDay: true,
              pricePerMonth: true,
              address: true,
              city: true,
              state: true,
              media: {
                orderBy: { order: 'asc' },
                take: 3,
                select: {
                  id: true,
                  originalUrl: true,
                  optimizedUrl: true,
                  order: true,
                },
              },
            },
          },
        },
      })

      return saved.map(s => ({
        savedId: s.id,
        savedAt: s.createdAt.toISOString(),
        id: s.listing.id,
        title: s.listing.title,
        slug: s.listing.slug,
        spaceType: s.listing.spaceType,
        pricePerHour: s.listing.pricePerHour,
        pricePerDay: s.listing.pricePerDay,
        pricePerMonth: s.listing.pricePerMonth,
        address: s.listing.address,
        city: s.listing.city,
        state: s.listing.state,
        media: s.listing.media,
      }))
    },
    [`saved-listings-${userId}`],
    { tags: [`saved-listings-${userId}`], revalidate: 300 }
  )

  return getCachedListings(userId)
}

function SavedListingsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="animate-pulse flex flex-col space-y-4">
          <div className="bg-slate-100 aspect-[4/3] rounded-3xl w-full" />
          <div className="space-y-2">
            <div className="h-4 bg-slate-100 rounded w-1/4" />
            <div className="h-5 bg-slate-100 rounded w-3/4" />
            <div className="h-4 bg-slate-100 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

async function SavedListingsData({ userId }: { userId: string }) {
  const listings = await getSavedListings(userId)
  return <SavedListingsClient initialListings={listings} />
}

export default async function SeekerSavedPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/signin')
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Saved Spaces
          </h1>
          <p className="text-slate-500 mt-1">Your bookmarked medical spaces and wishlist</p>
        </div>
        <Link
          href="/search-spaces"
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-teal-600/20 active:scale-95 transition-all text-sm self-start sm:self-auto flex items-center gap-2"
        >
          <Search className="w-5 h-5" />
          Explore Spaces
        </Link>
      </div>

      <Suspense fallback={<SavedListingsSkeleton />}>
        <SavedListingsData userId={session.user.id} />
      </Suspense>
    </>
  )
}
