import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { deleteImage } from '@/lib/cloudinary'
import prisma from '@/lib/prisma'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { publicId: string[] } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!params.publicId || params.publicId.length === 0) {
      return NextResponse.json({ error: 'Missing publicId' }, { status: 400 })
    }

    // Join catch-all route parameters to reconstruct the full Cloudinary public ID
    const fullPublicId = params.publicId.join('/')

    // Query database to check if this asset exists in ListingMedia
    const mediaItem = await prisma.listingMedia.findFirst({
      where: {
        OR: [
          { originalUrl: { contains: fullPublicId } },
          { optimizedUrl: { contains: fullPublicId } },
        ],
      },
      include: {
        listing: true,
      },
    })

    if (mediaItem) {
      // Verify ownership
      if (mediaItem.listing.userId !== session.user.id && session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      // Delete from Cloudinary using appropriate resource type (image or video)
      const resourceType = mediaItem.type === 'VIDEO' ? 'video' : 'image'
      await deleteImage(fullPublicId, resourceType)

      // Delete listing media record from the database
      await prisma.listingMedia.delete({
        where: { id: mediaItem.id },
      })

      // Shift other media orders to maintain contiguous order sequence
      const remainingMedia = await prisma.listingMedia.findMany({
        where: { listingId: mediaItem.listingId },
        orderBy: { order: 'asc' },
      })

      for (let i = 0; i < remainingMedia.length; i++) {
        await prisma.listingMedia.update({
          where: { id: remainingMedia[i].id },
          data: { order: i },
        })
      }

      return NextResponse.json({ success: true, message: 'Asset deleted from Cloudinary and database.' })
    } else {
      // If not tracked in database (e.g. temporary user uploads), try deleting directly from Cloudinary
      try {
        await deleteImage(fullPublicId, 'image')
      } catch (_) {
        // Fallback retry as video if image destroy fails
        await deleteImage(fullPublicId, 'video')
      }
      return NextResponse.json({ success: true, message: 'Temp asset deleted from Cloudinary.' })
    }
  } catch (error: any) {
    console.error('[DELETE /api/upload/[...publicId]]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete asset from Cloudinary' },
      { status: 500 }
    )
  }
}
