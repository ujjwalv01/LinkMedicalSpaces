import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendInquiryEmail } from '@/lib/resend'
import { z } from 'zod'

const ContactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().nullable(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  startDate: z.string().optional().nullable(),
  priceOption: z.string().optional().nullable(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listing = await prisma.listing.findFirst({
      where: {
        OR: [
          { id: params.id },
          { slug: params.id },
        ],
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (!listing.user?.email) {
      return NextResponse.json({ error: 'Listing owner email not found' }, { status: 404 })
    }

    const body = await req.json()
    const validation = ContactSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0]?.message ?? 'Validation error' }, { status: 400 })
    }

    const { name, email, phone, message, startDate, priceOption } = validation.data

    // Send email notification to the lister
    try {
      await sendInquiryEmail({
        to: listing.user.email,
        hostName: listing.user.name || 'Medical Space Host',
        listingTitle: listing.title || 'Medical Space',
        renterName: name,
        renterEmail: email,
        renterPhone: phone || undefined,
        message,
        startDate: startDate || undefined,
        priceOption: priceOption || undefined,
      })
    } catch (emailErr) {
      console.error('[POST /api/listings/[id]/contact] Email send failed (non-blocking):', emailErr)
    }

    // Persist enquiry + initial message in DB for dashboard tracking
    try {
      await prisma.enquiry.create({
        data: {
          listingId: listing.id,
          name,
          email,
          phone: phone || null,
          messages: {
            create: {
              content: message,
              sender: 'ENQUIRER',
            },
          },
        },
      })
    } catch (dbErr) {
      console.error('[POST /api/listings/[id]/contact] DB write failed (non-blocking):', dbErr)
    }

    return NextResponse.json({ success: true, message: 'Inquiry sent successfully' })
  } catch (error) {
    console.error('[POST /api/listings/[id]/contact]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
