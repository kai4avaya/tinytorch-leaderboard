import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    // This exchanges the code for a real login session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data?.session) {
      // Logic from app/auth/confirm/route.ts to handle CLI redirects
      const isAbsoluteUrl = next.startsWith('http')
      let finalRedirectUrl: URL

      if (isAbsoluteUrl) {
         finalRedirectUrl = new URL(next)
         // Ensure no code parameter leaks
         finalRedirectUrl.searchParams.delete('code')
         
         // Append tokens for CLI or external apps that need them in URL
         finalRedirectUrl.searchParams.set('access_token', data.session.access_token)
         finalRedirectUrl.searchParams.set('refresh_token', data.session.refresh_token)
         if (data.session.expires_at) finalRedirectUrl.searchParams.set('expires_at', data.session.expires_at.toString())
         if (data.user?.email) finalRedirectUrl.searchParams.set('email', data.user.email)
      } else {
         finalRedirectUrl = new URL(request.url)
         finalRedirectUrl.pathname = next
         finalRedirectUrl.searchParams.delete('code')
         finalRedirectUrl.searchParams.delete('next')
      }

      return NextResponse.redirect(finalRedirectUrl)
    }
  }

  // Return the user to an error page with instructions
  const errorUrl = new URL(request.url)
  errorUrl.pathname = '/cli-login'
  errorUrl.searchParams.set('error', 'Authentication failed')
  return NextResponse.redirect(errorUrl)
}
