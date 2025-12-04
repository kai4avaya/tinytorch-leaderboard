import { type EmailOtpType } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  // Create the redirect URL
  const redirectTo = request.nextUrl.clone()
  
  // Handle next URLs that might contain query parameters
  if (next.includes('?')) {
    const [path, query] = next.split('?')
    redirectTo.pathname = path
    const nextParams = new URLSearchParams(query)
    nextParams.forEach((value, key) => {
      redirectTo.searchParams.set(key, value)
    })
  } else {
    redirectTo.pathname = next
  }

  // Handle PKCE flow (code exchange)
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Successful exchange - redirect to next
      if (!next.includes('cli-login') && (redirectTo.pathname === '/' || redirectTo.pathname === '/login')) {
        redirectTo.pathname = '/login'
        redirectTo.searchParams.set('message', 'Email confirmed successfully')
      } else {
        // For CLI login, we just want to go back to the page, 
        // the page will handle the session check and redirect
        redirectTo.searchParams.set('message', 'Email confirmed successfully')
      }
      return NextResponse.redirect(redirectTo)
    }
    // If code exchange fails, fall through to error
  }

  // Handle Token Hash flow (Implicit/Magic Link)
  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      // Handle different types of confirmations
      if (type === 'recovery') {
        // Password reset - redirect to password update page
        redirectTo.pathname = '/auth/reset-password'
        return NextResponse.redirect(redirectTo)
      } else if (type === 'email') {
        // Email confirmation
        // Only default to /login if we aren't being sent somewhere specific (like cli-login)
        if (!next.includes('cli-login') && (redirectTo.pathname === '/' || redirectTo.pathname === '/login')) {
          redirectTo.pathname = '/login'
        }
        redirectTo.searchParams.set('message', 'Email confirmed successfully')
        return NextResponse.redirect(redirectTo)
      }
      // Default redirect
      return NextResponse.redirect(redirectTo)
    }
  }

  // Error - redirect to error page
  redirectTo.pathname = '/login'
  redirectTo.searchParams.set('error', 'Invalid or expired confirmation link')
  return NextResponse.redirect(redirectTo)
}
