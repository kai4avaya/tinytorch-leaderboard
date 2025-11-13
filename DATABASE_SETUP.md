# Database Setup for Leaderboard

## Required SQL

Run this SQL in your Supabase SQL Editor to set up the leaderboard table correctly:

```sql
-- 1) Create table
CREATE TABLE IF NOT EXISTS public.leaderboard_public (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  successful_submissions integer NOT NULL DEFAULT 0,
  overall_score numeric(10,4) NOT NULL DEFAULT 0,
  optimization_score numeric(10,4) NOT NULL DEFAULT 0,
  accuracy_score numeric(10,4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Add UNIQUE constraint on user_id (IMPORTANT for upsert to work)
-- This ensures each user can only have one leaderboard entry
ALTER TABLE public.leaderboard_public 
  ADD CONSTRAINT leaderboard_public_user_id_key UNIQUE (user_id);

-- 3) Enable RLS
ALTER TABLE public.leaderboard_public ENABLE ROW LEVEL SECURITY;

-- 4) Policies
-- Allow any client to read
CREATE POLICY IF NOT EXISTS leaderboard_public_allow_select ON public.leaderboard_public
  FOR SELECT TO PUBLIC
  USING (true);

-- Allow authenticated users to INSERT only if their auth.uid() matches the user_id they insert
CREATE POLICY IF NOT EXISTS leaderboard_public_insert_own ON public.leaderboard_public
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Allow authenticated users to UPDATE only their own rows
CREATE POLICY IF NOT EXISTS leaderboard_public_update_own ON public.leaderboard_public
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Allow authenticated users to DELETE only their own rows
CREATE POLICY IF NOT EXISTS leaderboard_public_delete_own ON public.leaderboard_public
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 5) Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leaderboard_public_overall_score_desc ON public.leaderboard_public (overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_public_user_id ON public.leaderboard_public (user_id);
```

## Important Notes

1. **UNIQUE constraint on `user_id`**: This is critical! Without it, the upsert operation will fail. The API code uses UPDATE-then-INSERT pattern, but having a UNIQUE constraint prevents duplicate entries and allows for future optimization.

2. **RLS Policies**: These ensure:
   - Anyone can read the leaderboard (public)
   - Only authenticated users can write
   - Users can only modify their own entries

3. **Indexes**: The indexes on `overall_score` and `user_id` improve query performance.

## Verification

After running the SQL, verify:

```sql
-- Check table exists
SELECT * FROM public.leaderboard_public LIMIT 1;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'leaderboard_public';

-- Check unique constraint exists
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'public.leaderboard_public'::regclass 
AND contype = 'u';
```

## Troubleshooting

### Error: "there is no unique or exclusion constraint matching the ON CONFLICT specification"
- **Solution**: Run the `ALTER TABLE` statement above to add the UNIQUE constraint on `user_id`

### Error: "new row violates row-level security policy"
- **Solution**: Make sure RLS policies are created and the user is authenticated with a valid JWT

### Error: "permission denied for table leaderboard_public"
- **Solution**: Ensure RLS policies allow the operation (SELECT for public, INSERT/UPDATE for authenticated)
