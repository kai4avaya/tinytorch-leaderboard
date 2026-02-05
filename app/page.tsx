import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { LoggedInView } from '@/components/logged-in-view'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ external_url?: string }>
}) {
  const params = await searchParams
  const externalUrl = params.external_url
  const supabase = await createClient()
  
  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()

  // If logged in, show the logged-in view
  if (user) {
    return <LoggedInView userEmail={user.email} externalUrl={externalUrl} />
  }

  // If not logged in, redirect to login
  if (externalUrl) {
    redirect(`/login?redirect_to=${encodeURIComponent(externalUrl)}`)
  }
  
  redirect('/login')
}
