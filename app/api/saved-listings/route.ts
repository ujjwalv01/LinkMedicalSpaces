import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidateTag } from 'next/cache'

// GET — Fetch all saved listing IDs for the current user (lightweight check)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const idsOnly = url.searchParams.get('idsOnly')

    if (idsOnly === 'true') {
      // Return just the listing IDs for quick state checks
      const saved = await prisma.savedListing.findMany({
        where: { userId: session.user.id },
        select: { listingId: true },
      })
      return NextResponse.json({ ids: saved.map(s => s.listingId) })
    }

    // Full saved listings with details
    const savedListings = await prisma.savedListing.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          include: {
            media: { orderBy: { order: 'asc' }, take: 3 },
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                verificationStatus: true,
              },
            },
          },
        },
      },
    })

    // Only return PUBLISHED listings
    const listings = savedListings
      .filter(s => s.listing.status === 'PUBLISHED')
      .map(s => ({
        savedId: s.id,
        savedAt: s.createdAt,
        ...s.listing,
      }))

    return NextResponse.json({ listings })
  } catch (error) {
    console.error('[GET /api/saved-listings]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — Save a listing
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { listingId } = await req.json()
    if (!listingId) {
      return NextResponse.json({ error: 'listingId is required' }, { status: 400 })
    }

    // Check if listing exists
    const listing = await prisma.listing.findUnique({ where: { id: listingId } })
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Check if already saved
    const existing = await prisma.savedListing.findUnique({
      where: { userId_listingId: { userId: session.user.id, listingId } },
    })

    if (existing) {
      return NextResponse.json({ message: 'Already saved' })
    }

    // Create saved listing and increment savedCount
    await prisma.$transaction([
      prisma.savedListing.create({
        data: { userId: session.user.id, listingId },
      }),
      prisma.listing.update({
        where: { id: listingId },
        data: { savedCount: { increment: 1 } },
      }),
    ])

    revalidateTag(`saved-listings-${session.user.id}`)

    return NextResponse.json({ success: true, message: 'Listing saved' })
  } catch (error) {
    console.error('[POST /api/saved-listings]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE — Unsave a listing
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { listingId } = await req.json()
    if (!listingId) {
      return NextResponse.json({ error: 'listingId is required' }, { status: 400 })
    }

    const existing = await prisma.savedListing.findUnique({
      where: { userId_listingId: { userId: session.user.id, listingId } },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Not saved' }, { status: 404 })
    }

    await prisma.$transaction([
      prisma.savedListing.delete({
        where: { id: existing.id },
      }),
      prisma.listing.update({
        where: { id: listingId },
        data: { savedCount: { decrement: 1 } },
      }),
    ])

    revalidateTag(`saved-listings-${session.user.id}`)

    return NextResponse.json({ success: true, message: 'Listing unsaved' })
  } catch (error) {
    console.error('[DELETE /api/saved-listings]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
