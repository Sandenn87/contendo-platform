# Render Deployment Setup Guide

## Environment Variables for Render

Go to your Render service → **Environment** tab → Add these variables:

### ✅ Required Variables (Must Have)

| Variable Name | Value | Where to Get It |
|--------------|-------|-----------------|
| `SUPABASE_URL` | `https://fgobeudxuuuykvwcminle.supabase.co` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your anon key | Supabase Dashboard → Settings → API → anon public |
| `SUPABASE_SERVICE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnb2JldWR4dXV5a3Z3Y21pbmxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDI2MTk3NSwiZXhwIjoyMDc5ODM3OTc1fQ.ZI00RgHSiOcKRMF42QkGblp4UMCfOXirOQ99m0c0f_8` | Your service role key (keep secret!) |
| `SESSION_SECRET` | `RFcq2OGbVeqfpjOcRaM6u1IUlNMUozvpmZX4FrnLg/o=` | Random secret (already generated) |
| `NODE_ENV` | `production` | Set to production |
| `PORT` | `10000` | Render sets this automatically, but you can set it |

### 🌐 Frontend Variables (For React App)

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `VITE_SUPABASE_URL` | Same as `SUPABASE_URL` | Used by frontend |
| `VITE_SUPABASE_ANON_KEY` | Same as `SUPABASE_ANON_KEY` | Used by frontend |

**Note**: Render will rebuild after adding these. The frontend needs these to connect to Supabase.

### 🔧 Optional Variables (Add Later If Needed)

These are for future integrations - you can add them later:

| Variable Name | Purpose |
|--------------|---------|
| `HUBSPOT_API_KEY` | HubSpot CRM integration |
| `HUBSPOT_CLIENT_ID` | HubSpot OAuth |
| `HUBSPOT_CLIENT_SECRET` | HubSpot OAuth |
| `QUICKBOOKS_CLIENT_ID` | QuickBooks integration |
| `QUICKBOOKS_CLIENT_SECRET` | QuickBooks integration |
| `MICROSOFT_CLIENT_ID` | Outlook email integration |
| `MICROSOFT_CLIENT_SECRET` | Outlook email integration |
| `MICROSOFT_TENANT_ID` | Outlook email integration |
| `OPENAI_API_KEY` | AI assistant features |
| `LOG_LEVEL` | `info` | Logging level (optional) |

## Quick Setup Steps

1. **In Render Dashboard:**
   - Go to your Web Service
   - Click **Environment** tab
   - Click **Add Environment Variable** for each one above

2. **Copy these values:**
   ```
   SUPABASE_URL=https://fgobeudxuuuykvwcminle.supabase.co
   SUPABASE_ANON_KEY=(get from Supabase Dashboard)
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnb2JldWR4dXV5a3Z3Y21pbmxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDI2MTk3NSwiZXhwIjoyMDc5ODM3OTc1fQ.ZI00RgHSiOcKRMF42QkGblp4UMCfOXirOQ99m0c0f_8
   SESSION_SECRET=RFcq2OGbVeqfpjOcRaM6u1IUlNMUozvpmZX4FrnLg/o=
   NODE_ENV=production
   VITE_SUPABASE_URL=https://fgobeudxuuuykvwcminle.supabase.co
   VITE_SUPABASE_ANON_KEY=(same as SUPABASE_ANON_KEY)
   ```

3. **Get SUPABASE_ANON_KEY:**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Settings → API
   - Copy the **anon public** key

4. **After adding variables:**
   - Render will automatically rebuild
   - Wait for deployment to complete
   - Your app will be live!

## Render Configuration

### Build Command
Render will auto-detect your Dockerfile, so no build command needed.

### Start Command
Render will use: `node dist/index.js` (from Dockerfile CMD)

### Health Check Path
Render will check: `/health` (from your Dockerfile HEALTHCHECK)

## After Deployment

1. **Get your Render URL:**
   - Render provides a URL like: `https://contendo-platform.onrender.com`

2. **Test it:**
   - Health: `https://your-app.onrender.com/health`
   - API: `https://your-app.onrender.com/api`
   - Frontend: `https://your-app.onrender.com/`

3. **Create your first user:**
   - Go to Supabase Dashboard → Authentication → Users
   - Add a new user
   - Log in to your app!

## Troubleshooting

- **If build fails**: Check Render logs for errors
- **If frontend doesn't load**: Make sure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- **If can't log in**: Verify user exists in Supabase Authentication

