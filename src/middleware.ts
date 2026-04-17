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

  // 0. Cloudflare Zero-Bypass WAF Protector
  // Prevents Host-Header Injection by forcing all traffic to prove it passed through Cloudflare's secure proxy
  const proxySecret = process.env.CLOUDFLARE_PROXY_SECRET;
  if (proxySecret && process.env.NODE_ENV === "production") {
    if (request.headers.get("x-saas-proxy-auth") !== proxySecret) {
       return new NextResponse("Access Denied: Direct origin routing prohibited. Please connect via app.yawmy", { status: 403 });
    }
  }

  // 1. Subdomain Check: sadmin.yawmy.app or sadmin.localhost
  if (hostname.startsWith("sadmin.") && !url.pathname.startsWith("/api")) {
    if (!url.pathname.startsWith("/sadmin")) {
      url.pathname = `/sadmin${url.pathname === "/" ? "" : url.pathname}`;
      response = NextResponse.rewrite(url);
    }
  }

  // 1b. Subdomain Check: team.yawmy.app or team.localhost
  if (hostname.startsWith("team.") && !url.pathname.startsWith("/api")) {
    if (!url.pathname.startsWith("/team")) {
      url.pathname = `/team${url.pathname === "/" ? "" : url.pathname}`;
      response = NextResponse.rewrite(url);
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

  // 2b. Protect Team Routes
  if (url.pathname.startsWith("/team") && !url.pathname.startsWith("/team/login")) {
    const teamSession = request.cookies.get("team_session");
    if (!teamSession) {
      url.pathname = "/team/login";
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

  // Skip Supabase Auth for team portal (uses custom session)
  if (url.pathname.startsWith("/team")) {
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

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

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
      const onbDone = request.cookies.get('onb_done')?.value;
      
      if (!onbDone) {
        // Cache completely missed. Query database and set the cache limit to avoid spamming the DB pool.
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('onboarding_step')
          .eq('owner_id', user.id)
          .single();

        if (!companyError && company) {
           if (!company.onboarding_step || company.onboarding_step < 4) {
             if (!url.pathname.startsWith('/onboarding')) {
               url.pathname = '/onboarding';
               return NextResponse.redirect(url);
             }
           } else {
             // They finished onboarding! Inject 'onb_done=1' instantly so we never do this DB check on this device again.
             response.cookies.set('onb_done', '1', { path: '/', maxAge: 30 * 24 * 60 * 60 });
           }
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
