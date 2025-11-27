# Railway Environment Variables Setup

Your application is now deployed but needs environment variables configured. Follow these steps:

## Required Environment Variables

### 1. Go to Railway Dashboard
1. Open your Railway project: https://railway.app
2. Click on your `contendo-platform` service
3. Go to the **Variables** tab

### 2. Add Required Variables

Add these environment variables (click "New Variable" for each):

#### Supabase (Required)
- **Variable Name**: `SUPABASE_URL`
- **Value**: Your Supabase project URL (from earlier: `https://fgobeudxuuuykvwcminle.supabase.co`)

- **Variable Name**: `SUPABASE_ANON_KEY`
- **Value**: Your Supabase anonymous key (from your Supabase dashboard)

- **Variable Name**: `SUPABASE_SERVICE_KEY`
- **Value**: Your Supabase service role key (the one you provided earlier: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

#### Server Configuration (Required)
- **Variable Name**: `SESSION_SECRET`
- **Value**: Generate a random string (you can use: `openssl rand -base64 32` or any random string)

- **Variable Name**: `NODE_ENV`
- **Value**: `production`

- **Variable Name**: `PORT`
- **Value**: `3000` (Railway will override this, but it's good to set it)

### 3. Optional Variables (Add Later if Needed)

These can be added when you set up integrations:

- `HUBSPOT_API_KEY`
- `QUICKBOOKS_CLIENT_ID`
- `QUICKBOOKS_CLIENT_SECRET`
- `MICROSOFT_CLIENT_ID`
- `OPENAI_API_KEY`

## Quick Setup Steps:

1. In Railway, click **Variables** tab
2. Click **+ New Variable** for each variable above
3. After adding all variables, Railway will automatically redeploy
4. Check the **Deploy Logs** to verify the app starts successfully

## Getting Your Supabase Keys:

If you need to retrieve your Supabase keys again:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_KEY` (keep this secret!)

## After Adding Variables:

Railway will automatically restart your service. Check the **Deploy Logs** to confirm it's running. Once deployed, Railway will provide you with a public URL for your application.

