import { NextRequest, NextResponse } from 'next/server'
import { createClientWithToken as createClient } from '@/utils/supabase/server-with-token'
import { getCorsHeaders } from '@/lib/cors' // Import the new helper

export async function POST(request: NextRequest) { // Changed request to NextRequest
  const corsHeaders = getCorsHeaders(request, { methods: 'POST, OPTIONS' });

  const { refreshToken } = await request.json()

  if (!refreshToken) {
    return NextResponse.json(
      { error: 'Missing refresh token' },
      { status: 400, headers: corsHeaders } // Apply CORS headers
    )
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401, headers: corsHeaders }) // Apply CORS headers
  }

  return NextResponse.json(data, { headers: corsHeaders }) // Apply CORS headers
}

export async function OPTIONS(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request, { methods: 'POST, OPTIONS' });
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  })
}
