import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  
  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()

  // If not logged in, redirect to login
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6 text-center">
          <div className="mb-2 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <svg
              className="h-8 w-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            You're logged in!
          </h1>
        </div>

        <div className="mb-6 space-y-2 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Email
          </p>
          <p className="font-medium text-black dark:text-zinc-50">
            {user.email}
          </p>
        </div>

        <div className="mb-4 space-y-2 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            User ID
          </p>
          <p className="font-mono text-xs text-black dark:text-zinc-50">
            {user.id}
          </p>
        </div>

        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 dark:bg-red-500 dark:hover:bg-red-600"
          >
            Sign Out
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Signed in at {new Date(user.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}
