import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          supabaseResponse = NextResponse.next({ request: { headers: request.headers } })
          supabaseResponse.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          supabaseResponse = NextResponse.next({ request: { headers: request.headers } })
          supabaseResponse.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute = ['/login', '/signup', '/forgot-password', '/update-password', '/auth/callback']
    .some((p) => request.nextUrl.pathname.startsWith(p))
  const isPublicRoute = request.nextUrl.pathname.startsWith('/welcome') || request.nextUrl.pathname === '/'
  const isOnboardingRoute = request.nextUrl.pathname.startsWith('/onboarding')

  // The Admin portal is fully separate, with its own login and its own
  // server-side role check in admin-portal/(portal)/layout.tsx.
  const isAdminPortalLogin = request.nextUrl.pathname.startsWith('/admin-portal/login')
  const isAdminPortalArea = request.nextUrl.pathname.startsWith('/admin-portal')

  if (isAdminPortalArea) {
    if (!user && !isAdminPortalLogin) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin-portal/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  if (!user && !isAuthRoute && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Role-based routing: reporters ("user") get /user/*, Administration
  // staff get /administration/*. Neither can reach the other's area.
  let role: string | null = null
  let staffStatus: string | null = null
  if (user) {
    try {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      role = profile?.role ?? null

      if (role === 'administration') {
        const { data: staff } = await supabase
          .from('administration_staff')
          .select('status')
          .eq('user_id', user.id)
          .maybeSingle()
        staffStatus = staff?.status ?? 'pending'
      }
    } catch (e) {
      console.warn('Middleware role check fallback:', e)
    }
  }

  const homeForRole = (r: string | null) => {
    if (r === 'admin') return '/admin-portal/dashboard'
    if (r === 'administration' && staffStatus === 'approved') return '/administration/dashboard'
    if (r === 'user') return '/user/dashboard'
    return null
  }

  const isUserArea = request.nextUrl.pathname.startsWith('/user')
  const isAdministrationArea = request.nextUrl.pathname.startsWith('/administration')

  if (user && (isAuthRoute || request.nextUrl.pathname === '/')) {
    const target = homeForRole(role)
    if (target) {
      const url = request.nextUrl.clone()
      url.pathname = target
      return NextResponse.redirect(url)
    }
  }

  if (user && role === 'user' && isAdministrationArea) {
    const url = request.nextUrl.clone()
    url.pathname = '/user/dashboard'
    url.searchParams.set('error', 'This area is for Administration staff only.')
    return NextResponse.redirect(url)
  }

  if (user && role === 'administration' && isUserArea) {
    const url = request.nextUrl.clone()
    url.pathname = '/administration/dashboard'
    url.searchParams.set('error', 'This area is for reporters only.')
    return NextResponse.redirect(url)
  }

  if (user && role === 'administration' && staffStatus !== 'approved' && isAdministrationArea) {
    const url = request.nextUrl.clone()
    url.pathname = '/pending-approval'
    return NextResponse.redirect(url)
  }

  if (user && !role && !isOnboardingRoute && (isUserArea || isAdministrationArea)) {
    const url = request.nextUrl.clone()
    url.pathname = '/onboarding'
    return NextResponse.redirect(url)
  }

  const isPendingApprovalRoute = request.nextUrl.pathname.startsWith('/pending-approval')

  // If an administration user is already approved (or has no staff row, which defaults to approved),
  // redirect them away from the pending page directly to their dashboard.
  if (user && role === 'administration' && staffStatus === 'approved' && isPendingApprovalRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/administration/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
