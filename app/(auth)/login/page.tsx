import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { login, signup, requestPasswordReset } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; message?: string | string[]; redirect_to?: string | string[] }>
}) {
  // Await searchParams to access its properties
  const params = await searchParams
  
  const redirectTo = Array.isArray(params.redirect_to) ? params.redirect_to[0] : params.redirect_to
  const error = Array.isArray(params.error) ? params.error[0] : params.error
  const message = Array.isArray(params.message) ? params.message[0] : params.message

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect(redirectTo || '/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center">
          <img 
            src="/logo-tinytorch.png" 
            alt="Tiny Torch Logo" 
            className="h-16 w-auto mr-3"
          />
          </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
            <p className="text-sm text-red-800 dark:text-red-400">
              {error}
            </p>
          </div>
        )}

        {/* Success Message */}
        {message && (
          <div className="mb-4 rounded-md bg-green-50 p-4 dark:bg-green-900/20">
            <p className="text-sm text-green-800 dark:text-green-400">
              {message}
            </p>
          </div>
        )}
        
        <form className="space-y-4">
          <input type="hidden" name="redirect_to" value={redirectTo || ''} />
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
        
        <div className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          <p>Use the buttons above to sign in or create a new account</p>
        </div>
      </div>
    </div>
  )
}
