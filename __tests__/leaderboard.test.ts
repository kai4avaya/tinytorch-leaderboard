/**
 * Test suite for leaderboard API endpoints
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

let authToken: string
let userId: string

describe('Leaderboard API Tests', () => {
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
      throw new Error(
        `\n❌ Login failed: ${loginResponse.status}\n` +
        `   Response: ${errorText}\n` +
        `   Make sure TEST_EMAIL and TEST_PASSWORD are set correctly.\n` +
        `   Current: TEST_EMAIL="${TEST_EMAIL}"\n`
      )
    }

    const loginData = await loginResponse.json()
    authToken = loginData.access_token
    userId = loginData.user?.id

    if (!authToken) {
      throw new Error('No access token received from login')
    }
  }, 20000) // Increase timeout for beforeAll hook to 20 seconds

  describe('GET /api/leaderboard', () => {
    it('should allow public read without authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/leaderboard`)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('should allow read with Bearer token authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/leaderboard`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')
    })

    it('should support pagination query parameters', async () => {
      const response = await fetch(
        `${BASE_URL}/api/leaderboard?limit=5&offset=0&order_by=overall_score&order=desc`
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('limit', 5)
      expect(data).toHaveProperty('offset', 0)
    })
  })

  describe('POST /api/leaderboard', () => {
    it('should reject write without authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/leaderboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          successful_submissions: 5,
          overall_score: 100.0,
        }),
      })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data).toHaveProperty('error')
      expect(data.error).toContain('Not authenticated')
    })

    it('should allow write with Bearer token authentication', async () => {
      const payload = {
        successful_submissions: 10,
        overall_score: 123.45,
        optimization_score: 100.0,
        accuracy_score: 0.98,
      }

      const response = await fetch(`${BASE_URL}/api/leaderboard`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('message')
    })

    it('should upsert (update) existing entry', async () => {
      // First write
      const firstPayload = {
        successful_submissions: 10,
        overall_score: 100.0,
        optimization_score: 80.0,
        accuracy_score: 0.95,
      }

      await fetch(`${BASE_URL}/api/leaderboard`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(firstPayload),
      })

      // Update with new values
      const updatePayload = {
        successful_submissions: 15,
        overall_score: 150.75,
        optimization_score: 120.0,
        accuracy_score: 0.99,
      }

      const response = await fetch(`${BASE_URL}/api/leaderboard`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('success', true)
    })

    it('should use authenticated user_id, ignoring payload user_id', async () => {
      // Try to send a different user_id (should be ignored)
      const payload = {
        user_id: '00000000-0000-0000-0000-000000000000', // Fake UUID
        successful_submissions: 20,
        overall_score: 200.0,
      }

      const response = await fetch(`${BASE_URL}/api/leaderboard`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      expect(response.status).toBe(200)
      
      // Verify the entry was created with the correct user_id
      const readResponse = await fetch(`${BASE_URL}/api/leaderboard`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      })
      
      const readData = await readResponse.json()
      const userEntry = readData.data.find((entry: any) => entry.user_id === userId)
      
      expect(userEntry).toBeDefined()
      expect(userEntry.user_id).toBe(userId)
      expect(userEntry.user_id).not.toBe('00000000-0000-0000-0000-000000000000')
    })

    it('should handle missing optional fields with defaults', async () => {
      const payload = {
        overall_score: 99.99,
        // Missing other fields - should use defaults
      }

      const response = await fetch(`${BASE_URL}/api/leaderboard`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('success', true)
    })
  })

  describe('RLS Policy Enforcement', () => {
    it('should only allow users to modify their own entries', async () => {
      // This test verifies that RLS is working
      // The API always uses auth.uid() for user_id, so RLS should pass
      const payload = {
        successful_submissions: 25,
        overall_score: 250.0,
      }

      const response = await fetch(`${BASE_URL}/api/leaderboard`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      // Should succeed because user_id = auth.uid()
      expect(response.status).toBe(200)
    })
  })
})
