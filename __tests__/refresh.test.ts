import { POST } from '@/app/api/auth/refresh/route'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server-with-token'

jest.mock('@/utils/supabase/server-with-token', () => ({
  createClient: jest.fn(),
}))

describe('/api/auth/refresh', () => {
  it('should return a new session on successful refresh', async () => {
    const mockSupabase = {
      auth: {
        refreshSession: jest.fn().mockResolvedValue({
          data: {
            session: {
              access_token: 'new_access_token',
              refresh_token: 'new_refresh_token',
            },
          },
          error: null,
        }),
      },
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new Request('http://localhost/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: 'old_refresh_token' }),
    })

    const response = await POST(request)
    const responseBody = await response.json()

    expect(response.status).toBe(200)
    expect(responseBody.session.access_token).toBe('new_access_token')
    expect(responseBody.session.refresh_token).toBe('new_refresh_token')
  })

  it('should return 400 if refresh token is missing', async () => {
    const request = new Request('http://localhost/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const responseBody = await response.json()

    expect(response.status).toBe(400)
    expect(responseBody.error).toBe('Missing refresh token')
  })

  it('should return 401 on refresh error', async () => {
    const mockSupabase = {
      auth: {
        refreshSession: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Invalid refresh token' },
        }),
      },
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new Request('http://localhost/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: 'invalid_refresh_token' }),
    })

    const response = await POST(request)
    const responseBody = await response.json()

    expect(response.status).toBe(401)
    expect(responseBody.error).toBe('Invalid refresh token')
  })
})
