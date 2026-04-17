import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { getUserTenantId, isConsultant } from '@/lib/supabase/auth';

function isLoginRoute(pathname) {
  return pathname === '/login';
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const { supabase, response } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (isLoginRoute(pathname)) {
      return response;
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';

    if (pathname !== '/') {
      redirectUrl.searchParams.set('next', pathname);
    }

    return NextResponse.redirect(redirectUrl);
  }

  const tenantId = getUserTenantId(user);
  const consultant = isConsultant(user);

  if ((!tenantId || !consultant) && !isLoginRoute(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(redirectUrl);
  }

  if (isLoginRoute(pathname) && consultant && tenantId) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
