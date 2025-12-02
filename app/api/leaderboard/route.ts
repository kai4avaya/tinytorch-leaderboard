import { NextRequest, NextResponse } from 'next/server'
import { createClientWithToken } from '@/utils/supabase/server-with-token'
import { getCorsHeaders } from '@/lib/cors' // Import the new helper

/**
 * Secure API endpoint for leaderboard operations
 * 
 * Supports both:
 * 1. Cookie-based auth (Next.js browser clients)
 * 2. Bearer token auth (external clients like CLI/Colab)
 * 
 * RLS ensures users can only write their own rows (user_id = auth.uid())
 */
export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request, { methods: 'POST, OPTIONS' });

  try {
    // Extract Bearer token from Authorization header (if present)
    const authHeader = request.headers.get('authorization')
    const bearerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : undefined

    // Create Supabase client with token (if provided) or cookies (if not)
    const supabase = await createClientWithToken(bearerToken)

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated. Please provide a valid token or be logged in.' },
        { status: 401, headers: corsHeaders }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      successful_submissions,
      overall_score,
      optimization_score,
      accuracy_score,
    } = body

    // Validate required fields (optional - adjust based on your needs)
    // You can add more validation here

    // Prepare row data - CRITICAL: use user.id from auth, not from request body
    // This ensures RLS policy (user_id = auth.uid()) will pass
    const row = {
      user_id: user.id, // Always use authenticated user's ID
      successful_submissions: successful_submissions ?? 0,
      overall_score: overall_score ?? 0,
      optimization_score: optimization_score ?? 0,
      accuracy_score: accuracy_score ?? 0,
      updated_at: new Date().toISOString(),
    }

    // Upsert the row (insert or update if exists)
    // First, try to update existing row
    // RLS will verify: WITH CHECK ((SELECT auth.uid()) = user_id)
    // Since user_id = user.id = auth.uid(), this will pass
    const { data: updateData, error: updateError } = await supabase
      .from('leaderboard_public')
      .update(row)
      .eq('user_id', user.id)
      .select()

    // Check for update errors (e.g., RLS violation)
    if (updateError) {
      console.error('Leaderboard update error:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500, headers: corsHeaders }
      )
    }

    // If update found a row, return it
    if (updateData && updateData.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Leaderboard updated successfully',
        data: updateData[0],
      }, { headers: corsHeaders })
    }

    // If no row exists, insert a new one
    const { data, error } = await supabase
      .from('leaderboard_public')
      .insert(row)
      .select()

    if (error) {
      console.error('Leaderboard insert error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500, headers: corsHeaders }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Leaderboard created successfully',
      data: data?.[0] || data,
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400, headers: corsHeaders }
    )
  }
}

/**
 * GET endpoint for reading leaderboard (public, no auth required)
 * But we'll still support both cookie and token auth for consistency
 */
export async function GET(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request, { methods: 'GET, OPTIONS' });

  try {
    // Extract Bearer token from Authorization header (if present)
    const authHeader = request.headers.get('authorization')
    const bearerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : undefined

    // Create Supabase client (token optional for public reads)
    const supabase = await createClientWithToken(bearerToken)

    // Parse query parameters for pagination/sorting
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const orderBy = searchParams.get('order_by') || 'overall_score'
    const orderDirection = searchParams.get('order') || 'desc'

    // Query leaderboard (public read - RLS allows SELECT to PUBLIC)
    let query = supabase
      .from('leaderboard_public')
      .select('*')
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      console.error('Leaderboard read error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500, headers: corsHeaders }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      limit,
      offset,
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Leaderboard GET error:', error)
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400, headers: corsHeaders }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request, { methods: 'GET, POST, OPTIONS' });
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}
