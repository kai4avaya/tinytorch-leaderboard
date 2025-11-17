import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { login, signup, requestPasswordReset } from './actions'

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
    // User is already authenticated, get session and redirect
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
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="mb-6 text-2xl font-semibold text-black dark:text-zinc-50">
          CLI Authentication
        </h1>

        {/* Error Message */}
        {params.error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
            <p className="text-sm text-red-800 dark:text-red-400">
              {params.error}
            </p>
          </div>
        )}

        {/* Success Message */}
        {params.message && (
          <div className="mb-4 rounded-md bg-green-50 p-4 dark:bg-green-900/20">
            <p className="text-sm text-green-800 dark:text-green-400">
              {params.message}
            </p>
          </div>
        )}

        <form className="space-y-4">
          <input type="hidden" name="redirect_port" value={redirectPort} />
          
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black placeholder-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-500"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black placeholder-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-500"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              formAction={login}
              className="flex-1 rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200 dark:focus:ring-zinc-500"
            >
              Sign in
            </button>
            <button
              formAction={signup}
              type="submit"
              className="flex-1 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700 dark:focus:ring-zinc-500"
            >
              Sign up
            </button>
          </div>
        </form>

        {/* Forgot password form */}
        <div className="mt-4 text-center">
          <form action={requestPasswordReset} className="inline">
            <input type="hidden" name="redirect_port" value={redirectPort} />
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              className="mr-2 rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm text-black placeholder-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
              required
            />
            <button
              type="submit"
              className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
            >
              Reset password
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Sign in or create an account to authenticate your CLI
        </p>
      </div>
    </div>
  )
}
