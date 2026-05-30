import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    
    // User role & subscription status
    const role = token?.role as string | undefined
    const subscriptionStatus = token?.subscriptionStatus as string | undefined

    const isOwner = role === 'OWNER' || role === 'ADMIN' || role === 'SUPER_ADMIN'
    const isSubscribed = subscriptionStatus === 'ACTIVE'

    // Guard path: /search-spaces
    if (req.nextUrl.pathname.startsWith('/search-spaces')) {
      if (!token) {
        const url = new URL('/signin', req.url)
        url.searchParams.set('callbackUrl', req.url)
        const response = NextResponse.redirect(url)
        response.cookies.set('signup_intent', 'SEEKER', { path: '/', maxAge: 3600 })
        return response
      }
    }

    // Guard paths for listing a space
    if (req.nextUrl.pathname.startsWith('/list-your-space') || req.nextUrl.pathname.startsWith('/add-listing')) {
      if (!token) {
        const url = new URL('/signin', req.url)
        url.searchParams.set('callbackUrl', req.url)
        const response = NextResponse.redirect(url)
        response.cookies.set('signup_intent', 'OWNER', { path: '/', maxAge: 3600 })
        return response
      }
      
      // If they are logged in and trying to go to /add-listing without a region
      if (req.nextUrl.pathname.startsWith('/add-listing')) {
        const region = req.nextUrl.searchParams.get('region')
        if (!region) {
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
  matcher: ['/search-spaces/:path*', '/list-your-space/:path*', '/add-listing/:path*'],
}
