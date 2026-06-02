import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/admin'

export async function GET(req: NextRequest) {
  const admin = await verifyAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const region = searchParams.get('region') || 'orlando' // orlando | non-orlando | all
    const status = searchParams.get('status') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const where: any = {}
    const andConditions: any[] = []

    // Region filter
    if (region === 'orlando') {
      andConditions.push({
        OR: [
          { city: { contains: 'Orlando', mode: 'insensitive' } },
          { state: 'FL' },
        ],
      })
    } else if (region === 'non-orlando') {
      andConditions.push({
        AND: [
          {
            NOT: {
              city: { contains: 'Orlando', mode: 'insensitive' },
            },
          },
          {
            NOT: {
              state: 'FL',
            },
          },
        ],
      })
    }

    if (search) {
      andConditions.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
        ],
      })
    }

    if (status) {
      andConditions.push({ status })
    }

    if (andConditions.length > 0) {
      where.AND = andConditions
    }

    // Build orderBy
    const validSortFields = ['title', 'createdAt', 'viewCount', 'savedCount']
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
    const orderBy: any = { [orderField]: sortOrder === 'asc' ? 'asc' : 'desc' }

    const [properties, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              subscription: {
                select: { startDate: true, status: true },
              },
            },
          },
          media: {
            orderBy: { order: 'asc' },
            take: 1,
            select: { originalUrl: true },
          },
        },
      }),
      prisma.listing.count({ where }),
    ])

    return NextResponse.json({
      properties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[GET /api/lms-admin/properties]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
