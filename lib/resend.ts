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

export default resend

