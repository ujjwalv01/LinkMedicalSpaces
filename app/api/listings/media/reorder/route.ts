import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { listingId, orderedMediaIds } = await req.json()
    if (!listingId || !orderedMediaIds || !Array.isArray(orderedMediaIds)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Verify ownership
    const listing = await prisma.listing.findUnique({
      where: { id: listingId }
    })

    if (!listing || listing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update the order for all media items in a transaction
    await prisma.$transaction(
      orderedMediaIds.map((mediaId, index) => 
        prisma.listingMedia.update({
          where: { id: mediaId },
          data: { order: index }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[POST /api/listings/media/reorder]', error)
    return NextResponse.json({ error: 'Failed to reorder media' }, { status: 500 })
  }
}
