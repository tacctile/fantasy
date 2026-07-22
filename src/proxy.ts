import { NextResponse, type NextRequest } from 'next/server'

import { createServerClient } from '@supabase/ssr'

import type { Database } from '@/lib/supabase/database.types'

/**
 * Session-refresh proxy (Next 16 convention, replaces middleware.ts): Server
 * Components can read auth cookies but never write them, so refreshed tokens
 * must be persisted here on every matched request — without this, refresh
 * token rotation eventually signs the owner out mid-session.
 *
 * Also the first wall for the owner surface: an unauthenticated hit on
 * /leagues/* bounces to /login before any admin route renders (Access Model,
 * MASTER_CONTEXT.md). The (admin) layout gate and per-table RLS are the walls
 * behind it. /api is excluded from the matcher entirely — cron routes carry
 * their own Bearer-secret auth and must stay isolated from cookie plumbing.
 */
export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Revalidates the JWT and rotates the refresh token when due — the entire
  // reason this proxy exists. Do not remove or reorder below the redirect.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user === null && request.nextUrl.pathname.startsWith('/leagues')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    const redirect = NextResponse.redirect(url)
    // Carry any freshly rotated session cookies onto the redirect response.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    return redirect
  }

  return response
}

export const config = {
  matcher: ['/((?!api/|_next/static|_next/image|favicon\\.ico).*)'],
}
