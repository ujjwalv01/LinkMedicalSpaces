import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    
    // User role & subscription status
    const role = token?.role as string | undefined
    const subscriptionStatus = token?.subscriptionStatus as string | undefined
    const onboarded = token?.onboarded as boolean | undefined

    const isOwner = role === 'OWNER' || role === 'ADMIN' || role === 'SUPER_ADMIN'
    const isSubscribed = subscriptionStatus === 'ACTIVE'

    // ── Onboarding gate ─────────────────────────────────────────────────
    // If user is authenticated but not onboarded, redirect to /onboarding
    // (except if they're already on /onboarding)
    if (token && onboarded === false && !req.nextUrl.pathname.startsWith('/onboarding')) {
      const onboardingUrl = new URL('/onboarding', req.url)
      
      // Determine intent from cookie or current path
      const intentCookie = req.cookies.get('signup_intent')?.value
      if (intentCookie === 'OWNER') {
        onboardingUrl.searchParams.set('intent', 'lister')
      } else if (intentCookie === 'SEEKER') {
        onboardingUrl.searchParams.set('intent', 'seeker')
      } else if (req.nextUrl.pathname.startsWith('/list-your-space') || req.nextUrl.pathname.startsWith('/add-listing')) {
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
  ],
}
