import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host") || "";

  // 1. Subdomain Check: sadmin.yawmy.app or sadmin.localhost
  // 1. Subdomain Check: sadmin.yawmy.app or sadmin.localhost
  if (hostname.startsWith("sadmin.") && !url.pathname.startsWith("/api")) {
    // If they are not already accessing the /sadmin path under the hood
    if (!url.pathname.startsWith("/sadmin")) {
      url.pathname = `/sadmin${url.pathname === "/" ? "" : url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // 2. Protect Sadmin Routes
  if (url.pathname.startsWith("/sadmin") && !url.pathname.startsWith("/sadmin/login")) {
    const sadminSession = request.cookies.get("sadmin_session");
    if (!sadminSession) {
      url.pathname = "/sadmin/login";
      return NextResponse.redirect(url);
    }
  }

  // Basic check to see if we have URLs
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Middleware Error: Missing Supabase Environment Variables");
    return response;
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options });
            response = NextResponse.next({ request: { headers: request.headers } });
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: '', ...options });
            response = NextResponse.next({ request: { headers: request.headers } });
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

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
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('onboarding_step')
        .eq('owner_id', user.id)
        .single();

      if (!companyError && company) {
         // If company hasn't finished onboarding and not already on onboarding page -> Onboarding
         if ((!company.onboarding_step || company.onboarding_step < 4) && !url.pathname.startsWith('/onboarding')) {
           url.pathname = '/onboarding';
           return NextResponse.redirect(url);
         }
      }

      // If user is logged in and tries to access login/signup -> Dashboard
      if (url.pathname === '/login' || url.pathname === '/signup') {
        url.pathname = '/overview';
        return NextResponse.redirect(url);
      }
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Middleware Critical Failure:", message);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
