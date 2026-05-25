import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

// ─── GET /api/listings ────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const city = searchParams.get('city')
    const state = searchParams.get('state')
    const spaceType = searchParams.get('spaceType')
    const query = searchParams.get('query')
    const sortBy = searchParams.get('sortBy') || 'newest'

    const myOnly = searchParams.get('my') === 'true'
    const where: any = {}

    if (myOnly) {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      where.userId = session.user.id
    } else {
      where.status = 'PUBLISHED'
    }

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
      ]
    }
    if (city) where.city = { contains: city, mode: 'insensitive' }
    if (state) where.state = state
    if (spaceType) where.spaceType = spaceType

    const orderBy: any =
      sortBy === 'price_asc' ? { pricePerMonth: 'asc' }
      : sortBy === 'price_desc' ? { pricePerMonth: 'desc' }
      : sortBy === 'popular' ? { viewCount: 'desc' }
      : { createdAt: 'desc' }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          media: { orderBy: { order: 'asc' }, take: 3 },
          user: { select: { id: true, name: true, image: true, verificationStatus: true } },
        },
      }),
      prisma.listing.count({ where }),
    ])

    return NextResponse.json({
      listings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[GET /api/listings]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/listings ───────────────────────────────────────────────────────
const CreateListingSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20),
  spaceType: z.string(),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  zipCode: z.string().min(5),
  country: z.string().default('US'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  pricePerHour: z.number().positive().optional(),
  pricePerDay: z.number().positive().optional(),
  pricePerMonth: z.number().positive().optional(),
  amenities: z.any().default([]),
  availabilityHours: z.any().default({}),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only OWNER/ADMIN can create listings
    if (!['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Only space owners can create listings. Please upgrade your account.' },
        { status: 403 }
      )
    }

    // Check subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })
    if (!subscription || subscription.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'An active subscription is required to create listings.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const data = CreateListingSchema.parse(body)

    let slug = slugify(data.title)
    const existing = await prisma.listing.findUnique({ where: { slug } })
    if (existing) slug = `${slug}-${Date.now()}`

    const listing = await prisma.listing.create({
      data: { ...data, slug, userId: session.user.id, status: 'DRAFT' },
    })

    return NextResponse.json(listing, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Validation error' }, { status: 400 })
    }
    console.error('[POST /api/listings]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
