# GitHub Token Setup Guide

## Step 1: Create/Update GitHub Personal Access Token

1. **Go to GitHub Settings:**
   - Visit: https://github.com/settings/tokens
   - Or: GitHub → Your Profile (top right) → Settings → Developer settings → Personal access tokens → Tokens (classic)

2. **Create New Token (or Edit Existing):**
   - Click **"Generate new token"** → **"Generate new token (classic)"**
   - Give it a name: `Cursor Deployment Token`
   - Set expiration: Choose your preference (90 days, 1 year, or no expiration)

3. **Select Required Scopes:**
   Check these boxes:
   - ✅ **`repo`** - Full control of private repositories (includes all sub-scopes)
   - ✅ **`workflow`** - Update GitHub Action workflows (THIS IS THE KEY ONE!)
   
   The `repo` scope includes:
   - `repo:status`
   - `repo_deployment`
   - `public_repo`
   - `repo:invite`
   - `security_events`

4. **Generate Token:**
   - Click **"Generate token"** at the bottom
   - ⚠️ **IMPORTANT:** Copy the token immediately! You won't see it again.
   - It will look like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Step 2: Update Git Remote URL

After you have the token, I'll help you update the git remote URL to use it.

## Step 3: Test

Once updated, I can push files including GitHub Actions workflows automatically.

