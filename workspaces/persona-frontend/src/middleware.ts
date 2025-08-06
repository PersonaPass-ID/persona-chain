import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'

// Session interface (same as auth routes)
interface SessionData {
  siwe?: {
    address: string
    chainId: number
    nonce: string
  }
  user?: {
    address: string
    did: string
    createdAt: string
  }
}

// Session config
const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'personapass-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7 // 7 days
  }
}

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/credentials',
  '/github-verification',
  '/settings'
]

// Public routes that should redirect to dashboard if authenticated
const publicOnlyRoutes = [
  '/auth',
  '/login'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if route needs protection
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isPublicOnlyRoute = publicOnlyRoutes.some(route => pathname.startsWith(route))

  if (!isProtectedRoute && !isPublicOnlyRoute) {
    return NextResponse.next()
  }

  try {
    // Get session from cookies
    const cookieStore = request.cookies
    const session = await getIronSession<SessionData>(cookieStore as any, sessionOptions)
    
    // Also check for wallet authentication (temporary fix)
    const hasWalletSession = cookieStore.get('active_wallet_session')
    const isAuthenticated = !!session.user || !!hasWalletSession

    // Handle protected routes
    if (isProtectedRoute && !isAuthenticated) {
      // Redirect to auth page
      const authUrl = new URL('/auth', request.url)
      authUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(authUrl)
    }

    // Handle public-only routes (already authenticated users shouldn't access these)
    if (isPublicOnlyRoute && isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, allow access but log the issue
    return NextResponse.next()
  }
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}