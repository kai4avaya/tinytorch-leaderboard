import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { LoggedInView } from '@/components/logged-in-view'

export default async function Home() {
  const supabase = await createClient()
  
  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()

  // If logged in, show the logged-in view
  if (user) {
    return <LoggedInView userEmail={user.email} />
  }

  // If not logged in, redirect to login
  redirect('/login')
}
