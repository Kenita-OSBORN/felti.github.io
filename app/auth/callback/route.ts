import { NextResponse, type NextRequest } from 'next/server';

import { applySupabaseCookies, createSupabaseRouteClient } from '@/lib/supabase/server';
import { hasSupabaseEnv } from '@/lib/supabase/env';

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/account';
  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const next = safeNextPath(requestUrl.searchParams.get('next'));
  const redirectUrl = new URL(next, requestUrl.origin);
  const cookiesToSet: Parameters<typeof applySupabaseCookies>[1] = [];

  if (!hasSupabaseEnv()) {
    return NextResponse.redirect(redirectUrl);
  }

  const code = requestUrl.searchParams.get('code');
  if (code) {
    const supabase = createSupabaseRouteClient(request, cookiesToSet);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('error', 'auth_callback_failed');
    }
  } else {
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('error', 'missing_auth_code');
  }

  return applySupabaseCookies(NextResponse.redirect(redirectUrl), cookiesToSet);
}
