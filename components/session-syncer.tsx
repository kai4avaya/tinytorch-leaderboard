'use client'

import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export function SessionSyncer({ 
  accessToken, 
  refreshToken 
}: { 
  accessToken: string
  refreshToken: string 
}) {
  const router = useRouter()

  useEffect(() => {
    const syncSession = async () => {
      const supabase = createClient()
      
      // Attempt to set the session using tokens from URL
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (!error) {
        // Refresh the page to trigger the server-side Profile Guard
        router.refresh()
      } else {
        console.error('Failed to sync session:', error)
      }
    }

    syncSession()
  }, [accessToken, refreshToken, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-zinc-900 dark:text-zinc-50 mb-4" />
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Syncing Session...</h2>
        <p className="text-sm text-zinc-500">Please wait while we log you in.</p>
      </div>
    </div>
  )
}
