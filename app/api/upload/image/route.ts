import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadImage } from '@/lib/cloudinary'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const listingId = formData.get('listingId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Build directory folder
    const folder = listingId
      ? `linkmedicalspaces/listings/${listingId}`
      : `linkmedicalspaces/temp/${session.user.id}`

    // Upload image to Cloudinary
    const result = await uploadImage(buffer, folder)

    // If listingId is provided, save image info directly to ListingMedia database table
    if (listingId) {
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
      })

      if (!listing) {
        return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
      }

      if (listing.userId !== session.user.id && session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const mediaCount = await prisma.listingMedia.count({
        where: { listingId },
      })

      const media = await prisma.listingMedia.create({
        data: {
          listingId,
          type: 'IMAGE',
          originalUrl: result.secureUrl,
          optimizedUrl: result.secureUrl, // Cloudinary secure_url is optimized automatically via auto transformations
          order: mediaCount,
        },
      })

      return NextResponse.json({ media, upload: result })
    }

    return NextResponse.json({ upload: result })
  } catch (error) {
    console.error('[POST /api/upload/image]', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
