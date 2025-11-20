import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  // Sign out the user
  await supabase.auth.signOut()

  // Clear the cache
  revalidatePath('/', 'layout')
  
  // Redirect to login page
  redirect('/login')
}
