'use client'

import { useState, useTransition } from 'react'
import { login, signup, requestPasswordReset } from './actions'
import { Loader2 } from 'lucide-react'

export function LoginForm({ 
  redirectPort,
  redirectTo,
  initialError,
  initialMessage,
  initialEmail,
  initialName,
  initialAffiliation
}: { 
  redirectPort: string
  redirectTo?: string
  initialError?: string
  initialMessage?: string
  initialEmail?: string
  initialName?: string
  initialAffiliation?: string
}) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(
    initialError 
      ? { type: 'error', text: initialError }
      : initialMessage 
        ? { type: 'success', text: initialMessage }
        : null
  )
  // Initialize email state if provided
  const [email, setEmail] = useState(initialEmail || '')
  
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login')

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage(null)
    const formData = new FormData(event.currentTarget)
    if (!formData.get('redirect_port')) {
      formData.set('redirect_port', redirectPort)
    }
    if (redirectTo && !formData.get('redirect_to')) {
      formData.set('redirect_to', redirectTo)
    }

    startTransition(async () => {
      let result: { error?: string; success?: boolean; message?: string } | undefined

      try {
        if (mode === 'login') {
          const res = await login(formData)
          if (res) result = res
        } else if (mode === 'signup') {
          const res = await signup(formData)
          if (res) result = res
        } else if (mode === 'reset') {
          const res = await requestPasswordReset(formData)
          if (res) result = res
        }

        if (result?.error) {
          setMessage({ type: 'error', text: result.error })
        } else if (result?.success && result?.message) {
          setMessage({ type: 'success', text: result.message })
        }
      } catch (e) {
        // Next.js redirects throw an error, so we need to catch it
        // If it's a redirect, we let it bubble up
        if ((e as Error).message === 'NEXT_REDIRECT') {
          throw e
        }
        setMessage({ type: 'error', text: 'An unexpected error occurred' })
      }
    })
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center">
        <img 
          src="/logo-tinytorch.png" 
          alt="Tiny Torch Logo" 
          className="h-16 w-auto mr-3"
        />
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Login
        </h1>
      </div>

      {message && (
        <div
          className={`mb-4 rounded-md p-4 ${
            message.type === 'error'
              ? 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              : 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
          }`}
        >
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="redirect_port" value={redirectPort} />
        {redirectTo && <input type="hidden" name="redirect_to" value={redirectTo} />}

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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black placeholder-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-500"
            placeholder="you@example.com"
            required
          />
        </div>

        {mode !== 'reset' && (
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
        )}

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200 dark:focus:ring-zinc-500"
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'login'
            ? 'Sign in'
            : mode === 'signup'
            ? 'Sign up'
            : 'Reset Password'}
        </button>
      </form>

      <div className="mt-4 flex flex-col gap-2 text-center text-sm">
        {mode === 'login' && (
          <>
            <button
              type="button"
              onClick={() => {
                setMessage(null)
                setMode('signup')
              }}
              className="text-zinc-600 hover:underline dark:text-zinc-400"
            >
              Don&apos;t have an account? Sign up
            </button>
            <button
              type="button"
              onClick={() => {
                setMessage(null)
                setMode('reset')
              }}
              className="text-zinc-600 hover:underline dark:text-zinc-400"
            >
              Forgot password?
            </button>
          </>
        )}
        {mode === 'signup' && (
          <button
            type="button"
            onClick={() => {
              setMessage(null)
              setMode('login')
            }}
            className="text-zinc-600 hover:underline dark:text-zinc-400"
          >
            Already have an account? Sign in
          </button>
        )}
        {mode === 'reset' && (
          <button
            type="button"
            onClick={() => {
              setMessage(null)
              setMode('login')
            }}
            className="text-zinc-600 hover:underline dark:text-zinc-400"
          >
            Back to Sign in
          </button>
        )}
      </div>
    </div>
  )
}
