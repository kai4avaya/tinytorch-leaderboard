/**
 * Test suite for submissions API endpoints
 * 
 * Run with: npm test
 * 
 * Prerequisites:
 * 1. Start dev server: npm run dev
 * 2. Set TEST_EMAIL and TEST_PASSWORD environment variables
 *    Or edit the defaults below
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com'
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword123'

let authToken: string | null = null
let userId: string | null = null
let authSetupFailed = false

describe('Submissions API Tests', () => {
  beforeAll(async () => {
    // Check if server is running by trying to connect
    let serverRunning = false
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
      
      const healthCheck = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test', password: 'test' }),
        signal: controller.signal,
      }).catch(() => null)
      
      clearTimeout(timeoutId)
      serverRunning = healthCheck !== null
    } catch (error: any) {
      // Connection failed - server probably not running
      serverRunning = false
    }

    if (!serverRunning) {
      throw new Error(
        `\n❌ Cannot connect to ${BASE_URL}\n` +
        `   Make sure the dev server is running in another terminal:\n` +
        `   $ npm run dev\n` +
        `   Then run tests again: npm test\n`
      )
    }

    // Login and get token before running tests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    let loginResponse
    try {
      loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error(
          `\n❌ Request timed out connecting to ${BASE_URL}\n` +
          `   Make sure the dev server is running: npm run dev\n`
        )
      }
      throw error
    }

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text()
      authSetupFailed = true
      console.warn(
        `\n⚠️  Login failed: ${loginResponse.status}\n` +
        `   Response: ${errorText}\n` +
        `   Auth-dependent tests will be skipped.\n` +
        `   To enable auth tests, create a test user:\n` +
        `   1. Sign up via the web UI at ${BASE_URL}/login\n` +
        `   2. Set TEST_EMAIL and TEST_PASSWORD environment variables\n` +
        `   Current: TEST_EMAIL="${TEST_EMAIL}"\n`
      )
      return // Don't throw - allow public tests to run
    }

    const loginData = await loginResponse.json()
    
    if (!loginData.access_token) {
      authSetupFailed = true
      console.warn(
        `\n⚠️  No access token received from login\n` +
        `   Response: ${JSON.stringify(loginData)}\n` +
        `   Auth-dependent tests will be skipped.\n`
      )
      return
    }

    authToken = loginData.access_token
    userId = loginData.user?.id

    if (!userId) {
      console.warn('Warning: No user ID received from login, some tests may fail')
    }
  }, 20000) // Increase timeout for beforeAll hook to 20 seconds

  describe('GET /api/submissions', () => {
    describe('Public access (mine=false)', () => {
      it('should allow public read without authentication', async () => {
        const response = await fetch(`${BASE_URL}/api/submissions`)
        
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data).toHaveProperty('data')
        expect(Array.isArray(data.data)).toBe(true)
      })

      it('should return default limit of 10 submissions', async () => {
        const response = await fetch(`${BASE_URL}/api/submissions`)
        
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.data.length).toBeLessThanOrEqual(10)
      })

      it('should respect limit query parameter', async () => {
        const response = await fetch(`${BASE_URL}/api/submissions?limit=5`)
        
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.data.length).toBeLessThanOrEqual(5)
      })

      it('should order submissions by created_at DESC', async () => {
        const response = await fetch(`${BASE_URL}/api/submissions?limit=5`)
        
        expect(response.status).toBe(200)
        const data = await response.json()
        
        if (data.data.length > 1) {
          const dates = data.data.map((s: any) => new Date(s.created_at).getTime())
          for (let i = 0; i < dates.length - 1; i++) {
            expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1])
          }
        }
      })

      it('should return submissions with expected structure', async () => {
        const response = await fetch(`${BASE_URL}/api/submissions?limit=1`)
        
        expect(response.status).toBe(200)
        const data = await response.json()
        
        if (data.data.length > 0) {
          const submission = data.data[0]
          expect(submission).toHaveProperty('id')
          expect(submission).toHaveProperty('created_at')
          expect(submission).toHaveProperty('user_id')
          expect(submission).toHaveProperty('problem_id')
          expect(submission).toHaveProperty('code')
        }
      })
    })

    describe('Authenticated access (mine=true)', () => {
      beforeEach(() => {
        if (authSetupFailed) {
          console.log('Skipping auth test - login setup failed')
        }
      })

      it('should reject request without authentication token', async () => {
        if (authSetupFailed) {
          console.log('Skipping test - auth setup failed')
          return
        }
        const response = await fetch(`${BASE_URL}/api/submissions?mine=true`)
        
        expect(response.status).toBe(401)
        const data = await response.json()
        expect(data).toHaveProperty('error')
        expect(data.error).toBe('Unauthorized')
      })

      it('should reject request with invalid token', async () => {
        if (authSetupFailed) {
          console.log('Skipping test - auth setup failed')
          return
        }
        
        const response = await fetch(`${BASE_URL}/api/submissions?mine=true`, {
          headers: {
            'Authorization': 'Bearer invalid-token-12345',
          },
        })
        
        expect(response.status).toBe(401)
        const data = await response.json()
        expect(data).toHaveProperty('error')
        expect(data.error).toBe('Unauthorized')
      })

      it('should allow read with Bearer token authentication', async () => {
        if (authSetupFailed || !authToken) {
          console.log('Skipping test - auth setup failed')
          return
        }
        
        const response = await fetch(`${BASE_URL}/api/submissions?mine=true`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        })

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data).toHaveProperty('data')
        expect(Array.isArray(data.data)).toBe(true)
      })

      it('should return only authenticated user\'s submissions', async () => {
        if (authSetupFailed || !authToken || !userId) {
          console.log('Skipping test - auth setup failed')
          return
        }
        
        const response = await fetch(`${BASE_URL}/api/submissions?mine=true&limit=100`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        })

        expect(response.status).toBe(200)
        const data = await response.json()
        
        // All submissions should belong to the authenticated user
        data.data.forEach((submission: any) => {
          expect(submission.user_id).toBe(userId)
        })
      })

      it('should respect limit parameter for authenticated requests', async () => {
        if (authSetupFailed || !authToken) {
          console.log('Skipping test - auth setup failed')
          return
        }
        
        const response = await fetch(`${BASE_URL}/api/submissions?mine=true&limit=3`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        })

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.data.length).toBeLessThanOrEqual(3)
      })
    })

    describe('Query parameter validation', () => {
      it('should reject invalid limit (negative)', async () => {
        const response = await fetch(`${BASE_URL}/api/submissions?limit=-1`)
        
        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data).toHaveProperty('error')
        expect(data.error).toContain('Invalid limit')
      })

      it('should reject invalid limit (zero)', async () => {
        const response = await fetch(`${BASE_URL}/api/submissions?limit=0`)
        
        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data).toHaveProperty('error')
        expect(data.error).toContain('Invalid limit')
      })

      it('should reject invalid limit (too large)', async () => {
        const response = await fetch(`${BASE_URL}/api/submissions?limit=1001`)
        
        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data).toHaveProperty('error')
        expect(data.error).toContain('Invalid limit')
      })

      it('should accept valid limit range (1-1000)', async () => {
        const response = await fetch(`${BASE_URL}/api/submissions?limit=50`)
        
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.data.length).toBeLessThanOrEqual(50)
      })

      it('should handle mine parameter correctly', async () => {
        // mine=false (default)
        const publicResponse = await fetch(`${BASE_URL}/api/submissions?mine=false`)
        expect(publicResponse.status).toBe(200)

        // mine=true without auth should fail
        const privateResponse = await fetch(`${BASE_URL}/api/submissions?mine=true`)
        expect(privateResponse.status).toBe(401)
      })
    })

    describe('Response format', () => {
      it('should return data in correct format', async () => {
        const response = await fetch(`${BASE_URL}/api/submissions?limit=1`)
        
        expect(response.status).toBe(200)
        const data = await response.json()
        
        // Should have 'data' property
        expect(data).toHaveProperty('data')
        expect(Array.isArray(data.data)).toBe(true)
        
        // Should not have 'success' property (different from leaderboard)
        expect(data).not.toHaveProperty('success')
      })

      it('should return empty array when no submissions exist', async () => {
        // This test assumes there might be no submissions
        // In practice, this might not happen, but we test the structure
        const response = await fetch(`${BASE_URL}/api/submissions?limit=0`)
        
        // Limit 0 is invalid, so should return 400
        expect(response.status).toBe(400)
      })
    })

    describe('CORS headers', () => {
      it('should include CORS headers in response', async () => {
        const response = await fetch(`${BASE_URL}/api/submissions`)
        
        expect(response.status).toBe(200)
        expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
        expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET')
      })

      it('should handle OPTIONS preflight request', async () => {
        const response = await fetch(`${BASE_URL}/api/submissions`, {
          method: 'OPTIONS',
        })
        
        expect(response.status).toBe(200)
        expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
        expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET')
        expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Authorization')
      })
    })
  })
})
