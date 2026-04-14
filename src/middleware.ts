import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const url = req.nextUrl.clone();

  // If user is logged in and tries to access dashboard but hasn't finished onboarding
  if (session && !url.pathname.startsWith('/onboarding') && !url.pathname.startsWith('/api')) {
    const { data: company } = await supabase
      .from('companies')
      .select('onboarding_step')
      .eq('owner_id', session.user.id)
      .single();

    if (company && (!company.onboarding_step || company.onboarding_step < 4)) {
      url.pathname = '/onboarding';
      return NextResponse.redirect(url);
    }
  }

  // If user is not logged in and tries to access protected routes
  const protectedRoutes = ['/overview', '/employees', '/attendance', '/reports', '/billing', '/onboarding'];
  if (!session && protectedRoutes.some(route => url.pathname.startsWith(route))) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
