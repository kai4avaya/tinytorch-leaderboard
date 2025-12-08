/**
 * Central configuration file for TinyTorch
 * 
 * Update these values to change URLs and essential config across the entire application.
 * For environment-specific values, use environment variables with defaults here.
 */

/**
 * Site URL - The public URL of your application
 * Defaults to Netlify deployment URL, can be overridden via NEXT_PUBLIC_SITE_URL
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://tinytorch.netlify.app'

/**
 * Base URL for API endpoints (same as SITE_URL for Next.js)
 */
export const API_BASE_URL = SITE_URL

/**
 * CLI Login URL - The endpoint for CLI authentication
 */
export const CLI_LOGIN_URL = `${SITE_URL}/cli-login`

/**
 * Supabase Configuration
 * These are read from environment variables
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

/**
 * Development mode check
 */
export const IS_DEV = process.env.NODE_ENV === 'development'

/**
 * Local development URL (for localhost)
 */
export const LOCAL_DEV_URL = 'http://localhost:3000'

/**
 * Allowed Origins for CORS
 */
export const ALLOWED_ORIGINS = [
  'https://kai4avaya.github.io', // Allow the GitHub Pages domain
  'https://tinytorch.ai',
  'https://mlsysbook.ai',
  'https://www.mlsysbook.ai',
  'http://localhost:2021', // Always allow localhost:2021
  SITE_URL, // Allow the deployed site itself
  ...(IS_DEV ? ['http://localhost:3000'] : []), // Only allow localhost:3000 in dev mode
]

/**
 * Get the appropriate base URL based on environment
 */
export function getBaseUrl(): string {
  if (IS_DEV) {
    return LOCAL_DEV_URL
  }
  return SITE_URL
}

/**
 * Build a full URL for a given path
 */
export function getUrl(path: string): string {
  const base = getBaseUrl()
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
