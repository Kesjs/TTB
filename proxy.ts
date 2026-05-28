import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get cookies for authentication
  const userId = request.cookies.get('user_id')?.value
  const userRole = request.cookies.get('user_role')?.value

  console.log('[Proxy] Path:', pathname, 'userId:', userId, 'userRole:', userRole)

  // Redirect logged-in users away from login page - DISABLED to allow account switching
  /*
  if (pathname === '/login' && userId && userRole) {
    console.log('[Proxy] User already logged in, redirecting to dashboard')
    const dashboardUrl = userRole === 'admin'
      ? new URL('/dashboard/admin', request.url)
      : userRole === 'jury'
        ? new URL('/dashboard/jury', request.url)
        : new URL('/dashboard/candidate', request.url)
    return NextResponse.redirect(dashboardUrl)
  }
  */

  // Protection de la route /candidature - vérifier la phase actuelle
  // Note: Phase check moved to client-side in candidature page for simplicity
  // Keep this section for future server-side phase validation if needed

  // Redirection propre de /admin vers le tableau de bord
  if (pathname === '/admin') {
    return NextResponse.redirect(new URL('/dashboard/admin', request.url))
  }

  // Protection des routes /dashboard/admin/*
  if (pathname.startsWith('/dashboard/admin')) {
    if (!userId || userRole !== 'admin') {
      console.log('[Proxy] Unauthorized access to admin dashboard, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }
    console.log('[Proxy] Admin access granted')
  }

  // Protection des routes /dashboard/jury/*
  if (pathname.startsWith('/dashboard/jury')) {
    if (!userId || userRole !== 'jury') {
      console.log('[Proxy] Unauthorized access to jury dashboard, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }
    console.log('[Proxy] Jury access granted')
  }

  if (pathname.startsWith('/dashboard/candidate')) {
    if (!userId || userRole !== 'candidate') {
      console.log('[Proxy] Unauthorized access to candidate dashboard, redirecting to candidature login')
      return NextResponse.redirect(new URL('/candidature?view=login', request.url))
    }
    console.log('[Proxy] Candidate access granted')
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/candidature',
    '/admin',
    '/admin/:path*',
    '/dashboard/:path*',
    '/login',
  ],
}