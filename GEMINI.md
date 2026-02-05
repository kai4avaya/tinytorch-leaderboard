# Tiny Torch Project Memory

## ✅ Solved Authentication Issues

- [x] **Infinite Redirect Loop:** Caused by `router.refresh()` re-reading tokens from the URL. **Fixed** by stripping tokens with `router.replace()`.
- [x] **Blocked Localhost Redirect:** Caused by browser security blocking HTTPS->HTTP navigation. **Fixed** by using `window.location.href`.
- [x] **Session Loss:** Caused by cookie failures on cross-domain redirects. **Fixed** by explicitly passing `access_token` in the URL.
- [x] **Profile Bypass:** Users could access CLI without profile. **Fixed** by the `ProfileGuard` interceptor.
- [x] **Password Reset Session Expired:** Links pointed directly to the reset page without exchanging the auth code. **Fixed** by implementing a **Callback Relay**: email links now point to `/api/auth/callback?next=/auth/reset-password` to ensure the session is established before the user lands on the reset form.

## 🟦 Architecture & Key Files

### 1. The "Profile Guard" Pattern
**Goal:** Force users to complete their profile (Location, Institution) before accessing the CLI tool.
- **File:** `app/cli-login/page.tsx`
- **Logic:**
  1. Checks `supabase.auth.getUser()`.
  2. If `!profile.location` or `!profile.institution`: Renders `ProfileForm`.
  3. If Complete: Renders `RedirectWithMessage`.

### 2. OAuth Session Synchronization
**Goal:** Ensure users are logged in even if cookies fail (common in Netlify -> Localhost flows).
- **File:** `app/api/auth/callback/route.ts`
  - *Action:* Appends `&access_token=...` to the destination URL.
- **File:** `components/session-syncer.tsx`
  - *Action:* Client-side `supabase.auth.setSession()`.
  - *Crucial:* Calls `router.replace()` to **remove tokens** from the URL bar to prevent infinite loops.

### 3. The "Handoff" (CLI Redirect)
**Goal:** Send the user from the HTTPS Web App back to the HTTP Localhost CLI.
- **File:** `app/cli-login/actions.ts` (`updateProfile`)
  - *Action:* Returns `{ redirectUrl: 'http://127.0.0.1:...' }` instead of using `redirect()`.
- **File:** `app/cli-login/profile-form.tsx`
  - *Action:* Uses `window.location.href = result.redirectUrl` for a hard navigation.

### 4. Visuals & Animation
- **File:** `components/flame.module.css`
  - *Technique:* **Pixel Art Hold-Frames**. Uses comma-separated keyframes (e.g., `0%, 33%`) to prevent interpolation pulsing.
- **File:** `components/interactive-flame.tsx`
  - *Features:* Snake-style water drops, Blue rising steam, synchronized extinguish timing.