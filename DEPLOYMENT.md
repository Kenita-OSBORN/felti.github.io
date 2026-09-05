# Felti Deployment Setup

Felti is now prepared for a GitHub + Vercel + Supabase deployment path.

## Stack

- GitHub: source repository
- Vercel: Next.js hosting
- Supabase Auth: customer registration, login, logout, session persistence
- Supabase Postgres: profiles, saved designs, uploads metadata, cart items, orders
- Supabase Storage: avatar images, custom bases, custom decoration uploads

## Supabase Setup

1. Create a Supabase project.
2. Open the SQL editor and run `supabase/migrations/0001_dotti_core.sql`.
3. Confirm the `dotti-uploads` storage bucket exists.
4. In Authentication settings, choose whether email confirmation is required.
   - For the current one-step registration journey, disable email confirmation.
   - If email confirmation stays enabled, registration will create the account but users must confirm before logging in.

## Environment Variables

Copy `.env.example` to `.env.local` for local development:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Set the same variables in Vercel Project Settings.

Never expose `SUPABASE_SERVICE_ROLE_KEY` in browser code. It is used only by server route handlers.

## Vercel

Recommended settings:

- Framework preset: Next.js
- Install command: `pnpm install`
- Build command: `pnpm build`
- Output directory: leave blank

## Local Commands

```bash
pnpm install
pnpm dev
pnpm build
```

## Notes

The Felti UI still talks to `/api/dotti`, so the current pages do not need visual changes. That API now uses Supabase instead of the earlier Cloudflare D1 prototype path.
