import { createServerClient } from '@supabase/ssr'
import { createClient as createStandardClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * Create a Supabase client that can use either:
 * 1. Cookies (for Next.js browser requests) - uses SSR client
 * 2. Bearer token (for external clients like CLI/Colab) - uses standard client
 * 
 * For Bearer tokens, the client will use the token in Authorization header.
 * RLS policies will read auth.uid() from the JWT token automatically.
 */
export async function createClientWithToken(token?: string) {
  // If token is provided, use standard client with Bearer token (for external clients)
  if (token) {
    // Create client with token in Authorization header
    // Supabase will automatically use this for RLS auth.uid() checks
    return createStandardClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          persistSession: false, // Don't persist session in server context
          autoRefreshToken: false, // Don't auto-refresh in server context
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )
  }

  // Otherwise, use cookie-based auth (for Next.js browser requests)
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
