# GitHub Setup Guide

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `ffmpeg-mac-app`
3. Make it **Public** (required for auto-updates)
4. Don't initialize with README (we'll push existing code)

## Step 2: Push Your Code

```bash
# Initialize git if not already done
git init

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/ffmpeg-mac-app.git

# Add all files
git add .

# Commit
git commit -m "Initial commit: FFmpeg Mac App v1.0.0-beta.1"

# Push to GitHub
git push -u origin main
```

## Step 3: Update package.json

Replace `YOUR_USERNAME` with your actual GitHub username in `package.json`:

```json
"publish": [
  {
    "provider": "github",
    "owner": "YOUR_USERNAME",
    "repo": "ffmpeg-mac-app"
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

## Your GitHub Username

Please tell me your GitHub username so I can update the package.json correctly.
