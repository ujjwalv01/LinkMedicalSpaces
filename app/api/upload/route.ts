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
    const isPrimary = formData.get('isPrimary') === 'true'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Use JPEG, PNG, WebP, or PDF.' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const folder = listingId
      ? `linkmedicalspaces/listings/${listingId}`
      : 'linkmedicalspaces/uploads'

    const result = await uploadImage(buffer, folder)

    // If listingId provided, save media record to DB
    if (listingId) {
      const listing = await prisma.listing.findUnique({ where: { id: listingId } })
      if (!listing || listing.userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const mediaCount = await prisma.listingMedia.count({ where: { listingId } })

      const media = await prisma.listingMedia.create({
        data: {
          listingId,
          type: 'IMAGE',
          originalUrl: result.secureUrl,
          optimizedUrl: result.secureUrl,
          order: mediaCount,
        },
      })

      return NextResponse.json({ media, upload: result })
    }

    return NextResponse.json({ upload: result })
  } catch (error) {
    console.error('[POST /api/upload]', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
