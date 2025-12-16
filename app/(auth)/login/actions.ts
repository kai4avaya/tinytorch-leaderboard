'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getUrl, ALLOWED_ORIGINS } from '@/utils/config'
import { detectLocation, updateProfileLocation } from '@/lib/location-service'

interface Credentials {
  email: string
  password: string
}

function redirectWithError(message: string, formData: FormData) {
  const redirectTo = formData.get('redirect_to') as string
  let url = `/login?error=${encodeURIComponent(message)}`
  if (redirectTo) {
    url += `&redirect_to=${encodeURIComponent(redirectTo)}`
  }
  redirect(url)
}

function getRedirectPath(formData: FormData): string {
  const redirectPath = formData.get('redirect_to') as string

  if (!redirectPath) {
    return '/'
  }

  // Check if it's an allowed absolute URL
  const isAllowedOrigin = ALLOWED_ORIGINS.some(origin => redirectPath.startsWith(origin))
  if (isAllowedOrigin) {
    return redirectPath
  }

  // Basic security check: ensure it starts with / and doesn't contain protocol relative URL (//)
  if (redirectPath.startsWith('/') && !redirectPath.startsWith('//')) {
    return redirectPath
  }
  return '/'
}

function getCredentials(formData: FormData): Credentials {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    redirectWithError('Email and password are required', formData)
  }

  return {
    email,
    password,
  }
}

export async function login(formData: FormData) {
  const supabase = await createClient()
  const credentials = getCredentials(formData)

  const { error } = await supabase.auth.signInWithPassword(credentials)

  if (error) {
    console.error('Login error:', error)
    redirectWithError(error.message, formData)
  }

  revalidatePath('/', 'layout')
  redirect(getRedirectPath(formData))
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const credentials = getCredentials(formData)
  
  const redirectPath = getRedirectPath(formData)
  const emailRedirectTo = getUrl(`/auth/confirm?next=${encodeURIComponent(redirectPath)}`)

  const { data, error } = await supabase.auth.signUp({
    ...credentials,
    options: {
      emailRedirectTo,
    },
  })

  if (error) {
    console.error('Signup error:', error)
    redirectWithError(error.message, formData)
  }

  // If signup returns immediate session (auto-confirm enabled), detect location
  if (data.session && data.user?.id) {
    const locationData = await detectLocation()
    if (locationData) {
      await updateProfileLocation(data.user.id, locationData, supabase)
    }
    revalidatePath('/', 'layout')
    redirect(redirectPath)
  }

  redirect('/login?message=Check your email to confirm your account')
}

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get('email') as string

  if (!email) {
    redirect('/login?error=' + encodeURIComponent('Email is required'))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getUrl('/auth/reset-password'),
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/login?message=' + encodeURIComponent('Password reset email sent. Check your inbox.'))
}
