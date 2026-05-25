import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = 'LinkMedicalSpaces <noreply@linkmedicalspaces.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// ─── Welcome Email ─────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Welcome to LinkMedicalSpaces!',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0D9488, #0F766E); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to LinkMedicalSpaces</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 8px;">Connecting Medical Professionals with the Perfect Space</p>
        </div>
        <div style="background: #fff; padding: 40px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
          <h2 style="color: #111827;">Hi ${name}! 👋</h2>
          <p style="color: #6B7280; line-height: 1.6;">
            Welcome to LinkMedicalSpaces — the only platform dedicated to connecting medical professionals with the perfect office space.
          </p>
          <p style="color: #6B7280; line-height: 1.6;">
            Whether you're looking to lease, sublet, or share a medical office, we've got you covered.
          </p>
          <a href="${APP_URL}/search" style="display: inline-block; background: #0D9488; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
            Browse Available Spaces
          </a>
        </div>
      </div>
    `,
  })
}

// ─── Booking Notification ──────────────────────────────────────────────────

export async function sendBookingNotification(
  to: string,
  providerName: string,
  listingTitle: string,
  startDate: string,
  endDate: string
) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `New Booking Request — ${listingTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0D9488; padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0;">New Booking Request</h1>
        </div>
        <div style="background: #fff; padding: 40px; border: 1px solid #e5e7eb;">
          <p style="color: #6B7280;">Hi ${providerName},</p>
          <p style="color: #6B7280; line-height: 1.6;">You have a new booking request for <strong style="color: #111827;">${listingTitle}</strong>.</p>
          <div style="background: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #374151;"><strong>Start Date:</strong> ${startDate}</p>
            <p style="margin: 8px 0 0; color: #374151;"><strong>End Date:</strong> ${endDate}</p>
          </div>
          <a href="${APP_URL}/dashboard" style="display: inline-block; background: #0D9488; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            View Booking Request
          </a>
        </div>
      </div>
    `,
  })
}

// ─── Password Reset ────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(to: string, resetToken: string) {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${resetToken}`

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Reset Your Password — LinkMedicalSpaces',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0D9488; padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0;">Password Reset</h1>
        </div>
        <div style="background: #fff; padding: 40px; border: 1px solid #e5e7eb;">
          <p style="color: #6B7280; line-height: 1.6;">
            We received a request to reset your password. Click the button below to create a new password.
          </p>
          <p style="color: #6B7280; font-size: 14px;">This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display: inline-block; background: #0D9488; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">
            Reset Password
          </a>
          <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  })
}

// ─── Draft Reminder Email ──────────────────────────────────────────────────

export async function sendDraftReminderEmail(to: string, name: string, draftId: string) {
  const directLink = `${APP_URL}/dashboard/listings/draft/${draftId}`

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Your listing is waiting to be published!',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0D9488, #0F766E); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Complete Your Listing</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 8px;">Your medical space draft is waiting on LinkMedicalSpaces</p>
        </div>
        <div style="background: #fff; padding: 40px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
          <h2 style="color: #111827;">Hi ${name}! 👋</h2>
          <p style="color: #6B7280; line-height: 1.6;">
            We noticed you started listing a medical space but didn't finish publishing it. Don't worry, we saved all your progress!
          </p>
          <p style="color: #6B7280; line-height: 1.6;">
            Completing your listing takes just a couple of minutes. Click the button below to resume right where you left off.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${directLink}" style="display: inline-block; background: #0D9488; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Resume Listing Draft
            </a>
          </div>
          <p style="color: #9CA3AF; font-size: 12px; line-height: 1.5;">
            Need help? Reply to this email or visit our help center. We are here to assist you in getting your clinic space leased.
          </p>
        </div>
      </div>
    `,
  })
}

// ─── Inquiry Email ─────────────────────────────────────────────────────────

export async function sendInquiryEmail({
  to,
  hostName,
  listingTitle,
  renterName,
  renterEmail,
  renterPhone,
  message,
  startDate,
  priceOption
}: {
  to: string
  hostName: string
  listingTitle: string
  renterName: string
  renterEmail: string
  renterPhone?: string
  message: string
  startDate?: string
  priceOption?: string
}) {
  const detailsHtml = `
    <div style="background: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #E5E7EB;">
      <p style="margin: 0; color: #374151;"><strong>From:</strong> ${renterName} (<a href="mailto:${renterEmail}" style="color: #0D9488; text-decoration: none;">${renterEmail}</a>)</p>
      ${renterPhone ? `<p style="margin: 8px 0 0; color: #374151;"><strong>Phone:</strong> ${renterPhone}</p>` : ''}
      ${startDate ? `<p style="margin: 8px 0 0; color: #374151;"><strong>Desired Start Date:</strong> ${startDate}</p>` : ''}
      ${priceOption ? `<p style="margin: 8px 0 0; color: #374151;"><strong>Selected Pricing Tier:</strong> ${priceOption}</p>` : ''}
    </div>
  `

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    replyTo: renterEmail,
    subject: `New Inquiry: ${listingTitle} — LinkMedicalSpaces`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border-radius: 16px; overflow: hidden; border: 1px solid #E5E7EB; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        <div style="background: linear-gradient(135deg, #0D9488, #0F766E); padding: 40px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; tracking-tight: -0.025em;">New Inquiry Received</h1>
          <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">Someone is interested in your listing</p>
        </div>
        <div style="background: #fff; padding: 40px;">
          <p style="color: #111827; font-size: 16px; font-weight: 600;">Hi ${hostName || 'Space Owner'},</p>
          <p style="color: #4B5563; line-height: 1.6; font-size: 14px;">
            A prospective tenant has sent you an inquiry regarding your medical space listing <strong style="color: #111827;">${listingTitle}</strong> on LinkMedicalSpaces.
          </p>
          
          ${detailsHtml}

          <div style="background: #F9FAFB; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #0D9488; border-top: 1px solid #E5E7EB; border-right: 1px solid #E5E7EB; border-bottom: 1px solid #E5E7EB;">
            <p style="margin: 0; color: #1F2937; font-style: italic; line-height: 1.6; font-size: 14px;">
              "${message}"
            </p>
          </div>

          <p style="color: #6B7280; line-height: 1.6; font-size: 14px; margin-top: 24px;">
            You can reply directly to this email to start chatting, or call them using the details above.
          </p>

          <div style="text-align: center; margin-top: 32px; border-top: 1px solid #E5E7EB; padding-top: 24px;">
            <p style="font-size: 11px; color: #9CA3AF; margin: 0;">
              © ${new Date().getFullYear()} LinkMedicalSpaces. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `,
  })
}

export default resend

