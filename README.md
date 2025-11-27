# Contendo Business Management Platform

Unified business management platform for Contendo that consolidates healthcare software management, custom training projects, Arbiter platform management, CRM integration (HubSpot), accounting (QuickBooks), and AI-powered decision support.

## Features

- **Healthcare Software Management**: Track SaaS agreements, renewals, developers, billing, and profitability
- **Custom Training Projects**: Manage projects, milestones, cost centers, employees, and P&L reporting
- **Arbiter Platform Management**: Track deployments, subscriptions, server costs, and maintenance
- **CRM Integration**: Sync contacts and accounts from HubSpot, email scanning with Microsoft Graph
- **Financial Management**: QuickBooks integration, cash flow projections, P&L reports, receipt capture
- **AI Assistant**: Priority-based recommendations for profit, team, project health, and acquisition readiness
- **Progressive Web App**: Works seamlessly on iOS/iPadOS without App Store

## Tech Stack

- **Backend**: Node.js, TypeScript, Express
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Database**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Mobile**: Progressive Web App (PWA)

## Prerequisites

- Node.js 18+
- Supabase account (free tier works)
- (Optional) HubSpot, QuickBooks Online, Microsoft Graph API credentials

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd src/client
npm install
cd ../..
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and keys
3. Run the database migrations:
   - Go to SQL Editor in Supabase dashboard
   - Run each migration file in order:
     - `supabase/migrations/001_initial_schema.sql`
     - `supabase/migrations/002_healthcare_tables.sql`
     - `supabase/migrations/003_training_tables.sql`
     - `supabase/migrations/004_arbiter_tables.sql`
     - `supabase/migrations/005_integrations.sql`

### 3. Configure Environment Variables

Copy `env.example` to `.env` and fill in your values:

```bash
cp env.example .env
```

Required variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_KEY` - Your Supabase service role key
- `SESSION_SECRET` - Generate a random string for session encryption

Optional (for integrations):
- `HUBSPOT_API_KEY`, `HUBSPOT_CLIENT_ID`, `HUBSPOT_CLIENT_SECRET`
- `QUICKBOOKS_CLIENT_ID`, `QUICKBOOKS_CLIENT_SECRET`
- `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID`
- `OPENAI_API_KEY` - For AI assistant features

### 4. Configure Frontend Environment

Create `src/client/.env`:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Create Your First User

1. Go to Authentication > Users in Supabase dashboard
2. Create a new user with email/password
3. The user will be automatically created in the `users` table

### 6. Build and Run

**Development Mode:**

```bash
# Terminal 1: Start backend
npm run dev:server

# Terminal 2: Start frontend
npm run dev:client
```

Visit http://localhost:5173 to access the application.

**Production Mode:**

```bash
# Build everything
npm run build

# Start server
npm start
```

## API Endpoints

- `/api/healthcare` - Healthcare project management
- `/api/training` - Training projects
- `/api/arbiter` - Arbiter platform management
- `/api/crm` - HubSpot and Outlook integration
- `/api/financial` - QuickBooks integration
- `/api/ai` - AI recommendations
- `/api/dashboard` - Aggregated dashboard data

## Setting Up Integrations

### HubSpot Integration

1. Go to [HubSpot Developer Portal](https://developers.hubspot.com/)
2. Create a new app
3. Get your Client ID and Client Secret
4. Add redirect URI: `http://localhost:3000/api/crm/hubspot/callback`
5. Add the credentials to your `.env` file
6. In the app, go to CRM > HubSpot Auth and click "Connect"

### QuickBooks Integration

1. Go to [Intuit Developer](https://developer.intuit.com/)
2. Create a new app
3. Get your Client ID and Client Secret
4. Add redirect URI: `http://localhost:3000/api/financial/quickbooks/callback`
5. Add the credentials to your `.env` file
6. In the app, go to Financial > QuickBooks Auth and click "Connect"

### Microsoft Graph (Outlook) Integration

1. Go to [Azure Portal](https://portal.azure.com/)
2. Register a new application
3. Get your Client ID and Client Secret
4. Add redirect URI: `http://localhost:3000/api/crm/outlook/callback`
5. Add API permissions: `Mail.Read`, `Mail.ReadWrite`
6. Add the credentials to your `.env` file
7. In the app, go to CRM > Outlook Auth and click "Connect"

## Project Structure

```
.
├── src/
│   ├── client/              # React frontend
│   │   ├── src/
│   │   │   ├── pages/       # Page components
│   │   │   ├── components/  # Reusable components
│   │   │   └── lib/         # Utilities and API client
│   │   └── package.json
│   ├── routes/              # API routes
│   │   └── api/
│   ├── services/            # Business logic
│   ├── middleware/          # Express middleware
│   ├── config/              # Configuration
│   └── server.ts            # Express server
├── supabase/
│   └── migrations/          # Database migrations
└── package.json
```

## Development

- Backend runs on port 3000
- Frontend dev server runs on port 5173
- API is available at `http://localhost:3000/api`
- Frontend proxies API requests automatically in development

## Deployment

The application can be deployed to any Node.js hosting service:

1. Build the application: `npm run build`
2. Set environment variables on your hosting platform
3. Run migrations on your Supabase project
4. Start the server: `npm start`

For iOS/iPadOS, users can add the web app to their home screen - it will work as a native app thanks to PWA support.

## License

MIT
