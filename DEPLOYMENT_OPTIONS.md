# Deployment Options for Contendo Platform

## 🚀 Recommended: Railway (Easiest)

**Why Railway:**
- ✅ One-click deployment from GitHub
- ✅ Automatic HTTPS
- ✅ Free tier available ($5/month for production)
- ✅ Handles both frontend and backend
- ✅ Environment variables managed in dashboard
- ✅ No server management needed

### Steps to Deploy on Railway:

1. **Push your code to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Sign up at Railway**
   - Go to https://railway.app
   - Sign up with GitHub
   - Free tier includes $5 credit/month

3. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

4. **Configure Backend Service**
   - Railway will detect it's a Node.js app
   - Add environment variables in Railway dashboard:
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_KEY`
     - `SESSION_SECRET`
     - `NODE_ENV=production`
     - `PORT` (Railway sets this automatically)

5. **Deploy Frontend Separately**
   - Create another service in same project
   - Point to `src/client` directory
   - Set build command: `npm install && npm run build`
   - Set start command: `npm run preview` (or use Vercel for frontend)

**Cost:** ~$5-10/month for both services

---

## 🌐 Alternative: Render (Free Tier Available)

**Why Render:**
- ✅ Free tier (with limitations)
- ✅ Easy GitHub integration
- ✅ Automatic SSL
- ✅ Simple configuration

### Steps:

1. **Sign up at Render**
   - Go to https://render.com
   - Sign up with GitHub

2. **Deploy Backend**
   - New → Web Service
   - Connect your GitHub repo
   - Settings:
     - Build Command: `npm install && npm run build`
     - Start Command: `npm start`
     - Environment: Node
   - Add environment variables

3. **Deploy Frontend**
   - New → Static Site
   - Connect GitHub repo
   - Build Command: `cd src/client && npm install && npm run build`
   - Publish Directory: `src/client/dist`

**Cost:** Free tier available (with sleep after inactivity)

---

## ⚡ Best Option: Vercel (Frontend) + Railway (Backend)

**Why this combo:**
- ✅ Vercel is FREE and excellent for React apps
- ✅ Railway handles backend easily
- ✅ Best performance and reliability

### Steps:

**Frontend on Vercel:**
1. Go to https://vercel.com
2. Import your GitHub repository
3. Set root directory to `src/client`
4. Vercel auto-detects Vite/React
5. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Deploy!

**Backend on Railway:**
- Follow Railway steps above

**Cost:** FREE (Vercel) + $5/month (Railway) = $5/month total

---

## 📋 Pre-Deployment Checklist

Before deploying, make sure:

- [ ] All code is pushed to GitHub
- [ ] `.env` files are NOT in repository (they're in .gitignore)
- [ ] Environment variables are ready to add to hosting platform
- [ ] Supabase project is set up and migrations run
- [ ] User created in Supabase Authentication

---

## 🔧 Required Environment Variables

### Backend (Railway/Render):
```
SUPABASE_URL=https://fgobeudxuuykvwcminle.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key
SESSION_SECRET=your_session_secret
NODE_ENV=production
PORT=3000 (or let platform set it)
```

### Frontend (Vercel/Render):
```
VITE_SUPABASE_URL=https://fgobeudxuuykvwcminle.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## 🎯 My Recommendation

**Use Railway for everything** - it's the easiest:
1. One platform for both services
2. Simple GitHub integration
3. Environment variables in one place
4. $5/month is reasonable
5. No configuration complexity

---

## 📝 Quick Start: Railway Deployment

1. **Install Railway CLI** (optional but helpful):
   ```bash
   npm i -g @railway/cli
   railway login
   ```

2. **Or use Web Dashboard:**
   - Go to railway.app
   - Click "New Project"
   - "Deploy from GitHub"
   - Select your repo
   - Railway auto-detects and deploys!

3. **Add Environment Variables:**
   - Click on your service
   - Go to "Variables" tab
   - Add all your `.env` variables
   - Service will restart automatically

4. **Get Your URL:**
   - Railway provides a URL like: `your-app.railway.app`
   - You can add custom domain later

That's it! Your app will be live on the web! 🎉

