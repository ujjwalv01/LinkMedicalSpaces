import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AnalyticsGlobalClient from './AnalyticsGlobalClient'

export default async function OwnerGlobalAnalyticsPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  if (!userId) redirect('/signin')

  // Fetch all listings for this user (excluding drafts)
  const listings = await prisma.listing.findMany({
    where: { 
      userId,
      status: { not: 'DRAFT' }
    },
    select: {
      id: true,
      title: true,
      viewCount: true,
      savedCount: true,
      status: true,
      views: {
        select: { viewedAt: true }
      },
      enquiries: {
        select: { createdAt: true }
      }
    }
  })

  // Calculate totals
  let totalViews = 0
  let totalSaved = 0
  let totalEnquiries = 0
  
  // Prepare time-series data for the last 30 days
  const now = new Date()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(now.getDate() - 30)

  const enquiriesByDate: Record<string, number> = {}

  // Initialize all dates with 0
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(now.getDate() - i)
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    enquiriesByDate[dateStr] = 0
  }

  const listingsData = listings.map(l => {
    totalViews += l.viewCount
    totalSaved += l.savedCount
    totalEnquiries += l.enquiries.length

    // Process enquiries for time-series chart
    l.enquiries.forEach(eq => {
      if (eq.createdAt >= thirtyDaysAgo) {
        const dateStr = eq.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        if (enquiriesByDate[dateStr] !== undefined) {
          enquiriesByDate[dateStr]++
        }
      }
    })

    return {
      id: l.id,
      title: l.title || 'Untitled Space',
      status: l.status,
      views: l.viewCount,
      saves: l.savedCount,
      enquiries: l.enquiries.length
    }
  })

  const enquiriesData = Object.entries(enquiriesByDate).map(([date, count]) => ({ date, count }))

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Global Analytics
        </h1>
        <p className="text-slate-500 mt-1">Track the performance of all your clinic spaces in one place.</p>
      </div>

      <AnalyticsGlobalClient 
        overview={{ totalViews, totalSaved, totalEnquiries }}
        enquiriesData={enquiriesData}
        listings={listingsData}
      />
    </div>
  )
}
