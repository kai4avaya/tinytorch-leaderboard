import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getCorsHeaders } from '@/lib/cors'
import { getUrl, ALLOWED_ORIGINS } from '@/utils/config'

export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request, { methods: 'POST, OPTIONS' });

  try {
    const { email, password, redirect_to } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Determine redirect path
    let redirectPath = '/'
    if (redirect_to) {
      // Check if it's an allowed absolute URL
      const isAllowedOrigin = ALLOWED_ORIGINS.some(origin => redirect_to.startsWith(origin))
      if (isAllowedOrigin) {
        redirectPath = redirect_to
      } else if (redirect_to.startsWith('/') && !redirect_to.startsWith('//')) {
        // Internal relative path
        redirectPath = redirect_to
      }
    }

    // Construct the email redirect URL to route through our confirmation handler
    const emailRedirectTo = getUrl(`/auth/confirm?next=${encodeURIComponent(redirectPath)}`)

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
      },
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers: corsHeaders }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    }, { status: 201, headers: corsHeaders })

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
