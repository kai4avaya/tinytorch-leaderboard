import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { LoginForm } from './login-form'
import { ProfileForm } from './profile-form'

export default async function CLILoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_port?: string; error?: string; message?: string }>
}) {
  const params = await searchParams
  const redirectPort = params.redirect_port

  if (!redirectPort) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-semibold text-black dark:text-zinc-50">
              CLI Authentication
            </h1>
            <p className="text-red-600 dark:text-red-400">
              Missing redirect_port parameter
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Check if user is already logged in
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Check if user has a profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()

    // If no profile or no username, show profile creation
    if (!profile || !profile.username) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <ProfileForm redirectPort={redirectPort} user={user} />
        </div>
      )
    }

    // User is authenticated and has profile, get session and redirect
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const localhostUrl = new URL(`http://127.0.0.1:${redirectPort}/callback`)
      localhostUrl.searchParams.set('access_token', session.access_token)
      localhostUrl.searchParams.set('refresh_token', session.refresh_token)
      if (session.expires_at) {
        localhostUrl.searchParams.set('expires_at', session.expires_at.toString())
      }
      if (user.email) {
        localhostUrl.searchParams.set('email', user.email)
      }
      redirect(localhostUrl.toString())
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <LoginForm 
        redirectPort={redirectPort} 
        initialError={params.error}
        initialMessage={params.message}
      />
    </div>
  )
}