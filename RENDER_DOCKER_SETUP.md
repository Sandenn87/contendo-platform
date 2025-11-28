# Render Docker Build Context Setup

## Build Context Directory

### ✅ Recommended: Leave it blank (defaults to `.`)

**For your project structure:**
- Dockerfile is at the **root** of your repository
- All source files are relative to root
- Build context should be `.` (repository root)

### What Render Does by Default

When Render detects a Dockerfile:
- **Build Context**: Automatically set to the directory containing the Dockerfile (root)
- **Dockerfile Path**: Automatically detected
- **No configuration needed** in most cases

## When to Set Build Context

### ✅ Leave Blank If:
- Dockerfile is at repository root ✅ (your case)
- All files are relative to root ✅ (your case)
- Standard project structure ✅ (your case)

### Set Explicitly If:
- Dockerfile is in a subdirectory
- You have a monorepo structure
- You need files from a different directory

## Your Project Structure

```
coding-project/
├── Dockerfile          ← At root
├── package.json        ← At root
├── src/                ← At root
│   ├── client/         ← Frontend
│   └── ...             ← Backend
└── ...
```

Since everything is at the root level, **leave build context blank**.

## Render Configuration Summary

| Setting | Value | Notes |
|---------|-------|-------|
| **Root Directory** | Leave blank or `.` | Repository root |
| **Build Context** | Leave blank (defaults to `.`) | Same as root |
| **Dockerfile Path** | Auto-detected | `Dockerfile` at root |
| **Build Command** | Leave blank | Uses Dockerfile |
| **Start Command** | Leave blank | Uses Dockerfile CMD |

## What Happens During Build

1. Render clones your repository
2. Detects Dockerfile at root
3. Sets build context to root directory (`.`)
4. Runs `docker build` with that context
5. Dockerfile can access all files via `COPY . .`

## Recommendation

**Leave both Root Directory and Build Context blank.**

Render will:
- ✅ Auto-detect Dockerfile
- ✅ Set build context to root automatically
- ✅ Build everything correctly

Only set it explicitly if Render shows an error or can't find your Dockerfile.

