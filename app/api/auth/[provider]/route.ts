import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'
import { Provider } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const supabase = await createClient()
  
  // 1. Get the 'next' destination
  const { searchParams } = new URL(request.url)
  // Support both 'returnTo' (from prompt) and 'next' (common convention)
  const returnTo = searchParams.get('returnTo') || searchParams.get('next') || '/'
  
  // 2. Validate provider (basic check)
  const validProviders = ['google', 'github']
  if (!validProviders.includes(provider)) {
    return new Response('Invalid provider', { status: 400 })
  }

  // 3. Start the OAuth flow
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as Provider,
    options: {
      // The redirectTo MUST be your Next.js callback route
      // We pass the final destination (returnTo) as a query param 'next' to the callback
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback?next=${encodeURIComponent(returnTo)}`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    console.error('OAuth error:', error)
    return new Response('OAuth failed: ' + error.message, { status: 500 })
  }

  if (data.url) {
    redirect(data.url) 
  }

  return new Response('OAuth redirect failed', { status: 500 })
}
