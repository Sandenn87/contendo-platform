# Supabase Setup Guide - Step by Step

## Step 1: Create Supabase Account & Project

1. **Go to Supabase**
   - Visit: https://supabase.com
   - Click **"Start your project"** or **"Sign up"**

2. **Sign Up**
   - Sign up with GitHub, Google, or email
   - Free tier is fine for development

3. **Create New Project**
   - Click **"New Project"**
   - Fill in:
     - **Name**: `contendo-platform` (or any name)
     - **Database Password**: Create a strong password (save this!)
     - **Region**: Choose closest to you
     - **Pricing Plan**: Free tier is fine
   - Click **"Create new project"**
   - Wait 2-3 minutes for project to initialize

## Step 2: Run Database Migrations

1. **Open SQL Editor**
   - In Supabase dashboard, click **"SQL Editor"** in left sidebar
   - Click **"New query"**

2. **Run Migration 1: Initial Schema**
   - Open file: `supabase/migrations/001_initial_schema.sql`
   - Copy ALL the contents
   - Paste into SQL Editor
   - Click **"Run"** (or press `Cmd+Enter`)
   - Should see: "Success. No rows returned"

3. **Run Migration 2: Healthcare Tables**
   - Click **"New query"** again
   - Open: `supabase/migrations/002_healthcare_tables.sql`
   - Copy ALL contents
   - Paste and click **"Run"**

4. **Run Migration 3: Training Tables**
   - Click **"New query"**
   - Open: `supabase/migrations/003_training_tables.sql`
   - Copy ALL contents
   - Paste and click **"Run"**

5. **Run Migration 4: Arbiter Tables**
   - Click **"New query"**
   - Open: `supabase/migrations/004_arbiter_tables.sql`
   - Copy ALL contents
   - Paste and click **"Run"**

6. **Run Migration 5: Integrations**
   - Click **"New query"**
   - Open: `supabase/migrations/005_integrations.sql`
   - Copy ALL contents
   - Paste and click **"Run"**

**✅ Verify:** Go to **"Table Editor"** - you should see many tables listed!

## Step 3: Create Storage Bucket for Receipts

1. **Go to Storage**
   - Click **"Storage"** in left sidebar
   - Click **"New bucket"**

2. **Create Bucket**
   - **Name**: `receipts`
   - **Public bucket**: Toggle ON (or leave OFF and configure RLS)
   - Click **"Create bucket"**

## Step 4: Get Your API Credentials

1. **Go to Settings**
   - Click **"Settings"** (gear icon) in left sidebar
   - Click **"API"**

2. **Copy These Values:**
   - **Project URL**: Looks like `https://xxxxx.supabase.co`
   - **anon public** key: Long string starting with `eyJ...`
   - **service_role** key: Long string (keep this SECRET!)

## Step 5: Configure Your .env Files

### Backend Configuration

1. **Create .env file** (if it doesn't exist):
   ```bash
   cp env.example .env
   ```

2. **Edit .env file** and add:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_KEY=your_service_role_key_here
   SESSION_SECRET=generate_a_random_string_here
   PORT=3000
   NODE_ENV=development
   LOG_LEVEL=info
   LOG_FILE_PATH=./logs
   ```

   **To generate SESSION_SECRET:**
   ```bash
   openssl rand -hex 32
   ```
   Copy the output and paste it as SESSION_SECRET

### Frontend Configuration

1. **Create frontend .env file:**
   ```bash
   cd src/client
   cp .env.example .env
   ```

2. **Edit src/client/.env** and add:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

   (Use the SAME values as backend, but with `VITE_` prefix)

## Step 6: Create Your First User

1. **Go to Authentication**
   - Click **"Authentication"** in left sidebar
   - Click **"Users"** tab

2. **Add User**
   - Click **"Add user"** → **"Create new user"**
   - Enter:
     - **Email**: your-email@example.com
     - **Password**: create a password
   - Click **"Create user"**

3. **Verify User Created**
   - The user should appear in the list
   - A record should automatically be created in the `users` table

## Step 7: Verify Setup

### Check Tables Exist

1. Go to **"Table Editor"**
2. You should see tables like:
   - `users`
   - `contacts`
   - `accounts`
   - `healthcare_clients`
   - `healthcare_projects`
   - `training_projects`
   - `arbiter_deployments`
   - And many more...

### Test Connection

In Cursor terminal, you can test the connection:

```bash
# Install dependencies first (if not done)
npm install

# Then test (this will fail until you configure .env, but shows if setup is working)
npm run dev:server
```

## ✅ You're Done!

Once you complete these steps:
- ✅ Database is set up with all tables
- ✅ Storage bucket is ready
- ✅ API credentials are configured
- ✅ User is created
- ✅ Ready to run the application!

## Next Steps

After Supabase is set up:
1. Install dependencies: `npm install` and `cd src/client && npm install`
2. Run the app: `npm run dev:server` and `npm run dev:client`
3. Visit http://localhost:5173 and login!

## Troubleshooting

### "Migration failed"
- Make sure you're copying the ENTIRE file contents
- Run migrations in order (001, 002, 003, 004, 005)
- Check for error messages in SQL Editor

### "Cannot connect to Supabase"
- Verify `.env` files have correct credentials
- Check that Project URL doesn't have trailing slash
- Make sure project is active (not paused)

### "User not found"
- Make sure you created user in Authentication → Users
- Check that user exists in `users` table (Table Editor)

### "Storage bucket not found"
- Verify bucket name is exactly `receipts`
- Check bucket exists in Storage section

## Quick Reference

**Your Supabase Dashboard:**
- SQL Editor: Run migrations here
- Table Editor: View your data
- Storage: Manage file uploads
- Authentication: Manage users
- Settings → API: Get credentials

**Your Project Files:**
- `.env` - Backend configuration
- `src/client/.env` - Frontend configuration
- `supabase/migrations/` - Database migrations

Good luck! 🚀

