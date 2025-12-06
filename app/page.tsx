import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  
  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()

  // If logged in, redirect to the external community dashboard
  if (user) {
    redirect('https://tinytorch.ai/community/dashboard.html')
  }

  // If not logged in, redirect to login
  redirect('/login')
}
