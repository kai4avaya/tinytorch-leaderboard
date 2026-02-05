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
      const isAbsoluteUrl = next.startsWith('http')
      
      // Check if this is a CLI redirect (localhost or 127.0.0.1)
      const isCLIRedirect = isAbsoluteUrl && (next.includes('127.0.0.1') || next.includes('localhost'))

      if (isCLIRedirect) {
        // Intercept: Send to the cli-login page first to enforce the Profile Guard
        const guardUrl = new URL(request.url)
        guardUrl.pathname = '/cli-login'
        guardUrl.searchParams.set('redirect_to', next)
        
        // Pass tokens to allow client-side session restoration (robust against cookie failures)
        guardUrl.searchParams.set('access_token', data.session.access_token)
        guardUrl.searchParams.set('refresh_token', data.session.refresh_token)
        
        // Clean up other params
        guardUrl.searchParams.delete('code')
        guardUrl.searchParams.delete('next')
        return NextResponse.redirect(guardUrl)
      }

      let finalRedirectUrl: URL
      try {
        finalRedirectUrl = new URL(next, request.url)
      } catch {
        finalRedirectUrl = new URL('/', request.url)
      }

      // Append tokens for ROBUST session syncing (Client-side hydration)
      // This fixes issues where server-side cookies are lost during redirect in some environments (e.g. Netlify)
      finalRedirectUrl.searchParams.set('access_token', data.session.access_token)
      finalRedirectUrl.searchParams.set('refresh_token', data.session.refresh_token)
      if (data.session.expires_at) finalRedirectUrl.searchParams.set('expires_at', data.session.expires_at.toString())
      if (data.user?.email) finalRedirectUrl.searchParams.set('email', data.user.email)
      
      // Clean up params
      finalRedirectUrl.searchParams.delete('code')
      // Note: 'next' is consumed by constructing finalRedirectUrl, so we don't need to forward it as a param unless intended.

      return NextResponse.redirect(finalRedirectUrl)
    }
  }

  // Authentication failed (code invalid or expired)
  const errorUrl = new URL(request.url)
  const isCLIError = next.includes('localhost') || next.includes('127.0.0.1')
  
  errorUrl.pathname = isCLIError ? '/cli-login' : '/login'
  errorUrl.searchParams.set('error', 'Authentication failed. Link may be expired.')
  
  // Clean up params that might confuse the destination
  errorUrl.searchParams.delete('code')
  
  return NextResponse.redirect(errorUrl)
}
