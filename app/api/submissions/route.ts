import { NextRequest, NextResponse } from 'next/server'
import { createClientWithToken } from '@/utils/supabase/server-with-token'
import { getCorsHeaders } from '@/lib/cors' // Import the new helper

/**
 * GET endpoint for fetching submissions
 * 
 * Query Parameters:
 * - limit (optional, default: 10) - Maximum number of submissions to return
 * - mine (optional, default: false) - If "true", return only authenticated user's submissions
 * 
 * Authentication:
 * - For mine=true: Requires Authorization: Bearer <token> header
 * - For mine=false: Public access (no auth required)
 */
export async function GET(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request, { methods: 'GET, OPTIONS' });

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const mineParam = searchParams.get('mine')
    
    const limit = limitParam ? parseInt(limitParam, 10) : 10
    const isMine = mineParam === 'true'

    // Validate limit
    if (isNaN(limit) || limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: 'Invalid limit parameter. Must be between 1 and 1000.' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Extract Bearer token from Authorization header (if present)
    const authHeader = request.headers.get('authorization')
    const bearerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : undefined

    // If mine=true, require authentication
    if (isMine) {
      if (!bearerToken) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401, headers: corsHeaders }
        )
      }

      // Create Supabase client with token
      const supabase = await createClientWithToken(bearerToken)

      // Verify user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401, headers: corsHeaders }
        )
      }

      // Query user's submissions
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Supabase error:', error)
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500, headers: corsHeaders }
        )
      }

      return NextResponse.json(
        { data: data || [] },
        {
          status: 200,
          headers: corsHeaders,
        }
      )
    } else {
      // Public query - all submissions (no auth required)
      // Create Supabase client without token (or with token if provided, but not required)
      const supabase = await createClientWithToken(bearerToken)

      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Supabase error:', error)
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500, headers: corsHeaders }
        )
      }

      return NextResponse.json(
        { data: data || [] },
        {
          status: 200,
          headers: corsHeaders,
        }
      )
    }
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request, { methods: 'GET, OPTIONS' });
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  })
}
