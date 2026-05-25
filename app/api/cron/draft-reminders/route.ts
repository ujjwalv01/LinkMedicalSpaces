import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendDraftReminderEmail } from '@/lib/resend'

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate with CRON_SECRET if configured
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Calculate the query window (older than 48 hours, but newer than 72 hours to prevent daily spam)
    const now = Date.now()
    const cutoffDate = new Date(now - 48 * 60 * 60 * 1000) // 48h ago
    const limitDate = new Date(now - 72 * 60 * 60 * 1000)  // 72h ago

    // 3. Query all draft listings in the 48h-72h window
    const drafts = await prisma.listing.findMany({
      where: {
        status: 'DRAFT',
        updatedAt: {
          lte: cutoffDate,
          gte: limitDate,
        },
      },
      include: {
        user: true,
      },
    })

    // 4. Send reminder emails
    const emailResults = []
    for (const draft of drafts) {
      if (draft.user?.email) {
        try {
          const res = await sendDraftReminderEmail(
            draft.user.email,
            draft.user.name || 'Clinical Space Owner',
            draft.id
          )
          emailResults.push({
            listingId: draft.id,
            email: draft.user.email,
            status: 'sent',
            res,
          })
        } catch (emailError: any) {
          console.error(`Failed to send draft email to ${draft.user.email}:`, emailError)
          emailResults.push({
            listingId: draft.id,
            email: draft.user.email,
            status: 'failed',
            error: emailError.message || emailError,
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: drafts.length,
      results: emailResults,
    })
  } catch (error: any) {
    console.error('[GET /api/cron/draft-reminders]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
export const dynamic = 'force-dynamic'
