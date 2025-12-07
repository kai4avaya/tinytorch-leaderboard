import { createClient } from '@/utils/supabase/server'
import { LoginForm } from './login-form'
import { RedirectWithMessage } from './redirect-with-message'
import { LocationDetector } from '@/components/location-detector'

export default async function CLILoginPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    redirect_port?: string; 
    redirect_to?: string; 
    error?: string; 
    message?: string;
    email?: string;
    name?: string;
    affiliation?: string;
  }>
}) {
  const params = await searchParams
  const redirectPort = params.redirect_port
  const redirectTo = params.redirect_to
  const initialEmail = params.email
  const initialName = params.name
  const initialAffiliation = params.affiliation

  if (!redirectPort && !redirectTo) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-semibold text-black dark:text-zinc-50">
              CLI Authentication
            </h1>
            <p className="text-red-600 dark:text-red-400">
              Missing redirect_port or redirect_to parameter
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
    // User is already authenticated, get session
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      let finalUrl: URL
      
      if (redirectTo) {
        finalUrl = new URL(redirectTo)
      } else {
        // Fallback to constructing URL from port
        finalUrl = new URL(`http://127.0.0.1:${redirectPort}/callback`)
      }

      finalUrl.searchParams.set('access_token', session.access_token)
      finalUrl.searchParams.set('refresh_token', session.refresh_token)
      if (session.expires_at) {
        finalUrl.searchParams.set('expires_at', session.expires_at.toString())
      }
      if (user.email) {
        finalUrl.searchParams.set('email', user.email)
      }

      // Render the RedirectWithMessage component with location detection
      return (
        <>
          <LocationDetector userId={user.id} />
          <RedirectWithMessage redirectUrl={finalUrl.toString()} />
        </>
      )
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <LoginForm 
        redirectPort={redirectPort || ''} 
        redirectTo={redirectTo}
        initialError={params.error}
        initialMessage={params.message}
        initialEmail={initialEmail}
        initialName={initialName}
        initialAffiliation={initialAffiliation}
      />
    </div>
  )
}
