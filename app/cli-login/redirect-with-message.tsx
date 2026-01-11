'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation' // Use next/navigation for client-side navigation
import { Loader2 } from 'lucide-react' // Use Loader2 for a spinner

interface RedirectWithMessageProps {
  redirectUrl: string
}

export function RedirectWithMessage({ redirectUrl }: RedirectWithMessageProps) {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      // Use window.location.href for cross-origin/protocol redirects (e.g. to localhost CLI)
      window.location.href = redirectUrl
    }, 1000) // Redirect after 1 second

    return () => clearTimeout(timer) // Cleanup the timer
  }, [redirectUrl])

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-black dark:text-zinc-50 mb-4" />
        <h1 className="mb-2 text-xl font-semibold text-black dark:text-zinc-50">
          You are now logged in to 🔥 Tiny Torch.
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          This page will close shortly. Please proceed with your `tito` tool.
        </p>
        <p className="mt-4 text-sm text-zinc-500">
          Redirecting in 3 seconds...
        </p>
      </div>
    </div>
  )
}