# GitHub Setup Guide

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `compress-app`
3. Make it **Public** (required for auto-updates)
4. Don't initialize with README (we'll push existing code)

## Step 2: Push Your Code

```bash
# Initialize git if not already done
git init

# Add your GitHub repository as remote
git remote add origin https://github.com/Panther-Cub/compress-app.git

# Add all files
git add .

# Commit
git commit -m "Initial commit: Compress App v0.1.0-beta.3"

# Push to GitHub
git push -u origin main
```

## Step 3: Update package.json

The package.json is already configured correctly:

```json
"publish": [
  {
    "provider": "github",
    "owner": "Panther-Cub",
    "repo": "compress-app"
  }
]
```

## Step 4: Publish Release

```bash
# Set your GitHub token
export GH_TOKEN=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

# Publish
npm run publish
```

## Current Status

- **Repository**: `Panther-Cub/compress-app` ✅
- **Current Version**: `0.1.0-beta.3` ✅
- **Auto-updates**: Configured ✅
