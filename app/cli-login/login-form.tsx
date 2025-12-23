'use client'

import { useState, useTransition } from 'react'
import { login, signup, requestPasswordReset } from './actions'
import { Loader2, Github } from 'lucide-react'

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      aria-hidden="true" 
      focusable="false" 
      data-prefix="fab" 
      data-icon="google" 
      role="img" 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 488 512"
    >
      <path 
        fill="currentColor" 
        d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
      />
    </svg>
  )
}

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

  const getSocialLoginUrl = (provider: string) => {
    const baseUrl = `/api/auth/${provider}`
    const params = new URLSearchParams()
    if (redirectTo) {
      params.set('returnTo', redirectTo)
    } else if (redirectPort) {
      params.set('returnTo', `http://127.0.0.1:${redirectPort}/callback`)
    } else {
      params.set('returnTo', '/dashboard')
    }
    return `${baseUrl}?${params.toString()}`
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center">
        <img 
          src="/logo-tinytorch.png" 
          alt="Tiny Torch Logo" 
          className="h-16 w-auto mr-3"
        />
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

      {mode === 'login' && (
        <>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-300 dark:border-zinc-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a
              href={getSocialLoginUrl('google')}
              className="flex items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700"
            >
              <GoogleIcon className="mr-2 h-4 w-4" />
              Google
            </a>
            <a
              href={getSocialLoginUrl('github')}
              className="flex items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700"
            >
              <Github className="mr-2 h-4 w-4" />
              GitHub
            </a>
          </div>
        </>
      )}

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
