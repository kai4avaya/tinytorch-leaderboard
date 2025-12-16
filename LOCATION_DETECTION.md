# Automatic Location Detection Implementation

## Overview
Automatically detects and updates user location after signup using IP geolocation. This happens **behind the scenes** without requiring any user action.

## Architecture

### Components

1. **`lib/location-service.ts`** - Core service for location detection and updates
   - `detectLocation()` - Fetches location via ipapi.co
   - `updateProfileLocation()` - Updates profiles table via RLS-protected query

2. **`components/location-detector.tsx`** - Client-side React component
   - Runs once per session
   - Checks if location already exists (avoids duplicate API calls)
   - Only updates if location is missing

3. **Server Actions** - Updated to handle immediate session cases:
   - `app/cli-login/actions.ts` - CLI signup flow
   - `app/(auth)/login/actions.ts` - Web signup flow

### When Location Detection Happens

The implementation covers **all signup scenarios**:

#### Scenario 1: Signup with Auto-Confirm DISABLED (Email Required)
1. User signs up → no session yet
2. User confirms email → session created
3. User redirects to `/dashboard` or `/cli-login`
4. **`<LocationDetector>` component** runs client-side
5. Location detected and saved

#### Scenario 2: Signup with Auto-Confirm ENABLED (Instant Session)
1. User signs up → session created immediately
2. **Server action** detects location on the server
3. Location saved before redirect
4. If server detection fails, **`<LocationDetector>` component** catches it client-side

#### Scenario 3: CLI Login Flow
1. User signs up via CLI → session may be immediate or require confirmation
2. Both server-side (in actions) and client-side (`<LocationDetector>`) handle it
3. Works for both `/cli-login` page and profile completion flows

## Database Requirements

### Prerequisites
Your database must have:

1. **`profiles` table** with `location` (text), `latitude` (numeric), and `longitude` (numeric) columns
2. **RLS Policy** allowing authenticated users to update their own profile:
   ```sql
   CREATE POLICY "Users can update own profile" 
   ON public.profiles
   FOR UPDATE 
   TO authenticated
   USING (auth.uid() = id)
   WITH CHECK (auth.uid() = id);
   ```

3. **Trigger** that creates profile on user signup:
   ```sql
   CREATE OR REPLACE FUNCTION public.on_auth_user_created()
   RETURNS trigger AS $$
   BEGIN
     INSERT INTO public.profiles (id, email)
     VALUES (NEW.id, NEW.email);
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW EXECUTE FUNCTION public.on_auth_user_created();
   ```

## Security

- Uses **Row Level Security (RLS)** - users can only update their own profile
- Location detection is **non-blocking** - signup succeeds even if location detection fails
- API calls have **5-second timeout** to prevent hanging
- Only runs **once per session** via client-side ref tracking

## API Used

- **ipapi.co** - Free IP geolocation API (no auth required)
- Returns: `{ city, country_name, latitude, longitude, ... }`
- Fallback: If city unavailable, uses country only

## Testing

To test the implementation:

1. **New signup (email confirmation disabled)**:
   ```bash
   # Sign up → immediately logged in → location saved
   ```

2. **New signup (email confirmation enabled)**:
   ```bash
   # Sign up → confirm email → redirected to dashboard → location saved
   ```

3. **Check profile**:
   ```sql
   SELECT id, email, location, latitude, longitude FROM public.profiles WHERE email = 'test@example.com';
   ```

Expected: Location field populated with "City, Country" or "Country", and lat/long with numeric values.

## Error Handling

- Location detection failures are logged but **don't block signup**
- If server-side detection fails, client-side component retries
- If location already exists, no API call is made
- Component is idempotent - safe to render multiple times

## Files Modified

```
✅ Created: lib/location-service.ts
✅ Created: components/location-detector.tsx
✅ Modified: app/cli-login/actions.ts
✅ Modified: app/(auth)/login/actions.ts
✅ Modified: app/dashboard/page.tsx
✅ Modified: app/cli-login/page.tsx
```

## Future Improvements

- Cache detected locations to reduce API calls
- Allow users to manually override detected location
- Support multiple location providers as fallbacks
- Add location to profile creation trigger (server-side only)
