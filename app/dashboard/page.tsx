import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { LocationDetector } from '@/components/location-detector'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Detect location on first visit after signup/confirmation
  return (
    <>
      <LocationDetector userId={user.id} />
      {redirect('https://tinytorch.ai/community/dashboard.html')}
    </>
  )
}