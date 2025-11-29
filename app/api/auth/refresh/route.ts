import { NextResponse } from 'next/server'
import { createClientWithToken as createClient } from '@/utils/supabase/server-with-token'

export async function POST(request: Request) {
  const { refreshToken } = await request.json()

  if (!refreshToken) {
    return NextResponse.json(
      { error: 'Missing refresh token' },
      { status: 400 }
    )
  }

  const supabase = createClient()

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  return NextResponse.json(data)
}
