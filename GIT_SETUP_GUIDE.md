# Git Repository Setup Guide

This guide will walk you through adding your Contendo Platform files to a new Git repository step-by-step.

## Prerequisites

- Git installed on your computer
- A new repository created on GitHub/GitLab/Bitbucket (empty, no files)

## Step-by-Step Instructions

### Step 1: Check Git Status

First, let's see what files are currently in your project:

```bash
git status
```

**What you'll see:**
- If Git is not initialized, you'll see: `fatal: not a git repository`
- If Git is initialized, you'll see a list of untracked/modified files

### Step 2: Initialize Git Repository (if needed)

If Git is not initialized, run:

```bash
git init
```

**Expected output:**
```
Initialized empty Git repository in /Users/sandennkilloran/Desktop/coding-project/.git/
```

### Step 3: Add All Files to Git

Add all project files to Git staging:

```bash
git add .
```

**What this does:**
- Stages all files in the current directory
- The `.gitignore` file will automatically exclude files like `node_modules/`, `.env`, etc.

**To verify what was added:**
```bash
git status
```

**You should see:**
- Files listed in green (staged for commit)
- Files in `.gitignore` will NOT appear (like `node_modules/`, `.env`)

### Step 4: Create Initial Commit

Commit all the staged files:

```bash
git commit -m "Initial commit: Contendo Business Management Platform"
```

**Expected output:**
```
[main (or master) abc1234] Initial commit: Contendo Business Management Platform
 X files changed, Y insertions(+)
```

### Step 5: Connect to Remote Repository

Connect your local repository to the remote repository you created:

**For GitHub:**
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

**For GitLab:**
```bash
git remote add origin https://gitlab.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

**For Bitbucket:**
```bash
git remote add origin https://bitbucket.org/YOUR_USERNAME/YOUR_REPO_NAME.git
```

**Replace:**
- `YOUR_USERNAME` with your GitHub/GitLab/Bitbucket username
- `YOUR_REPO_NAME` with your repository name

**To verify the remote was added:**
```bash
git remote -v
```

**Expected output:**
```
origin  https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git (fetch)
origin  https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git (push)
```

### Step 6: Push to Remote Repository

Push your code to the remote repository:

**If your default branch is `main`:**
```bash
git push -u origin main
```

**If your default branch is `master`:**
```bash
git push -u origin master
```

**If you get an error about branch names:**
```bash
# Check your current branch name
git branch

# If it says "master" but remote uses "main", rename it:
git branch -M main
git push -u origin main
```

**Expected output:**
```
Enumerating objects: X, done.
Counting objects: 100% (X/X), done.
Delta compression using up to Y threads
Compressing objects: 100% (X/X), done.
Writing objects: 100% (X/X), done.
To https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

## Visual Guide: What Files Should Be Added

### ✅ Files That SHOULD Be Committed:

```
coding-project/
├── .gitignore                    ✅ YES
├── README.md                     ✅ YES
├── SETUP_GUIDE.md               ✅ YES
├── IMPLEMENTATION_SUMMARY.md    ✅ YES
├── GIT_SETUP_GUIDE.md           ✅ YES
├── package.json                  ✅ YES
├── package-lock.json            ✅ YES
├── tsconfig.json                ✅ YES
├── env.example                  ✅ YES
├── docker-compose.yml           ✅ YES (if exists)
├── Dockerfile                   ✅ YES (if exists)
├── src/                         ✅ YES (entire directory)
│   ├── client/
│   │   ├── package.json         ✅ YES
│   │   ├── vite.config.ts       ✅ YES
│   │   ├── tsconfig.json         ✅ YES
│   │   └── src/                 ✅ YES
│   ├── routes/                  ✅ YES
│   ├── services/               ✅ YES
│   ├── middleware/              ✅ YES
│   ├── config/                  ✅ YES
│   └── ...
└── supabase/
    └── migrations/               ✅ YES (all SQL files)
```

### ❌ Files That Should NOT Be Committed (automatically ignored):

```
node_modules/                    ❌ NO (ignored by .gitignore)
src/client/node_modules/         ❌ NO (ignored by .gitignore)
.env                             ❌ NO (ignored by .gitignore)
src/client/.env                  ❌ NO (ignored by .gitignore)
dist/                            ❌ NO (ignored by .gitignore)
logs/                            ❌ NO (ignored by .gitignore)
*.log                            ❌ NO (ignored by .gitignore)
.DS_Store                        ❌ NO (ignored by .gitignore)
```

## Troubleshooting

### Problem: "Permission denied" when pushing

**Solution:**
- Use SSH instead of HTTPS, or
- Configure Git credentials:
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Problem: "Repository not found"

**Solution:**
- Verify the repository URL is correct
- Make sure the repository exists on GitHub/GitLab/Bitbucket
- Check that you have access to the repository

### Problem: "Branch name mismatch"

**Solution:**
```bash
# Rename local branch to match remote
git branch -M main
git push -u origin main
```

### Problem: "Large file" error

**Solution:**
- Make sure `node_modules/` is in `.gitignore`
- If you accidentally added large files:
```bash
git reset HEAD node_modules/
git rm -r --cached node_modules/
git commit -m "Remove node_modules from tracking"
```

## Quick Reference Commands

```bash
# Check status
git status

# Add all files
git add .

# Commit changes
git commit -m "Your commit message"

# Push to remote
git push -u origin main

# View remote
git remote -v

# View commit history
git log --oneline
```

## Next Steps After Pushing

1. **Verify on GitHub/GitLab:**
   - Go to your repository page
   - You should see all your files listed
   - Check that `.env` files are NOT visible (they should be ignored)

2. **Set Repository Settings:**
   - Go to Settings > General
   - Add repository description: "Contendo Business Management Platform"
   - Add topics: `business-management`, `nodejs`, `react`, `typescript`, `supabase`

3. **Protect Sensitive Files:**
   - Double-check that `.env` is not in the repository
   - If it accidentally was added, remove it:
     ```bash
     git rm --cached .env
     git commit -m "Remove .env file"
     git push
     ```

## Complete Command Sequence

Here's the complete sequence of commands to run:

```bash
# 1. Initialize (if needed)
git init

# 2. Add all files
git add .

# 3. Check what will be committed
git status

# 4. Commit
git commit -m "Initial commit: Contendo Business Management Platform"

# 5. Add remote (replace with your URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 6. Push
git push -u origin main
```

That's it! Your files should now be in your repository.

