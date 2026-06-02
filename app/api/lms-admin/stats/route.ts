import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/admin'

export async function GET() {
  const admin = await verifyAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [
      totalUsers,
      totalListers,
      totalSeekers,
      totalProperties,
      publishedCount,
      pendingCount,
      draftCount,
      activeSubscriptions,
      newSignupsToday,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'OWNER' } }),
      prisma.user.count({ where: { role: 'SEEKER' } }),
      prisma.listing.count(),
      prisma.listing.count({ where: { status: 'PUBLISHED' } }),
      prisma.listing.count({ where: { status: 'PENDING' } }),
      prisma.listing.count({ where: { status: 'DRAFT' } }),
      prisma.subscription.findMany({
        where: { status: 'ACTIVE' },
        select: { amount: true },
      }),
      prisma.user.count({
        where: { createdAt: { gte: startOfDay } },
      }),
    ])

    const totalRevenue = activeSubscriptions.reduce((sum, s) => sum + (s.amount || 0), 0)

    return NextResponse.json({
      totalUsers,
      totalListers,
      totalSeekers,
      totalProperties,
      publishedCount,
      pendingCount,
      draftCount,
      totalRevenue,
      newSignupsToday,
    })
  } catch (error) {
    console.error('[GET /api/lms-admin/stats]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
