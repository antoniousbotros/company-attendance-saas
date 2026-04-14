import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Use getUser() for security as it validates the session with the server
  const { data: { user } } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  // Protected routes list
  const protectedRoutes = ['/overview', '/employees', '/attendance', '/reports', '/billing', '/onboarding'];
  const isProtectedRoute = protectedRoutes.some(route => url.pathname.startsWith(route));

  // 1. If no user and trying to access protected route -> Login
  if (!user && isProtectedRoute) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 2. If user exists, check onboarding
  if (user && !url.pathname.startsWith('/api') && !url.pathname.startsWith('/_next')) {
    const { data: company } = await supabase
      .from('companies')
      .select('onboarding_step')
      .eq('owner_id', user.id)
      .single();

    // If company hasn't finished onboarding and not already on onboarding page -> Onboarding
    if (company && (!company.onboarding_step || company.onboarding_step < 4) && !url.pathname.startsWith('/onboarding')) {
      url.pathname = '/onboarding';
      return NextResponse.redirect(url);
    }

    // If user is logged in and tries to access login/signup -> Dashboard
    if (url.pathname === '/login' || url.pathname === '/signup') {
      url.pathname = '/overview';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
