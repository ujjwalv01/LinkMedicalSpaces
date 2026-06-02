import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, caption } = await req.json()
    if (!id) {
      return NextResponse.json({ error: 'Media ID is required' }, { status: 400 })
    }

    // Verify ownership
    const media = await prisma.listingMedia.findUnique({
      where: { id },
      include: { listing: true }
    })

    if (!media || media.listing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updated = await prisma.listingMedia.update({
      where: { id },
      data: { caption }
    })

    return NextResponse.json({ success: true, media: updated })
  } catch (error) {
    console.error('[PUT /api/listings/media]', error)
    return NextResponse.json({ error: 'Failed to update media' }, { status: 500 })
  }
}
