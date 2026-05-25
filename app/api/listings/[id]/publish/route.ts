import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    if (!id) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 })
    }

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        media: true,
      },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Verify ownership or admin privileges
    if (listing.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // --- Validation Checks ---
    
    // 1. Basic details check
    if (!listing.title || listing.title.trim().length < 5) {
      return NextResponse.json(
        { error: 'Listing title is required and must be at least 5 characters long.' },
        { status: 400 }
      )
    }

    if (!listing.spaceType) {
      return NextResponse.json({ error: 'Space type category is required.' }, { status: 400 })
    }

    // 2. Location check
    if (!listing.address || !listing.city || !listing.state || !listing.zipCode) {
      return NextResponse.json({ error: 'Complete location address details are required.' }, { status: 400 })
    }

    // 3. Description check (min 100 characters)
    if (!listing.description || listing.description.trim().length < 100) {
      return NextResponse.json(
        { error: 'Listing description is required and must be at least 100 characters long.' },
        { status: 400 }
      )
    }

    // 4. Photo Gallery check (min 3 photos)
    const photoCount = listing.media.filter((m) => m.type === 'IMAGE').length
    if (photoCount < 3) {
      return NextResponse.json(
        { error: `At least 3 photos are required to publish. (Currently uploaded: ${photoCount})` },
        { status: 400 }
      )
    }

    // 5. Pricing check (at least one pricing tier)
    const hasPricing =
      (listing.pricePerHour !== null && listing.pricePerHour > 0) ||
      (listing.pricePerDay !== null && listing.pricePerDay > 0) ||
      (listing.pricePerMonth !== null && listing.pricePerMonth > 0)

    if (!hasPricing) {
      return NextResponse.json(
        { error: 'At least one pricing tier (hourly, daily, or monthly) must be set with a value greater than 0.' },
        { status: 400 }
      )
    }

    // Generate an SEO-friendly slug
    const cleanedTitle = listing.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
    const randomSuffix = Math.random().toString(36).substring(2, 6)
    const generatedSlug = `${cleanedTitle}-${randomSuffix}-${id.substring(0, 4)}`

    // Transition status to PUBLISHED
    const publishedListing = await prisma.listing.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        slug: generatedSlug,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Listing published successfully.',
      listing: publishedListing,
    })
  } catch (error) {
    console.error('[PUT /api/listings/[id]/publish]', error)
    return NextResponse.json({ error: 'Failed to publish listing' }, { status: 500 })
  }
}
