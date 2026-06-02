import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request, { params }: { params: { listingId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const listing = await prisma.listing.findUnique({
      where: { id: params.listingId },
      select: { userId: true, viewCount: true, savedCount: true },
    })

    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Check ownership or admin
    if (listing.userId !== session.user.id && !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const totalEnquiries = await prisma.enquiry.count({
      where: { listingId: params.listingId },
    })

    return NextResponse.json({
      totalViews: listing.viewCount,
      totalSaved: listing.savedCount,
      totalEnquiries,
    })
  } catch (error) {
    console.error('Failed to get analytics overview', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
