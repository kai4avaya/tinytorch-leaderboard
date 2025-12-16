'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { detectLocation, updateProfileLocation } from '@/lib/location-service'

/**
 * Client-side location detector component
 * Automatically detects and updates user location after signup/login
 * Only runs once per session to avoid unnecessary API calls
 */
export function LocationDetector({ userId }: { userId: string }) {
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current || !userId) return
    hasRun.current = true

    const detectAndUpdate = async () => {
      const supabase = createClient()
      
      // Check if location already exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('location')
        .eq('id', userId)
        .single()

      if (profile?.location) {
        console.log('Location already set:', profile.location)
        return
      }

      // Detect and update location
      const locationData = await detectLocation()
      if (locationData) {
        await updateProfileLocation(userId, locationData, supabase)
      }
    }

    detectAndUpdate()
  }, [userId])

  return null
}
