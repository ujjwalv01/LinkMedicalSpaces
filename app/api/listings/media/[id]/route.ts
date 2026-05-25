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

    const body = await req.json()
    const { caption, order } = body

    const mediaItem = await prisma.listingMedia.findUnique({
      where: { id: params.id },
      include: { listing: true },
    })

    if (!mediaItem) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    // Verify listing ownership
    if (mediaItem.listing.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update media details
    const updatedMedia = await prisma.listingMedia.update({
      where: { id: params.id },
      data: {
        caption: caption !== undefined ? caption : undefined,
        order: order !== undefined ? parseInt(order) : undefined,
      },
    })

    return NextResponse.json(updatedMedia)
  } catch (error) {
    console.error('[PATCH /api/listings/media/[id]]', error)
    return NextResponse.json({ error: 'Failed to update media item' }, { status: 500 })
  }
}
