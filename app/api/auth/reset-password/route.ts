import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getUrl } from '@/utils/config'
import { getCorsHeaders } from '@/lib/cors' // Import the new helper

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
      redirectTo: getUrl('/auth/reset-password'),
    })

    // IMPORTANT: Return a generic success message even if the email doesn't exist
    // This prevents email enumeration attacks.
    if (error) {
        console.error('Password reset request error:', error)
        // Log the error but return generic success to the client
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent to your inbox.',
    }, { status: 200, headers: corsHeaders })

  } catch (error) {
    console.error('Unexpected error in reset-password API:', error)
    return NextResponse.json(
      { error: 'Invalid request body or unexpected error' },
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
