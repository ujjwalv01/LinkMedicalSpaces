import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { subDays, startOfDay, format } from 'date-fns'

export async function GET(req: Request, { params }: { params: { listingId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const listing = await prisma.listing.findUnique({
      where: { id: params.listingId },
      select: { userId: true },
    })

    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (listing.userId !== session.user.id && !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const thirtyDaysAgo = startOfDay(subDays(new Date(), 30))

    const views = await prisma.listingView.findMany({
      where: {
        listingId: params.listingId,
        viewedAt: { gte: thirtyDaysAgo },
      },
      select: { viewedAt: true },
    })

    // Initialize map with last 30 days
    const viewMap = new Map<string, number>()
    for (let i = 0; i <= 30; i++) {
      const d = subDays(new Date(), i)
      viewMap.set(format(d, 'MMM dd'), 0)
    }

    // Populate data
    views.forEach(v => {
      const key = format(v.viewedAt, 'MMM dd')
      if (viewMap.has(key)) {
        viewMap.set(key, viewMap.get(key)! + 1)
      }
    })

    // Format for charts (chronological order)
    const data = Array.from(viewMap.entries())
      .reverse()
      .map(([date, count]) => ({ date, count }))

    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to get views over time', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
