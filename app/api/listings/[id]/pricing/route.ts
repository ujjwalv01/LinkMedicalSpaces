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
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Verify ownership or admin privileges
    if (listing.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { pricePerHour, pricePerDay, pricePerMonth, availabilityHours } = body

    // Update listing details
    const updatedListing = await prisma.listing.update({
      where: { id },
      data: {
        pricePerHour: pricePerHour !== undefined ? (pricePerHour === null || pricePerHour === '' ? null : parseFloat(pricePerHour)) : undefined,
        pricePerDay: pricePerDay !== undefined ? (pricePerDay === null || pricePerDay === '' ? null : parseFloat(pricePerDay)) : undefined,
        pricePerMonth: pricePerMonth !== undefined ? (pricePerMonth === null || pricePerMonth === '' ? null : parseFloat(pricePerMonth)) : undefined,
        availabilityHours: availabilityHours !== undefined ? availabilityHours : undefined,
      },
    })

    return NextResponse.json(updatedListing)
  } catch (error) {
    console.error('[PUT /api/listings/[id]/pricing]', error)
    return NextResponse.json({ error: 'Failed to update pricing details' }, { status: 500 })
  }
}
