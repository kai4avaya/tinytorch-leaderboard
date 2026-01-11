import { createClient } from '@/utils/supabase/server'
import { LoginForm } from './login-form'
import { RedirectWithMessage } from './redirect-with-message'
import { LocationDetector } from '@/components/location-detector'
import { ProfileForm } from './profile-form'
import { SessionSyncer } from '@/components/session-syncer'

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
    test_ui?: string;
    access_token?: string;
    refresh_token?: string;
  }>
}) {
  const params = await searchParams
  const redirectPortParam = params.redirect_port
  const redirectTo = params.redirect_to
  const accessToken = params.access_token
  const refreshToken = params.refresh_token
  const initialEmail = params.email
  const initialName = params.name
  const initialAffiliation = params.affiliation
  const isTestUI = params.test_ui === 'true'

  let redirectPort = redirectPortParam

  // Extract port from redirectTo if missing
  if (!redirectPort && redirectTo) {
    try {
      const url = new URL(redirectTo)
      if (url.port) {
        redirectPort = url.port
      }
    } catch (e) {
      // ignore invalid URL
    }
  }

  // 1. Session Restoration (Priority)
  // If we have tokens in the URL (from OAuth callback), sync them first.
  if (accessToken && refreshToken) {
    return <SessionSyncer accessToken={accessToken} refreshToken={refreshToken} />
  }

  if (isTestUI) {    // Test Mode: Render ProfileForm directly (it handles its own layout)
    return (
        <ProfileForm 
          redirectPort={redirectPort || '9999'}
          user={{ id: 'test-id', user_metadata: { full_name: 'Demo User' } }}
          initialProfile={{}}
        />
    )
  }

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
      // Check profile completeness
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      const hasLocation = profile?.location && profile.location.trim().length > 0
      const hasInstitution = profile?.institution && profile.institution.length > 0
      // Check full_name as the form uses it for "Display Name"
      const hasName = profile?.full_name && profile.full_name.trim().length > 0

      if (!hasLocation || !hasInstitution || !hasName) {
        // Incomplete Profile: Render Form (Full Screen Layout)
        return (
            <ProfileForm 
              redirectPort={redirectPort || ''}
              redirectTo={redirectTo}
              user={user}
              initialProfile={profile}
            />
        )
      }

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

  // Not logged in: Render Login Form (Centered)
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