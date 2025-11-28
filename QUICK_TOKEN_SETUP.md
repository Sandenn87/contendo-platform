# Quick GitHub Token Setup

## 🚀 Quick Steps

### 1. Create Token with Workflow Scope

**Go here:** https://github.com/settings/tokens/new

**Settings:**
- **Note:** `Cursor Deployment Token`
- **Expiration:** Your choice (90 days recommended)
- **Scopes:** Check these:
  - ✅ **`repo`** (Full control of private repositories)
  - ✅ **`workflow`** (Update GitHub Action workflows) ⭐ **REQUIRED!**

**Click:** "Generate token"

**Copy the token** (starts with `ghp_...`)

### 2. Update Git Remote

**Option A: Use the script (easiest)**
```bash
./scripts/update-github-token.sh
```
Then paste your token when prompted.

**Option B: Manual update**
```bash
git remote set-url origin https://YOUR_NEW_TOKEN@github.com/Sandenn87/contendo-platform.git
```

### 3. Test It

After updating, I'll push the automation files automatically!

---

## 📋 What This Enables

Once the token has `workflow` scope, I can:
- ✅ Push GitHub Actions workflows (`.github/workflows/*.yml`)
- ✅ Automatically deploy on every push
- ✅ Handle all git operations for you

## 🔒 Security Note

- Never commit tokens to git
- Tokens in git remote URLs are stored locally only
- If you lose the token, just create a new one

