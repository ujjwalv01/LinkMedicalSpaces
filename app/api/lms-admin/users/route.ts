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
    const roleFilter = searchParams.get('role') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const where: any = {}
    const andConditions: any[] = []

    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      })
    }

    if (roleFilter) {
      andConditions.push({ role: roleFilter })
    }

    if (andConditions.length > 0) {
      where.AND = andConditions
    }

    // Build orderBy
    const validSortFields = ['name', 'role', 'createdAt', 'lastLogin', 'email']
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
    const orderBy: any = { [orderField]: sortOrder === 'asc' ? 'asc' : 'desc' }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          userSubType: true,
          verificationStatus: true,
          subscriptionStatus: true,
          createdAt: true,
          _count: {
            select: {
              listings: true,
              bookings: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[GET /api/lms-admin/users]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
