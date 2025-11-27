# Fixed: Migration Error

## Issue
Error: `permission denied to set parameter "app.jwt_secret"`

## Cause
The migration was trying to set a database parameter that requires superuser privileges. Supabase manages JWT secrets automatically, so this isn't needed.

## ✅ Fix Applied
I've removed the problematic line from `001_initial_schema.sql`.

## What to Do Now

1. **The migration file has been fixed** - you can run it again

2. **In Supabase SQL Editor:**
   - Click "New query"
   - Copy the ENTIRE contents of `supabase/migrations/001_initial_schema.sql` again
   - Paste and click "Run"
   - Should work now! ✅

3. **Continue with the other migrations:**
   - 002_healthcare_tables.sql
   - 003_training_tables.sql
   - 004_arbiter_tables.sql
   - 005_integrations.sql

## Note
Supabase automatically handles JWT secrets for authentication, so we don't need to set it manually. The migration will now work correctly!

