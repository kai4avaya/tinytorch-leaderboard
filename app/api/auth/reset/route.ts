import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getUrl } from '@/utils/config'
import { getCorsHeaders } from '@/lib/cors'

export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request, { methods: 'POST, OPTIONS' });

  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getUrl('/api/auth/callback?next=/auth/reset-password'),
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers: corsHeaders }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent',
    }, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400, headers: corsHeaders }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request, { methods: 'POST, OPTIONS' });
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  })
}