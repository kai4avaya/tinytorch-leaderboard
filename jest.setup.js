// Jest setup file
// This ensures fetch is available in the test environment

// Node 18+ has native fetch, but we'll add a check
if (typeof fetch === 'undefined') {
  // For older Node versions, you might need to install node-fetch
  // But Next.js 16+ requires Node 18+, so fetch should be available
  console.warn('Warning: fetch is not available. Make sure you are using Node 18+')
}
