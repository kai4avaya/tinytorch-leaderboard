'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { CLI_LOGIN_URL, getUrl } from '@/utils/config'

function redirectToCLILogin(redirectPort: string, error?: string) {
  const url = new URL(CLI_LOGIN_URL)
  url.searchParams.set('redirect_port', redirectPort)
  if (error) {
    url.searchParams.set('error', error)
  }
  redirect(url.toString())
}

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

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectPort = formData.get('redirect_port') as string

  if (!email || !password) {
    redirectToCLILogin(redirectPort, 'Email and password are required')
  }

  if (!redirectPort) {
    redirectToCLILogin('', 'Missing redirect_port')
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirectToCLILogin(redirectPort, error.message)
  }

  if (!data.session) {
    redirectToCLILogin(redirectPort, 'Failed to create session')
  }

  redirectToLocalhost(redirectPort, data.session, data.user)
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectPort = formData.get('redirect_port') as string

  if (!email || !password) {
    redirectToCLILogin(redirectPort, 'Email and password are required')
  }

  if (!redirectPort) {
    redirectToCLILogin('', 'Missing redirect_port')
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    redirectToCLILogin(redirectPort, error.message)
  }

  // Check if email confirmation is required
  if (data.user && !data.session) {
    // Email confirmation required - Supabase sends confirmation email
    redirectToCLILogin(redirectPort, 'Please check your email to confirm your account before signing in')
  }

  // If session exists (email confirmation disabled), redirect with tokens
  if (data.session) {
    redirectToLocalhost(redirectPort, data.session, data.user)
  }

  // Fallback
  redirectToCLILogin(redirectPort, 'Account created. Please check your email to confirm your account.')
}

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get('email') as string
  const redirectPort = formData.get('redirect_port') as string

  if (!email) {
    redirectToCLILogin(redirectPort || '', 'Email is required')
  }

  if (!redirectPort) {
    redirectToCLILogin('', 'Missing redirect_port')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getUrl('/auth/reset-password'),
  })

  if (error) {
    redirectToCLILogin(redirectPort, error.message)
  }

  redirectToCLILogin(redirectPort, 'Password reset email sent. Check your inbox.')
}
