'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { CliStateView } from '@/components/cli-state-view'
import { Loader2 } from 'lucide-react'

export default function CliLoggedOutPage() {
  const [isLoggingOut, setIsLoggingOut] = useState(true)

  useEffect(() => {
    const logout = async () => {
      try {
        const supabase = createClient()
        await supabase.auth.signOut()
      } catch (error) {
        console.error('Error logging out:', error)
      } finally {
        setIsLoggingOut(false)
      }
    }
    logout()
  }, [])

  if (isLoggingOut) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50/50 dark:bg-zinc-950/50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          <p className="text-zinc-600 dark:text-zinc-400">Logging you out...</p>
        </div>
      </div>
    )
  }

  return <CliStateView state="logout" />
}
