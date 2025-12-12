'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, LogOut, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CliStateViewProps {
  state: 'login' | 'logout'
  email?: string
}

export function CliStateView({ state, email }: CliStateViewProps) {
  // Attempt to close window programmatically (works in some contexts like popups)
  const handleClose = () => {
    window.close()
  }

  const isLogin = state === 'login'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50/50 p-4 dark:bg-zinc-950/50">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        
        {/* Header with Logo */}
        <div className="flex flex-col items-center border-b border-zinc-100 bg-zinc-50/50 p-8 dark:border-zinc-800/50 dark:bg-zinc-900/50">
          <img 
            src="/logo-tinytorch.png" 
            alt="Tiny Torch Logo" 
            className="mb-6 h-20 w-auto"
          />
          
          <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${isLogin ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
            {isLogin ? <CheckCircle2 className="h-6 w-6" /> : <LogOut className="h-6 w-6" />}
          </div>

          <h1 className="text-center text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {isLogin ? 'Authentication Successful' : 'Logged Out Successfully'}
          </h1>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          <p className="mb-6 text-zinc-600 dark:text-zinc-400">
            {isLogin ? (
              <>
                You have successfully logged in via <span className="font-semibold text-zinc-900 dark:text-zinc-200">Tito CLI</span>.
                {email && <span className="block mt-2 text-sm text-zinc-500">Account: {email}</span>}
              </>
            ) : (
              <>
                You have successfully logged out of <span className="font-semibold text-zinc-900 dark:text-zinc-200">Tiny Torch</span> via Tito CLI.
              </>
            )}
          </p>

          <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800/50">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              You can now close this browser window and return to your terminal.
            </p>
          </div>

          <div className="mt-8">
            <Button 
              onClick={handleClose}
              variant="outline" 
              className="w-full border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              <X className="mr-2 h-4 w-4" />
              Close Window
            </Button>
          </div>
        </div>
        
        {/* Footer */}
        <div className="border-t border-zinc-100 bg-zinc-50 p-4 text-center text-xs text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/50">
          Tiny Torch Systems &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  )
}
