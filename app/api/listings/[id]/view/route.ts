import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const listingId = params.id
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'

    // Deduplicate: check if this IP viewed this listing in the last 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const existingView = await prisma.listingView.findFirst({
      where: {
        listingId,
        ipAddress: ip,
        viewedAt: {
          gte: oneHourAgo,
        },
      },
    })

    if (!existingView) {
      await prisma.$transaction([
        prisma.listingView.create({
          data: {
            listingId,
            ipAddress: ip,
          },
        }),
        prisma.listing.update({
          where: { id: listingId },
          data: { viewCount: { increment: 1 } },
        }),
      ])
      return NextResponse.json({ success: true, tracked: true })
    }

    return NextResponse.json({ success: true, tracked: false })
  } catch (error) {
    console.error('View tracking error:', error)
    // Return 200 even on error so we don't break the client
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
