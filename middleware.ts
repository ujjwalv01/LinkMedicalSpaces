import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// ─── Hard-coded admin emails (duplicated from lib/admin.ts because middleware
//     runs in the Edge Runtime and cannot import server-only modules) ─────────
const LMS_ADMIN_EMAILS = [
  'shreyas@mediatree.co.in',
  'ujjwalverma010305@gmail.com',
]

// ─── Rate limiter for /lms-admin routes (in-memory, per-IP) ─────────────────
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute

function isRateLimited(key: string, limit: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  entry.count++
  if (entry.count > limit) {
    return true
  }
  return false
}

// Periodically clean up stale entries (prevent memory leak)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, val] of rateLimitMap) {
      if (now > val.resetTime) rateLimitMap.delete(key)
    }
  }, 120_000)
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token

    // User role & subscription status
    const role = token?.role as string | undefined
    const subscriptionStatus = token?.subscriptionStatus as string | undefined
    const onboarded = token?.onboarded as boolean | undefined

    // ── Sensitive Route Rate Limiting ─────────────────────────────────────
    if (req.method !== 'GET') {
      const pathname = req.nextUrl.pathname
      let rateLimitMax = 0

      if (pathname === '/api/auth/signin' || pathname === '/api/auth/callback/credentials') {
        rateLimitMax = 5
      } else if (pathname === '/api/auth/send-otp') {
        rateLimitMax = 3
      } else if (pathname === '/api/auth/reset-password') {
        rateLimitMax = 3
      } else if (pathname.match(/^\/api\/(lms-)?admin\/users\/[^/]+\/delete$/) || (pathname.match(/^\/api\/(lms-)?admin\/users\/[^/]+$/) && req.method === 'DELETE')) {
        rateLimitMax = 10
      } else if (pathname.match(/^\/api\/(lms-)?admin\/users\/[^/]+\/disable$/)) {
        rateLimitMax = 10
      } else if (pathname.match(/^\/api\/(lms-)?admin\/properties\/[^/]+\/approve$/)) {
        rateLimitMax = 20
      } else if (pathname.match(/^\/api\/(lms-)?admin\/properties\/[^/]+\/reject$/)) {
        rateLimitMax = 20
      }

      if (rateLimitMax > 0) {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
        const key = `${ip}:${pathname}`
        if (isRateLimited(key, rateLimitMax)) {
          return new NextResponse('Too many requests. Please try again later.', { status: 429 })
        }
      }
    }

    // ── Admin gate ────────────────────────────────────────────────────────
    if (req.nextUrl.pathname.startsWith('/lms-admin') || req.nextUrl.pathname.startsWith('/api/lms-admin')) {
      const email = token?.email?.toLowerCase()

      // Must be authenticated AND have an allowed admin email
      if (!token || !email || !LMS_ADMIN_EMAILS.includes(email)) {
        return NextResponse.redirect(new URL('/not-found', req.url))
      }

      return NextResponse.next()
    }

    // ── Redirect Admins away from User Pages ──────────────────────────────
    const currentEmail = token?.email?.toLowerCase()
    const isAdmin = token && currentEmail && LMS_ADMIN_EMAILS.includes(currentEmail)

    if (isAdmin) {
      if (
        req.nextUrl.pathname.startsWith('/dashboard') ||
        req.nextUrl.pathname.startsWith('/list-your-space') ||
        req.nextUrl.pathname.startsWith('/search-spaces') ||
        req.nextUrl.pathname.startsWith('/add-listing') ||
        req.nextUrl.pathname.startsWith('/onboarding')
      ) {
        return NextResponse.redirect(new URL('/lms-admin', req.url))
      }
    }

    // ── Protect /dashboard/owner route ────────────────────────────────────
    if (req.nextUrl.pathname.startsWith('/dashboard/owner')) {
      if (!token || (token.role !== 'OWNER' && !isAdmin)) {
        // Fallback for seekers or unauthenticated users trying to access owner dashboard
        // Once /dashboard/seeker exists, this could redirect there for seekers
        return NextResponse.redirect(new URL('/search-spaces', req.url))
      }
    }

    // ── Route /dashboard based on role ────────────────────────────────────
    if (req.nextUrl.pathname === '/dashboard') {
      if (token && role === 'OWNER') {
        return NextResponse.redirect(new URL('/dashboard/owner', req.url))
      }
      if (token && role === 'SEEKER') {
        // Fallback until seeker dashboard is built
        // return NextResponse.redirect(new URL('/dashboard/seeker', req.url))
      }
    }

    // ── Onboarding gate ─────────────────────────────────────────────────
    // If user is authenticated but not onboarded, redirect to /onboarding
    // (except if they're already on /onboarding)
    if (token && onboarded === false && !req.nextUrl.pathname.startsWith('/onboarding') && req.nextUrl.pathname !== '/') {
      const onboardingUrl = new URL('/onboarding', req.url)
      
      // Determine intent from current path
      if (req.nextUrl.pathname.startsWith('/list-your-space') || req.nextUrl.pathname.startsWith('/add-listing')) {
        onboardingUrl.searchParams.set('intent', 'lister')
      } else if (req.nextUrl.pathname.startsWith('/search-spaces')) {
        onboardingUrl.searchParams.set('intent', 'seeker')
      }

      // Preserve the original destination so we can redirect back after onboarding
      const currentPath = req.nextUrl.pathname + req.nextUrl.search
      if (currentPath !== '/dashboard' && currentPath !== '/') {
        onboardingUrl.searchParams.set('callbackUrl', currentPath)
      }

      return NextResponse.redirect(onboardingUrl)
    }

    // ── Guard: /onboarding — already onboarded users should skip ────────
    if (req.nextUrl.pathname.startsWith('/onboarding')) {
      if (token && onboarded === true) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
      // Let un-onboarded users through to /onboarding
      return NextResponse.next()
    }

    // ── Guard: /search-spaces ───────────────────────────────────────────
    if (req.nextUrl.pathname.startsWith('/search-spaces')) {
      if (!token) {
        const url = new URL('/signup', req.url)
        url.searchParams.set('callbackUrl', req.url)
        const response = NextResponse.redirect(url)
        response.cookies.set('signup_intent', 'SEEKER', { path: '/', maxAge: 3600 })
        return response
      }
    }

    // ── Guard: /list-your-space & /add-listing ──────────────────────────
    if (req.nextUrl.pathname.startsWith('/list-your-space') || req.nextUrl.pathname.startsWith('/add-listing')) {
      if (!token) {
        const url = new URL('/signup', req.url)
        url.searchParams.set('callbackUrl', req.url)
        const response = NextResponse.redirect(url)
        response.cookies.set('signup_intent', 'OWNER', { path: '/', maxAge: 3600 })
        return response
      }
      
      // If they are logged in and trying to go to /add-listing without a region or draftId
      if (req.nextUrl.pathname.startsWith('/add-listing')) {
        const region = req.nextUrl.searchParams.get('region')
        const draftId = req.nextUrl.searchParams.get('draftId')
        if (!region && !draftId) {
          return NextResponse.redirect(new URL('/list-your-space', req.url))
        }
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: () => true, // We handle authorization checks manually in the middleware body
    },
  }
)

export const config = {
  matcher: [
    '/search-spaces/:path*',
    '/list-your-space/:path*',
    '/add-listing/:path*',
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/lms-admin/:path*',
    '/api/lms-admin/:path*',
    '/api/admin/:path*',
    '/api/auth/:path*',
  ],
}
