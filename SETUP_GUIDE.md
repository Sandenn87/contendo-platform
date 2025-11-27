# Contendo Platform Setup Guide

This guide will walk you through setting up the Contendo Business Management Platform from scratch.

## Step 1: Supabase Setup

1. **Create Supabase Account**
   - Go to https://supabase.com
   - Sign up for a free account
   - Create a new project
   - Note your project URL and API keys

2. **Run Database Migrations**
   - In Supabase dashboard, go to SQL Editor
   - Run each migration file in order:
     ```
     001_initial_schema.sql
     002_healthcare_tables.sql
     003_training_tables.sql
     004_arbiter_tables.sql
     005_integrations.sql
     ```
   - Copy and paste each file's contents and execute

3. **Enable Storage Bucket for Receipts**
   - Go to Storage in Supabase dashboard
   - Create a new bucket named "receipts"
   - Set it to public or configure RLS policies as needed

## Step 2: Environment Configuration

1. **Backend Environment (.env)**
   ```bash
   cp env.example .env
   ```
   
   Fill in:
   - `SUPABASE_URL` - From Supabase project settings
   - `SUPABASE_ANON_KEY` - From Supabase project settings
   - `SUPABASE_SERVICE_KEY` - From Supabase project settings (service_role key)
   - `SESSION_SECRET` - Generate a random string (e.g., `openssl rand -hex 32`)
   - `PORT` - Default 3000

2. **Frontend Environment (src/client/.env)**
   ```bash
   cd src/client
   cp .env.example .env
   ```
   
   Fill in:
   - `VITE_SUPABASE_URL` - Same as backend SUPABASE_URL
   - `VITE_SUPABASE_ANON_KEY` - Same as backend SUPABASE_ANON_KEY

## Step 3: Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd src/client
npm install
cd ../..
```

## Step 4: Create Your First User

1. Go to Authentication > Users in Supabase dashboard
2. Click "Add user" > "Create new user"
3. Enter your email and password
4. The user will automatically be created in the `users` table

## Step 5: Run the Application

**Development:**
```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend  
npm run dev:client
```

Visit http://localhost:5173 and login with your Supabase user credentials.

## Step 6: Optional Integrations

### HubSpot Setup

1. Go to https://developers.hubspot.com/
2. Create a new app
3. Get Client ID and Client Secret
4. Add redirect URI: `http://localhost:3000/api/crm/hubspot/callback`
5. Add to `.env`:
   ```
   HUBSPOT_CLIENT_ID=your_client_id
   HUBSPOT_CLIENT_SECRET=your_client_secret
   ```

### QuickBooks Setup

1. Go to https://developer.intuit.com/
2. Create a new app (QuickBooks Online)
3. Get Client ID and Client Secret
4. Add redirect URI: `http://localhost:3000/api/financial/quickbooks/callback`
5. Add to `.env`:
   ```
   QUICKBOOKS_CLIENT_ID=your_client_id
   QUICKBOOKS_CLIENT_SECRET=your_client_secret
   ```

### Microsoft Graph Setup

1. Go to https://portal.azure.com/
2. Azure Active Directory > App registrations > New registration
3. Get Client ID and create Client Secret
4. Add redirect URI: `http://localhost:3000/api/crm/outlook/callback`
5. API permissions: Add `Mail.Read` and `Mail.ReadWrite`
6. Add to `.env`:
   ```
   MICROSOFT_CLIENT_ID=your_client_id
   MICROSOFT_CLIENT_SECRET=your_client_secret
   MICROSOFT_TENANT_ID=common (or your tenant ID)
   ```

### OpenAI Setup (for AI Assistant)

1. Go to https://platform.openai.com/
2. Create API key
3. Add to `.env`:
   ```
   OPENAI_API_KEY=your_api_key
   ```

## Troubleshooting

### Database Connection Issues
- Verify Supabase credentials are correct
- Check that migrations ran successfully
- Ensure RLS policies allow your user to access data

### Authentication Issues
- Verify user exists in Supabase Auth
- Check that user record exists in `users` table
- Ensure JWT secret is configured in Supabase

### Integration Issues
- Verify API credentials are correct
- Check redirect URIs match exactly
- Ensure required scopes/permissions are granted

### Frontend Not Loading
- Verify frontend `.env` file exists and has correct values
- Check that backend is running on port 3000
- Verify CORS settings allow your frontend origin

## Next Steps

1. Add your first healthcare client
2. Create a training project
3. Add Arbiter deployments
4. Connect integrations (HubSpot, QuickBooks, Outlook)
5. Start using the AI recommendations

For detailed API documentation, see the API endpoints in the codebase or use the `/api` endpoint to see available routes.

