import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// ─── Hard-coded admin emails (never exposed to client) ──────────────────────
const SUPER_ADMIN_EMAIL = 'shreyas@mediatree.co.in'
const MANAGER_EMAIL = 'ujjwalverma010305@gmail.com'

export const ADMIN_EMAILS = [SUPER_ADMIN_EMAIL, MANAGER_EMAIL] as const

// ─── Role helpers ───────────────────────────────────────────────────────────
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase() as any)
}

export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return email.toLowerCase() === SUPER_ADMIN_EMAIL
}

export type AdminRole = 'super_admin' | 'manager'

export function getAdminRole(email: string | null | undefined): AdminRole | null {
  if (!email) return null
  const lower = email.toLowerCase()
  if (lower === SUPER_ADMIN_EMAIL) return 'super_admin'
  if (lower === MANAGER_EMAIL) return 'manager'
  return null
}

// ─── Server-side session verification ───────────────────────────────────────
// Returns the session + admin role, or null if not an admin
export async function verifyAdminSession() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null

  const role = getAdminRole(session.user.email)
  if (!role) return null

  return { session, role, email: session.user.email }
}

// ─── Audit logging ──────────────────────────────────────────────────────────
export async function logAdminAction(
  adminEmail: string,
  action: string,
  targetId: string,
  targetType: string,
  details?: string
) {
  try {
    await prisma.adminLog.create({
      data: {
        adminEmail,
        action,
        targetId,
        targetType,
        details: details ?? null,
      },
    })
  } catch (err) {
    // Never let audit logging break the main flow
    console.error('[AdminLog] Failed to write audit log:', err)
  }
}
