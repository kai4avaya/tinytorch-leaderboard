# Testing the Leaderboard API Locally

This guide shows you how to test the leaderboard API endpoints locally.

## Prerequisites

1. **Start the Next.js dev server:**
   ```bash
   npm run dev
   ```
   Server should start on `http://localhost:3000`

2. **Have a test user account:**
   - Create a test user via your app's signup page: `http://localhost:3000/login`
   - Or create one directly in Supabase Dashboard

3. **Ensure environment variables are set:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Quick Test with npm test (Recommended)

The easiest way to test everything:

```bash
# Install dependencies (if not already installed)
npm install

# Set test credentials (or edit __tests__/leaderboard.test.ts)
export TEST_EMAIL="your-test@email.com"
export TEST_PASSWORD="your-password"

# Run tests
npm test
```

This will test:
- ✅ Public read (no auth required)
- ✅ Authenticated read with Bearer token
- ✅ Write without auth (should fail)
- ✅ Write with auth
- ✅ Update existing entry (upsert)
- ✅ Verify user_id is always from auth (RLS enforcement)
- ✅ Pagination and query parameters

## Quick Test with Python Script

Alternative testing with Python:

```bash
# Edit test_leaderboard_api.py and set your test credentials
# LOGIN_EMAIL = "your-test@email.com"
# LOGIN_PASSWORD = "your-password"

# Run the test script
python test_leaderboard_api.py
```

## Manual Testing with cURL

### 1. Get Authentication Token

```bash
# Login and get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "your-password"
  }'

# Response will include:
# {
#   "success": true,
#   "access_token": "eyJhbGc...",
#   "user": { "id": "uuid-here" }
# }
```

Save the `access_token` for the next steps.

### 2. Test Public Read (No Auth Required)

```bash
curl http://localhost:3000/api/leaderboard

# Should return 200 with leaderboard data
```

### 3. Test Authenticated Read

```bash
curl http://localhost:3000/api/leaderboard \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### 4. Test Write Without Auth (Should Fail)

```bash
curl -X POST http://localhost:3000/api/leaderboard \
  -H "Content-Type: application/json" \
  -d '{
    "successful_submissions": 10,
    "overall_score": 100.0,
    "optimization_score": 80.0,
    "accuracy_score": 0.95
  }'

# Should return 401 Unauthorized
```

### 5. Test Write With Auth (Should Succeed)

```bash
curl -X POST http://localhost:3000/api/leaderboard \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "successful_submissions": 10,
    "overall_score": 123.45,
    "optimization_score": 100.0,
    "accuracy_score": 0.98
  }'

# Should return 200 with success message
```

### 6. Test Update (Upsert)

```bash
# Same as write - upsert will update if user_id exists
curl -X POST http://localhost:3000/api/leaderboard \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "successful_submissions": 15,
    "overall_score": 150.75,
    "optimization_score": 120.0,
    "accuracy_score": 0.99
  }'
```

## Testing from Browser Console

### 1. Login via Browser

Go to `http://localhost:3000/login` and log in normally.

### 2. Test Read from Browser Console

Open browser DevTools (F12) → Console tab:

```javascript
// Public read (no auth needed)
fetch('http://localhost:3000/api/leaderboard')
  .then(r => r.json())
  .then(data => console.log('Leaderboard:', data))
  .catch(err => console.error('Error:', err))
```

### 3. Test Write from Browser Console

```javascript
// Write (cookies are sent automatically)
fetch('http://localhost:3000/api/leaderboard', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    successful_submissions: 10,
    overall_score: 123.45,
    optimization_score: 100.0,
    accuracy_score: 0.98
  })
})
  .then(r => r.json())
  .then(data => console.log('Write result:', data))
  .catch(err => console.error('Error:', err))
```

## Testing RLS Enforcement

### Test 1: Verify user_id is always from auth

Even if you try to send a different `user_id` in the payload, the API should ignore it and use the authenticated user's ID:

```bash
# Try to set user_id to someone else's ID (should be ignored)
curl -X POST http://localhost:3000/api/leaderboard \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "some-other-user-id",
    "successful_submissions": 10,
    "overall_score": 100.0
  }'

# Check the database - the row should have YOUR user_id, not the one you sent
```

### Test 2: Verify public read works

```bash
# Read without any auth headers
curl http://localhost:3000/api/leaderboard

# Should return 200 with data
```

## Expected Test Results

| Test | Expected Status | Expected Behavior |
|------|----------------|-------------------|
| GET without auth | 200 | Returns leaderboard data |
| GET with Bearer token | 200 | Returns leaderboard data |
| POST without auth | 401 | Rejects with "Not authenticated" |
| POST with Bearer token | 200 | Creates/updates user's row |
| POST with wrong user_id | 200 | Uses auth user_id, ignores payload |

## Troubleshooting

### "Could not connect to localhost:3000"
- Make sure `npm run dev` is running
- Check the port (might be 3001 if 3000 is busy)

### "Not authenticated" errors
- Verify your token is valid (not expired)
- Check token format: `Authorization: Bearer <token>` (note the space)
- Make sure you're logged in if testing cookie-based auth

### "Table does not exist" errors
- Run the SQL to create the `leaderboard_public` table
- Check Supabase connection settings

### RLS policy errors
- Verify RLS is enabled: `ALTER TABLE public.leaderboard_public ENABLE ROW LEVEL SECURITY;`
- Check policies are created correctly
- Verify `auth.uid()` matches `user_id` in your test data

## Next Steps

After local testing passes:
1. Test with your Python CLI tool
2. Test with Google Colab
3. Deploy and test in production environment
