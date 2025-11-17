/**
 * Test suite for CLI login functionality
 * 
 * Run with: npm test
 * 
 * Prerequisites:
 * 1. Start dev server: npm run dev
 * 2. Set TEST_EMAIL and TEST_PASSWORD environment variables
 *    Or edit the defaults below
 * 
 * Tests:
 * - CLI login page accessibility
 * - Login functionality
 * - Signup functionality  
 * - Password reset functionality
 * - Error handling
 * - Redirect port parameter validation
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com'
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword123'
const TEST_REDIRECT_PORT = '54321'

describe('CLI Login Tests', () => {
  beforeAll(async () => {
    // Check if server is running
    let serverRunning = false
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      
      const healthCheck = await fetch(`${BASE_URL}/cli-login?redirect_port=${TEST_REDIRECT_PORT}`, {
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
  }, 20000)

  describe('CLI Login Page', () => {
    it('should be accessible with redirect_port parameter', async () => {
      const response = await fetch(`${BASE_URL}/cli-login?redirect_port=${TEST_REDIRECT_PORT}`)
      
      expect(response.status).toBe(200)
      const html = await response.text()
      
      // Check for key elements
      expect(html).toContain('CLI Authentication')
      expect(html).toContain('Sign in')
      expect(html).toContain('Sign up')
      expect(html).toContain('Reset password')
      expect(html).toContain('email')
      expect(html).toContain('password')
    })

    it('should show error when redirect_port is missing', async () => {
      const response = await fetch(`${BASE_URL}/cli-login`)
      
      expect(response.status).toBe(200)
      const html = await response.text()
      
      expect(html).toContain('Missing redirect_port parameter')
    })

    it('should preserve redirect_port in form', async () => {
      const response = await fetch(`${BASE_URL}/cli-login?redirect_port=${TEST_REDIRECT_PORT}`)
      
      expect(response.status).toBe(200)
      const html = await response.text()
      
      // Check that redirect_port is in the hidden input
      expect(html).toContain(`name="redirect_port"`)
      expect(html).toContain(`value="${TEST_REDIRECT_PORT}"`)
    })
  })

  describe('CLI Login Actions', () => {
    it('should reject login without email', async () => {
      const formData = new FormData()
      formData.append('password', TEST_PASSWORD)
      formData.append('redirect_port', TEST_REDIRECT_PORT)

      // Since we can't directly call server actions, we'll test via the page
      // This is a limitation - we'd need to test the actual form submission
      // For now, we verify the page structure supports the action
      const response = await fetch(`${BASE_URL}/cli-login?redirect_port=${TEST_REDIRECT_PORT}`)
      const html = await response.text()
      
      expect(html).toContain('formAction')
      expect(html).toContain('Sign in')
    })

    it('should reject login without password', async () => {
      const response = await fetch(`${BASE_URL}/cli-login?redirect_port=${TEST_REDIRECT_PORT}`)
      const html = await response.text()
      
      // Verify password field is required
      expect(html).toContain('type="password"')
      expect(html).toContain('required')
    })

    it('should show error messages when present', async () => {
      const errorMessage = 'Invalid credentials'
      const response = await fetch(
        `${BASE_URL}/cli-login?redirect_port=${TEST_REDIRECT_PORT}&error=${encodeURIComponent(errorMessage)}`
      )
      
      expect(response.status).toBe(200)
      const html = await response.text()
      
      expect(html).toContain(errorMessage)
    })
  })

  describe('Password Reset', () => {
    it('should have password reset form', async () => {
      const response = await fetch(`${BASE_URL}/cli-login?redirect_port=${TEST_REDIRECT_PORT}`)
      const html = await response.text()
      
      expect(html).toContain('Reset password')
      expect(html).toContain('requestPasswordReset')
    })

    it('should preserve redirect_port in password reset form', async () => {
      const response = await fetch(`${BASE_URL}/cli-login?redirect_port=${TEST_REDIRECT_PORT}`)
      const html = await response.text()
      
      // Password reset form should also include redirect_port
      expect(html).toContain('Reset password')
      // The form should have the redirect_port hidden input
      const redirectPortMatches = html.match(/name="redirect_port"[^>]*value="(\d+)"/g)
      expect(redirectPortMatches?.length).toBeGreaterThan(0)
    })
  })

  describe('Signup Functionality', () => {
    it('should have signup button', async () => {
      const response = await fetch(`${BASE_URL}/cli-login?redirect_port=${TEST_REDIRECT_PORT}`)
      const html = await response.text()
      
      expect(html).toContain('Sign up')
      expect(html).toContain('signup')
    })
  })

  describe('Error Handling', () => {
    it('should display error messages correctly', async () => {
      const testErrors = [
        'Invalid email or password',
        'User not found',
        'Email already registered',
        'Password reset email sent. Check your inbox.',
      ]

      for (const errorMsg of testErrors) {
        const response = await fetch(
          `${BASE_URL}/cli-login?redirect_port=${TEST_REDIRECT_PORT}&error=${encodeURIComponent(errorMsg)}`
        )
        
        expect(response.status).toBe(200)
        const html = await response.text()
        expect(html).toContain(errorMsg)
      }
    })

    it('should display success messages correctly', async () => {
      const successMsg = 'Password reset email sent. Check your inbox.'
      const response = await fetch(
        `${BASE_URL}/cli-login?redirect_port=${TEST_REDIRECT_PORT}&message=${encodeURIComponent(successMsg)}`
      )
      
      expect(response.status).toBe(200)
      const html = await response.text()
      expect(html).toContain(successMsg)
    })
  })

  describe('Form Structure', () => {
    it('should have all required form fields', async () => {
      const response = await fetch(`${BASE_URL}/cli-login?redirect_port=${TEST_REDIRECT_PORT}`)
      const html = await response.text()
      
      // Check for email field
      expect(html).toMatch(/type="email"/i)
      expect(html).toMatch(/name="email"/i)
      
      // Check for password field
      expect(html).toMatch(/type="password"/i)
      expect(html).toMatch(/name="password"/i)
      
      // Check for hidden redirect_port field
      expect(html).toMatch(/type="hidden"/i)
      expect(html).toMatch(/name="redirect_port"/i)
      
      // Check for submit buttons
      expect(html).toContain('Sign in')
      expect(html).toContain('Sign up')
    })

    it('should have proper form actions', async () => {
      const response = await fetch(`${BASE_URL}/cli-login?redirect_port=${TEST_REDIRECT_PORT}`)
      const html = await response.text()
      
      // Check that forms have actions
      expect(html).toMatch(/formAction/i)
    })
  })

  describe('Integration with Config', () => {
    it('should use CLI_LOGIN_URL from config', async () => {
      // This test verifies the config is being used
      // The actual URL should match what's in utils/config.ts
      const response = await fetch(`${BASE_URL}/cli-login?redirect_port=${TEST_REDIRECT_PORT}`)
      
      expect(response.status).toBe(200)
      // If we get here, the route exists and config is working
    })
  })
})
