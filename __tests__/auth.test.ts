/**
 * Test suite for authentication API endpoints
 * 
 * Run with: npm test
 * 
 * Prerequisites:
 * 1. Start dev server: npm run dev
 * 2. Set TEST_BASE_URL environment variable if not localhost:3000
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

describe('Auth API Tests', () => {
  beforeAll(async () => {
    // Check if server is running by trying to connect
    let serverRunning = false
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
      
      const healthCheck = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test', password: 'test' }), // Dummy data, just to hit the endpoint
        signal: controller.signal,
      }).catch(() => null)
      
      clearTimeout(timeoutId)
      serverRunning = healthCheck !== null
    } catch (error: any) {
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
  }, 20000) // Increase timeout for beforeAll hook to 20 seconds

  describe('POST /api/auth/signup', () => {
    const uniqueId = Date.now() + Math.random().toString(36).substring(2, 8);
    const TEST_EMAIL_SIGNUP = `testuser-${uniqueId}@example.com`
    const TEST_PASSWORD_SIGNUP = 'testpassword123'
    const TEST_EMAIL_SIGNUP_DUPLICATE = `testuser-duplicate-${uniqueId}@example.com`

    it('should successfully create a new user account', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TEST_EMAIL_SIGNUP,
          password: TEST_PASSWORD_SIGNUP,
        }),
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('message', 'User created successfully')
      expect(data).toHaveProperty('user')
      expect(data.user).toHaveProperty('id')
      expect(data.user).toHaveProperty('email', TEST_EMAIL_SIGNUP)
    })

    it('should fail to create a user with an existing email', async () => {
      // First, create the user
      await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TEST_EMAIL_SIGNUP_DUPLICATE,
          password: TEST_PASSWORD_SIGNUP,
        }),
      })

      // Try to create again with the same email
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TEST_EMAIL_SIGNUP_DUPLICATE,
          password: TEST_PASSWORD_SIGNUP,
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data).toHaveProperty('error')
      expect(data.error).toContain('already registered')
    })

    it('should fail with missing email', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: TEST_PASSWORD_SIGNUP,
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data).toHaveProperty('error', 'Email and password are required')
    })

    it('should fail with missing password', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `no-password-${uniqueId}@example.com`,
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data).toHaveProperty('error', 'Email and password are required')
    })

    it('should include CORS headers in response', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `cors-test-${uniqueId}@example.com`,
          password: TEST_PASSWORD_SIGNUP,
        }),
      })
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type')
    })

    it('should handle OPTIONS preflight request', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'OPTIONS',
      })
      
      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type')
    })
  })
})
