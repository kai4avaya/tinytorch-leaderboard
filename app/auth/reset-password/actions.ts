'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || !confirmPassword) {
    redirect('/auth/reset-password?error=' + encodeURIComponent('Both password fields are required'))
  }

  if (password !== confirmPassword) {
    redirect('/auth/reset-password?error=' + encodeURIComponent('Passwords do not match'))
  }

  if (password.length < 6) {
    redirect('/auth/reset-password?error=' + encodeURIComponent('Password must be at least 6 characters'))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    redirect('/auth/reset-password?error=' + encodeURIComponent(error.message))
  }

  const redirectPort = formData.get('redirect_port') as string
  if (redirectPort) {
    if (redirectPort.startsWith('http')) {
      redirect(`/login?redirect_to=${encodeURIComponent(redirectPort)}&message=${encodeURIComponent('Password updated successfully. Please sign in.')}`)
    }
    redirect(`/cli-login?redirect_port=${redirectPort}&message=${encodeURIComponent('Password updated successfully. Please continue to log in.')}`)
  }

  redirect('/login?message=' + encodeURIComponent('Password updated successfully. Please sign in.'))
}
