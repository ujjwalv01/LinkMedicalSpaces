import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mediaId = params.id
    if (!mediaId) {
      return NextResponse.json({ error: 'Missing media ID' }, { status: 400 })
    }

    const { caption } = await req.json()

    // Find the media item
    const mediaItem = await prisma.listingMedia.findUnique({
      where: { id: mediaId },
      include: { listing: true },
    })

    if (!mediaItem) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    // Verify ownership
    if (mediaItem.listing.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update the caption
    const updatedMedia = await prisma.listingMedia.update({
      where: { id: mediaId },
      data: { caption },
    })

    return NextResponse.json(updatedMedia)
  } catch (error) {
    console.error('[PATCH /api/listings/media/[id]]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
