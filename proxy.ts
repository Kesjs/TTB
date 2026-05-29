import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const path = requestUrl.pathname

  // Ne pas protéger les routes publiques
  if (
    path.startsWith('/api') ||
    path.startsWith('/_next') ||
    path.startsWith('/static') ||
    path.startsWith('/favicon') ||
    path === '/' ||
    path.startsWith('/candidature') ||
    path === '/login'
  ) {
    return NextResponse.next()
  }

  try {
    // Créer le client Supabase SSR
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: any) {
            response.cookies.delete({
              name,
              ...options,
            })
          },
        },
      }
    )

    // Rafraîchir la session
    const { data: { session } } = await supabase.auth.getSession()

    // Si pas de session et on tente d'accéder à un dashboard, rediriger vers login
    if (!session && path.startsWith('/dashboard')) {
      const redirectUrl = new URL('/login', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Si session existe, vérifier les permissions pour les dashboards
    if (session && path.startsWith('/dashboard')) {
      // Récupérer le rôle depuis la table profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      const userRole = profile?.role

      // Protection du dashboard candidate
      if (path.startsWith('/dashboard/candidate')) {
        if (userRole !== 'candidate') {
          // Rediriger vers le bon dashboard selon le rôle
          if (userRole === 'admin') {
            const redirectUrl = new URL('/dashboard/admin', request.url)
            return NextResponse.redirect(redirectUrl)
          } else if (userRole === 'jury') {
            const redirectUrl = new URL('/dashboard/jury', request.url)
            return NextResponse.redirect(redirectUrl)
          } else {
            // Rôle inconnu, rediriger vers login
            const redirectUrl = new URL('/login', request.url)
            return NextResponse.redirect(redirectUrl)
          }
        }
      }

      // Protection du dashboard admin
      if (path.startsWith('/dashboard/admin')) {
        if (userRole !== 'admin') {
          // Rediriger vers le bon dashboard selon le rôle
          if (userRole === 'candidate') {
            const redirectUrl = new URL('/dashboard/candidate', request.url)
            return NextResponse.redirect(redirectUrl)
          } else if (userRole === 'jury') {
            const redirectUrl = new URL('/dashboard/jury', request.url)
            return NextResponse.redirect(redirectUrl)
          } else {
            // Rôle inconnu, rediriger vers login
            const redirectUrl = new URL('/login', request.url)
            return NextResponse.redirect(redirectUrl)
          }
        }
      }

      // Protection du dashboard jury
      if (path.startsWith('/dashboard/jury')) {
        if (userRole !== 'jury') {
          // Rediriger vers le bon dashboard selon le rôle
          if (userRole === 'candidate') {
            const redirectUrl = new URL('/dashboard/candidate', request.url)
            return NextResponse.redirect(redirectUrl)
          } else if (userRole === 'admin') {
            const redirectUrl = new URL('/dashboard/admin', request.url)
            return NextResponse.redirect(redirectUrl)
          } else {
            // Rôle inconnu, rediriger vers login
            const redirectUrl = new URL('/login', request.url)
            return NextResponse.redirect(redirectUrl)
          }
        }
      }
    }

    return response
  } catch (error) {
    // Log de l'erreur pour debugging
    console.error('[Proxy] Error during authentication check:', error)

    // Tenter de nettoyer la session en cas d'erreur
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value
            },
            set(name: string, value: string, options: any) {
              response.cookies.set({
                name,
                value,
                ...options,
              })
            },
            remove(name: string, options: any) {
              response.cookies.delete({
                name,
                ...options,
              })
            },
          },
        }
      )

      await supabase.auth.signOut()
    } catch (signOutError) {
      console.error('[Proxy] Error during signOut:', signOutError)
    }

    // Rediriger vers login en cas d'erreur
    const redirectUrl = new URL('/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}