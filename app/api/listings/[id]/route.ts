import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    
    // Ensure the listing belongs to the user
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { media: true }
    })

    if (!listing || listing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 })
    }

    const data = await req.json()
    const {
      title,
      description,
      pricePerHour,
      pricePerDay,
      pricePerMonth,
      spaceType,
      rooms,
      squareFeet,
      address,
      city,
      state,
      zipCode,
      amenities,
      availabilityHours,
      media // New media logic if provided
    } = data

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (pricePerHour !== undefined) updateData.pricePerHour = pricePerHour
    if (pricePerDay !== undefined) updateData.pricePerDay = pricePerDay
    if (pricePerMonth !== undefined) updateData.pricePerMonth = pricePerMonth
    if (spaceType !== undefined) updateData.spaceType = spaceType
    if (rooms !== undefined) updateData.rooms = rooms
    if (squareFeet !== undefined) updateData.squareFeet = squareFeet
    if (address !== undefined) updateData.address = address
    if (city !== undefined) updateData.city = city
    if (state !== undefined) updateData.state = state
    if (zipCode !== undefined) updateData.zipCode = zipCode
    if (amenities !== undefined) updateData.amenities = amenities
    if (availabilityHours !== undefined) updateData.availabilityHours = availabilityHours

    const updatedListing = await prisma.listing.update({
      where: { id },
      data: updateData
    })

    // Handle media updates if provided
    if (media && Array.isArray(media)) {
      // 1. Delete old media not in new array (if they have an id)
      const existingMediaIds = listing.media.map(m => m.id)
      const newMediaIds = media.map((m: any) => m.id).filter(Boolean)
      
      const idsToDelete = existingMediaIds.filter(id => !newMediaIds.includes(id))
      if (idsToDelete.length > 0) {
        await prisma.listingMedia.deleteMany({
          where: { id: { in: idsToDelete } }
        })
      }

      // 2. Add or update media
      for (let i = 0; i < media.length; i++) {
        const item = media[i]
        if (item.id) {
          // Update order or caption
          await prisma.listingMedia.update({
            where: { id: item.id },
            data: { order: i, caption: item.caption || null }
          })
        } else {
          // Create new
          await prisma.listingMedia.create({
            data: {
              listingId: id,
              originalUrl: item.originalUrl,
              optimizedUrl: item.optimizedUrl,
              type: item.type || 'IMAGE',
              caption: item.caption || null,
              order: i
            }
          })
        }
      }
    }

    return NextResponse.json({ success: true, listing: updatedListing })
  } catch (error) {
    console.error('Error updating listing:', error)
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 })
  }
}
