import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { CookieOptions } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';

import { requireSupabaseEnv } from '@/lib/supabase/env';

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export function createSupabaseRouteClient(request: NextRequest, cookiesToSet: CookieToSet[]) {
  const { url, publishableKey } = requireSupabaseEnv();
  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        cookiesToSet.push(...cookies);
      },
    },
  });
}

export function createSupabaseAdminClient() {
  const { url, serviceRoleKey } = requireSupabaseEnv();
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function applySupabaseCookies(response: NextResponse, cookiesToSet: CookieToSet[]) {
  for (const cookie of cookiesToSet) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }
  return response;
}
