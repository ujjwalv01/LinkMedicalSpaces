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
    const statusFilter = searchParams.get('status') || '' // ACTIVE, INACTIVE, EXPIRED
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const where: any = {}
    const andConditions: any[] = []

    if (statusFilter) {
      andConditions.push({ status: statusFilter })
    }

    if (search) {
      andConditions.push({
        user: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
      })
    }

    if (andConditions.length > 0) {
      where.AND = andConditions
    }

    // Build orderBy
    const validSortFields = ['createdAt', 'startDate', 'endDate', 'amount', 'status']
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
    const orderBy: any = { [orderField]: sortOrder === 'asc' ? 'asc' : 'desc' }

    const [subscriptions, total, revenueAgg] = await Promise.all([
      prisma.subscription.findMany({
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
              image: true,
            },
          },
        },
      }),
      prisma.subscription.count({ where }),
      prisma.subscription.aggregate({
        _sum: { amount: true },
        where: { status: 'ACTIVE' },
      }),
    ])

    return NextResponse.json({
      subscriptions,
      totalRevenue: revenueAgg._sum.amount || 0,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[GET /api/lms-admin/subscriptions]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
