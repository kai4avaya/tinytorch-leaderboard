import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Redirect to the new community dashboard
  redirect('https://tinytorch.ai/community/dashboard.html')
}