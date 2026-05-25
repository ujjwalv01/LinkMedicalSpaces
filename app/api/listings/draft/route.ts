import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

// ─── GET /api/listings/draft ───────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    const where: any = {
      userId: session.user.id,
      status: 'DRAFT',
    }

    if (id) {
      where.id = id
    }

    // Retrieve the user's latest draft listing with media
    const draft = await prisma.listing.findFirst({
      where,
      include: {
        media: { orderBy: { order: 'asc' } },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json(draft)
  } catch (error) {
    console.error('[GET /api/listings/draft]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/listings/draft ──────────────────────────────────────────────
const DraftListingSchema = z.object({
  id: z.string().optional(),
  spaceType: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  rooms: z.number().int().nonnegative().nullable().optional(),
  squareFeet: z.number().positive().nullable().optional(),
  amenities: z.array(z.string()).optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  zipCode: z.string().nullable().optional(),
  country: z.string().default('US'),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  pricePerHour: z.number().nullable().optional(),
  pricePerDay: z.number().nullable().optional(),
  pricePerMonth: z.number().nullable().optional(),
  availabilityHours: z.any().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = DraftListingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input data' },
        { status: 400 }
      )
    }

    const data = parsed.data
    const userId = session.user.id

    let draftListing

    // If id is provided, update the existing draft
    if (data.id) {
      const existing = await prisma.listing.findUnique({
        where: { id: data.id },
      })

      if (!existing) {
        return NextResponse.json({ error: 'Draft listing not found' }, { status: 404 })
      }

      if (existing.userId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      draftListing = await prisma.listing.update({
        where: { id: data.id },
        data: {
          spaceType: data.spaceType ?? undefined,
          title: data.title ?? undefined,
          rooms: data.rooms ?? undefined,
          squareFeet: data.squareFeet ?? undefined,
          amenities: data.amenities ? JSON.stringify(data.amenities) : undefined,
          address: data.address ?? undefined,
          city: data.city ?? undefined,
          state: data.state ?? undefined,
          zipCode: data.zipCode ?? undefined,
          country: data.country ?? undefined,
          latitude: data.latitude ?? undefined,
          longitude: data.longitude ?? undefined,
          description: data.description ?? undefined,
          pricePerHour: data.pricePerHour ?? undefined,
          pricePerDay: data.pricePerDay ?? undefined,
          pricePerMonth: data.pricePerMonth ?? undefined,
          availabilityHours: data.availabilityHours !== undefined ? (data.availabilityHours as any) : undefined,
        },
      })
    } else {
      // Check if a draft already exists for this user (to prevent multiple orphan drafts)
      const existingDraft = await prisma.listing.findFirst({
        where: { userId, status: 'DRAFT' },
        orderBy: { updatedAt: 'desc' },
      })

      if (existingDraft) {
        draftListing = await prisma.listing.update({
          where: { id: existingDraft.id },
          data: {
            spaceType: data.spaceType ?? undefined,
            title: data.title ?? undefined,
            rooms: data.rooms ?? undefined,
            squareFeet: data.squareFeet ?? undefined,
            amenities: data.amenities ? JSON.stringify(data.amenities) : undefined,
            address: data.address ?? undefined,
            city: data.city ?? undefined,
            state: data.state ?? undefined,
            zipCode: data.zipCode ?? undefined,
            country: data.country ?? undefined,
            latitude: data.latitude ?? undefined,
            longitude: data.longitude ?? undefined,
            description: data.description ?? undefined,
            pricePerHour: data.pricePerHour ?? undefined,
            pricePerDay: data.pricePerDay ?? undefined,
            pricePerMonth: data.pricePerMonth ?? undefined,
            availabilityHours: data.availabilityHours !== undefined ? (data.availabilityHours as any) : undefined,
          },
        })
      } else {
        // Create new draft listing with a unique temporary slug
        const slug = `draft-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`
        
        draftListing = await prisma.listing.create({
          data: {
            userId,
            status: 'DRAFT',
            slug,
            spaceType: data.spaceType || null,
            title: data.title || null,
            description: data.description || null,
            rooms: data.rooms || 1,
            squareFeet: data.squareFeet || null,
            amenities: data.amenities ? JSON.stringify(data.amenities) : '[]',
            address: data.address || null,
            city: data.city || null,
            state: data.state || null,
            country: data.country || 'US',
            zipCode: data.zipCode || null,
            latitude: data.latitude || null,
            longitude: data.longitude || null,
            pricePerHour: data.pricePerHour || null,
            pricePerDay: data.pricePerDay || null,
            pricePerMonth: data.pricePerMonth || null,
            availabilityHours: data.availabilityHours ? (data.availabilityHours as any) : {},
          },
        })
      }
    }

    return NextResponse.json(draftListing)
  } catch (error) {
    console.error('[POST /api/listings/draft]', error)
    return NextResponse.json({ error: 'Failed to save draft listing' }, { status: 500 })
  }
}
