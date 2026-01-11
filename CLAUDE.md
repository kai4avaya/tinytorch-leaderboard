# Tiny Torch Project Knowledge

## UI & Animation
### Flame Animation (`components/flame.module.css`)
- **Pixel Art Logic:** The flame is a 3-frame animation built using a massive list of `box-shadow` values on a 1x1px div.
- **Strict Frame Timing:** To prevent "pulsing" or "shrinking" (interpolation), frames must be held exactly. 
- **Keyframe Syntax:** Always use comma-separated selectors for hold-frames:
  - `0%, 33% { shadow state 1 }`
  - `33.01%, 66% { shadow state 2 }`
  - `66.01%, 100% { shadow state 3 }`
- **Avoid Transitions:** Do NOT apply CSS `transition` or JS interpolated transitions to the flame's `transform` property, as it breaks the crisp pixel-art flicker.

## CLI Authentication Flow
- **Path:** `/cli-login`
- **Profile Guard:** Users are intercepted if their profile is incomplete (`location`, `institution`, `full_name`).
- **Hybrid Location:** Supports Nominatim autocomplete but defaults to manual text entry if no coordinates are selected (triggering background resolution).
- **Test Mode:** Add `?test_ui=true` to the URL to view the Profile Form without a session.

## Environment & Tooling
- **OS:** Linux (Debian 12 / ChromeOS)
- **CLI Tool:** `tito`
- **Stack:** Next.js (App Router), Supabase (Auth/DB/Functions)
