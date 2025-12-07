/**
 * Location detection service
 * Detects user location via IP geolocation API and updates profile
 */

export async function detectLocation(): Promise<string | null> {
  try {
    const geoRes = await fetch('https://ipapi.co/json/', { 
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    })
    
    if (!geoRes.ok) {
      console.warn('Location detection failed: API returned', geoRes.status)
      return null
    }
    
    const geo = await geoRes.json()
    const locationString = geo.city && geo.country_name 
      ? `${geo.city}, ${geo.country_name}` 
      : geo.country_name || null

    return locationString
  } catch (err) {
    console.warn('Location detection failed (non-critical):', err)
    return null
  }
}

export async function updateProfileLocation(userId: string, location: string, supabaseClient: any) {
  try {
    const { error } = await supabaseClient
      .from('profiles')
      .update({ location })
      .eq('id', userId)

    if (error) {
      console.warn('Could not save location:', error.message)
      return false
    }
    
    console.log('✅ Profile updated with location:', location)
    return true
  } catch (err) {
    console.warn('Location update failed:', err)
    return false
  }
}
