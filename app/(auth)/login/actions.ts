'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getUrl } from '@/utils/config'
import { detectLocation, updateProfileLocation } from '@/lib/location-service'

interface Credentials {
  email: string
  password: string
}

function getCredentials(formData: FormData): Credentials {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/login?error=' + encodeURIComponent('Email and password are required'))
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
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const credentials = getCredentials(formData)

  const { data, error } = await supabase.auth.signUp(credentials)

  if (error) {
    console.error('Signup error:', error)
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  // If signup returns immediate session (auto-confirm enabled), detect location
  if (data.session && data.user?.id) {
    const location = await detectLocation()
    if (location) {
      await updateProfileLocation(data.user.id, location, supabase)
    }
    revalidatePath('/', 'layout')
    redirect('/dashboard')
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
