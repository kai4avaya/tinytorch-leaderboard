'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { CLI_LOGIN_URL, getUrl } from '@/utils/config'

// Supabase Edge Function endpoint for profile updates
const UPDATE_PROFILE_EDGE_FUNCTION_URL = 'https://zrvmjrxhokwwmjacyhpq.supabase.co/functions/v1/update-profile'

function redirectToLocalhost(redirectPort: string, session: any, user: any) {
  const localhostUrl = new URL(`http://127.0.0.1:${redirectPort}/callback`)
  localhostUrl.searchParams.set('access_token', session.access_token)
  localhostUrl.searchParams.set('refresh_token', session.refresh_token)
  if (session.expires_at) {
    localhostUrl.searchParams.set('expires_at', session.expires_at.toString())
  }
  if (user?.email) {
    localhostUrl.searchParams.set('email', user.email)
  }
  redirect(localhostUrl.toString())
}

function redirectToCLILogin(redirectPort: string, error?: string) {
  const url = new URL(CLI_LOGIN_URL)
  url.searchParams.set('redirect_port', redirectPort)
  if (error) {
    url.searchParams.set('error', error)
  }
  redirect(url.toString())
}

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectPort = formData.get('redirect_port') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  if (!redirectPort) {
    return { error: 'Missing redirect_port' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  if (!data.session) {
    return { error: 'Failed to create session' }
  }

  revalidatePath('/cli-login')
  redirectToCLILogin(redirectPort)
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectPort = formData.get('redirect_port') as string
  // The frontend should pass the full local callback URL if available
  const redirectTo = formData.get('redirect_to') as string 

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  // Determine the email confirmation redirect URL
  let emailRedirectTo: string;

  if (redirectTo) {
    // IF the CLI sent the full URL (e.g. http://127.0.0.1:54321/callback)
    // We tell Supabase to redirect the user there after email confirmation.
    // Note: Supabase must have this URL pattern allowed in "Redirect URLs"
    emailRedirectTo = redirectTo
  } else if (redirectPort) {
    // Legacy/Fallback support for just the port
    const nextPath = `/cli-login?redirect_port=${redirectPort}`
    emailRedirectTo = getUrl(`/auth/confirm?next=${encodeURIComponent(nextPath)}`)
  } else {
    return { error: 'Missing redirect_to or redirect_port' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user && !data.session) {
    return { 
      success: true, 
      message: 'Please check your email to confirm your account. Once confirmed, you will be redirected automatically.' 
    }
  }

  if (data.session) {
    // Auto-confirmed or existing session
    if (redirectTo) {
        // If we have a direct URL, redirect there with tokens
        const finalUrl = new URL(redirectTo)
        finalUrl.searchParams.set('access_token', data.session.access_token)
        finalUrl.searchParams.set('refresh_token', data.session.refresh_token)
        if (data.session.expires_at) finalUrl.searchParams.set('expires_at', data.session.expires_at.toString())
        if (data.user && data.user.email) finalUrl.searchParams.set('email', data.user.email)
        redirect(finalUrl.toString())
    } else {
        revalidatePath('/cli-login')
        redirectToCLILogin(redirectPort)
    }
  }

  return { 
    success: true, 
    message: 'Account created. Please check your email to confirm your account.' 
  }
}

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get('email') as string
  const redirectPort = formData.get('redirect_port') as string

  if (!email) {
    return { error: 'Email is required' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getUrl('/auth/reset-password'),
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: 'Password reset email sent. Check your inbox.' }
}

// Profile actions are kept for potential future use but are not used in the current flow
export async function updateProfile(formData: FormData) {
  const redirectPort = formData.get('redirect_port') as string
  const username = formData.get('username') as string
  const fullName = formData.get('full_name') as string
  const institution = formData.get('institution') as string
  const location = formData.get('location') as string
  const website = formData.get('website') as string
  const summary = formData.get('summary') as string
  const avatarUrl = formData.get('avatar_url') as string
  
  if (!redirectPort) {
    return { error: 'Missing redirect_port' }
  }

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated: Session not found.' }
  }

  const accessToken = session.access_token
  
  const profileData: Record<string, any> = {
    username: username || undefined,
    full_name: fullName || undefined,
    institution: institution ? [institution] : undefined, 
    location: location || undefined,
    website: website ? [website] : undefined, 
    summary: summary || undefined,
    avatar_url: avatarUrl || undefined,
  }

  const filteredProfileData = Object.fromEntries(
    Object.entries(profileData).filter(([, value]) => value !== undefined)
  )

  try {
    const response = await fetch(UPDATE_PROFILE_EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(filteredProfileData),
    })

    const result = await response.json()

    if (!response.ok) {
      return { error: result.error || 'Failed to update profile via Edge Function' }
    }

    redirectToLocalhost(redirectPort, session, session.user)
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred during profile update.' }
  }
}

export async function skipProfile(formData: FormData) {
  const redirectPort = formData.get('redirect_port') as string
  const location = formData.get('location') as string

  if (!redirectPort) {
    return { error: 'Missing redirect_port' }
  }

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated: Session not found.' }
  }

  const accessToken = session.access_token

  const profileData = {
    institution: ['Independent'],
    location: location || 'Independent',
  }

  try {
    const response = await fetch(UPDATE_PROFILE_EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(profileData),
    })

    const result = await response.json()

    if (!response.ok) {
      return { error: result.error || 'Failed to skip profile via Edge Function' }
    }
    
    redirectToLocalhost(redirectPort, session, session.user)
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred during profile skip.' }
  }
}
