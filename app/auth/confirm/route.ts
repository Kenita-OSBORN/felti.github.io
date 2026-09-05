import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

import { hasSupabaseEnv } from '@/lib/supabase/env';
import { applySupabaseCookies, createSupabaseRouteClient } from '@/lib/supabase/server';

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/account';
  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null;
  const next = safeNextPath(requestUrl.searchParams.get('next'));
  const redirectUrl = new URL(next, requestUrl.origin);
  const cookiesToSet: Parameters<typeof applySupabaseCookies>[1] = [];

  if (!hasSupabaseEnv()) {
    return NextResponse.redirect(redirectUrl);
  }

  if (tokenHash && type) {
    const supabase = createSupabaseRouteClient(request, cookiesToSet);
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return applySupabaseCookies(NextResponse.redirect(redirectUrl), cookiesToSet);
    }
  }

  redirectUrl.pathname = '/login';
  redirectUrl.searchParams.set('error', 'email_confirmation_failed');
  return applySupabaseCookies(NextResponse.redirect(redirectUrl), cookiesToSet);
}
