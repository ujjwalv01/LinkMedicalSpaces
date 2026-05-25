import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadVideo } from '@/lib/cloudinary'
import prisma from '@/lib/prisma'
import fs from 'fs'
import path from 'path'
import os from 'os'

export async function POST(req: NextRequest) {
  let tempFilePath: string | null = null
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const listingId = formData.get('listingId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 })
    }

    // Limit video file size to 500MB
    if (file.size > 500 * 1024 * 1024) {
      return NextResponse.json({ error: 'Video too large. Max size allowed is 500MB.' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Save to temp file to prevent memory exhaustion during upload streaming
    const tempDir = os.tmpdir()
    const sanitizedFilename = `vid-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    tempFilePath = path.join(tempDir, sanitizedFilename)
    
    fs.writeFileSync(tempFilePath, buffer)

    const folder = listingId
      ? `linkmedicalspaces/listings/${listingId}`
      : `linkmedicalspaces/temp/${session.user.id}`

    // Upload video using path
    const result = await uploadVideo(tempFilePath, folder)

    // Clean up temp file immediately
    try {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath)
        tempFilePath = null
      }
    } catch (cleanupError) {
      console.error('Failed to clean up temp video file:', cleanupError)
    }

    // Save details to database if listingId is provided
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

      // Create video media record in the DB
      const media = await prisma.listingMedia.create({
        data: {
          listingId,
          type: 'VIDEO',
          originalUrl: result.secureUrl,
          optimizedUrl: result.secureUrl,
          order: mediaCount,
        },
      })

      return NextResponse.json({ media, upload: result })
    }

    return NextResponse.json({ upload: result })
  } catch (error) {
    // Make sure we clean up temp file if error occurs
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath)
      } catch (_) {}
    }
    console.error('[POST /api/upload/video]', error)
    return NextResponse.json({ error: 'Video upload failed' }, { status: 500 })
  }
}
