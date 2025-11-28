# Render Secrets & Environment Variables Guide

## ✅ DO NOT Upload Secret Files

**Never commit or upload these files:**
- `.env` files
- Files containing API keys
- Private keys or certificates

## How Render Handles Secrets

Render uses **Environment Variables** in the dashboard - these are:
- ✅ Encrypted and secure
- ✅ Not visible in your code
- ✅ Not committed to Git
- ✅ Only accessible to your running application

## What to Do

### 1. Keep `.env` Files Local Only
Your `.env` file should:
- ✅ Stay on your local machine
- ✅ Be in `.gitignore` (already is)
- ✅ Never be committed to Git
- ✅ Never be uploaded to Render

### 2. Add Secrets as Environment Variables in Render

Instead of uploading `.env` files, add each secret as an **Environment Variable** in Render:

1. Go to your Render service
2. Click **Environment** tab
3. Click **Add Environment Variable**
4. Enter the variable name (e.g., `SUPABASE_SERVICE_KEY`)
5. Enter the value (paste your secret)
6. Click **Save Changes**

### 3. Your `.gitignore` Already Protects You

Your `.gitignore` includes:
```
.env
.env.local
.env.*.local
```

This means `.env` files are **never committed** to Git, so they won't be in your repository.

## Render Environment Variables vs Local .env

| Local Development | Render Production |
|-------------------|-------------------|
| `.env` file | Environment Variables in Dashboard |
| `SUPABASE_URL=...` | Add as `SUPABASE_URL` variable |
| `SUPABASE_ANON_KEY=...` | Add as `SUPABASE_ANON_KEY` variable |
| etc. | etc. |

## Security Best Practices

### ✅ DO:
- Add secrets as Environment Variables in Render dashboard
- Keep `.env` files local only
- Use different values for production if needed
- Rotate secrets periodically

### ❌ DON'T:
- Commit `.env` files to Git
- Upload `.env` files to Render
- Hardcode secrets in your code
- Share secrets in screenshots/logs

## What Files Should Be in Your Repository?

### ✅ Safe to Commit:
- `package.json`
- `Dockerfile`
- Source code (`src/`)
- Configuration files (without secrets)
- `env.example` (template without real values)

### ❌ Never Commit:
- `.env` (actual secrets)
- `node_modules/`
- Build outputs (`dist/`)
- Log files
- Private keys

## Your Current Setup

Your `.gitignore` already protects you:
- ✅ `.env` is ignored
- ✅ `node_modules/` is ignored
- ✅ `dist/` is ignored
- ✅ Logs are ignored

## Summary

**You don't need to upload any secret files to Render.**

Just add your secrets as **Environment Variables** in the Render dashboard. This is:
- More secure
- Easier to manage
- Standard practice
- What Render expects

Your local `.env` file stays on your machine for local development only.

