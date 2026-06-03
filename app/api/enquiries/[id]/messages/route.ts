import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revalidateTag } from 'next/cache'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const enquiry = await prisma.enquiry.findUnique({
      where: { id: params.id },
      include: { listing: { select: { userId: true } } }
    })

    if (!enquiry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Allow access for: listing owner, enquirer (by email), or admin
    const isOwner = enquiry.listing.userId === session.user.id
    const isEnquirer = enquiry.email === session.user.email
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)

    if (!isOwner && !isEnquirer && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const messages = await prisma.enquiryMessage.findMany({
      where: { enquiryId: params.id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Failed to get messages', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { content } = await req.json()
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Message content required' }, { status: 400 })
    }

    const enquiry = await prisma.enquiry.findUnique({
      where: { id: params.id },
      include: { listing: { select: { userId: true } } }
    })

    if (!enquiry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Determine sender type based on who's posting
    const isOwner = enquiry.listing.userId === session.user.id
    const isEnquirer = enquiry.email === session.user.email
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)

    if (!isOwner && !isEnquirer && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Auto-detect sender: if the current user is the listing owner, they're the LISTER; otherwise ENQUIRER
    const sender = isOwner || isAdmin ? 'LISTER' : 'ENQUIRER'

    const message = await prisma.$transaction([
      prisma.enquiryMessage.create({
        data: {
          enquiryId: params.id,
          content,
          sender,
        }
      }),
      prisma.enquiry.update({
        where: { id: params.id },
        data: { updatedAt: new Date() }
      })
    ])

    revalidateTag(`contacted-${enquiry.email}`)

    return NextResponse.json(message[0])
  } catch (error) {
    console.error('Failed to post message', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
