#!/usr/bin/env node

/**
 * Auto Publish Release Script
 * 
 * This script automatically publishes a GitHub release with the current project setup.
 * It builds the project, creates a release, and uploads all necessary files.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const config = {
  owner: 'Panther-Cub',
  repo: 'compress-app',
  token: process.env.GITHUB_TOKEN || process.env.GH_TOKEN
};

if (!config.token) {
  console.error('❌ GITHUB_TOKEN or GH_TOKEN environment variable is required');
  console.log('\n💡 Set your token:');
  console.log('   export GITHUB_TOKEN=your_github_token_here');
  console.log('   or');
  console.log('   export GH_TOKEN=your_github_token_here');
  process.exit(1);
}

// Get current version
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const currentVersion = packageJson.version;

console.log(`🚀 Publishing Release v${currentVersion}\n`);

/**
 * Make HTTP request to GitHub API
 */
function makeRequest(url, options = {}, data = null) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: 'api.github.com',
      path: url,
      method: options.method || 'GET',
      headers: {
        'Authorization': `token ${config.token}`,
        'User-Agent': 'Compress-App-Release-Script',
        'Accept': 'application/vnd.github.v3+json',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`GitHub API error: ${res.statusCode} - ${parsed.message || responseData}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

/**
 * Upload asset to GitHub release
 */
async function uploadAsset(releaseId, assetPath, assetName) {
  const fileStats = fs.statSync(assetPath);
  
  // For large files, use streaming instead of loading into memory
  const fileStream = fs.createReadStream(assetPath);
  
  const url = `/repos/${config.owner}/${config.repo}/releases/${releaseId}/assets?name=${encodeURIComponent(assetName)}`;
  
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: 'api.github.com',
      path: url,
      method: 'POST',
      headers: {
        'Authorization': `token ${config.token}`,
        'User-Agent': 'Compress-App-Release-Script',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/zip',
        'Content-Length': fileStats.size
      }
    };

    const req = https.request(requestOptions, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`GitHub API error: ${res.statusCode} - ${parsed.message || responseData}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    fileStream.pipe(req);
  });
}

/**
 * Create GitHub release
 */
async function createRelease() {
  console.log('📦 Creating GitHub release...');
  
  // Check if release already exists
  try {
    const existingRelease = await makeRequest(`/repos/${config.owner}/${config.repo}/releases/tags/v${currentVersion}`);
    console.log(`✅ Release already exists: ${existingRelease.html_url}`);
    return existingRelease;
  } catch (error) {
    if (error.message.includes('404')) {
      // Release doesn't exist, create it
      const releaseData = {
        tag_name: `v${currentVersion}`,
        name: `Version ${currentVersion}`,
        body: `## What's New\n\n- Fixed About dialog version display\n- Enhanced update system for unsigned signatures\n- Better error handling for update process\n\n## Technical Details\n\n- Version: ${currentVersion}\n- Build Date: ${new Date().toISOString()}\n- Platform: macOS\n\n## Installation\n\nDownload and install the app. Updates will be available automatically.`,
        draft: false,
        prerelease: false
      };

      const release = await makeRequest(`/repos/${config.owner}/${config.repo}/releases`, {
        method: 'POST'
      }, releaseData);

      console.log(`✅ Release created: ${release.html_url}`);
      return release;
    } else {
      throw error;
    }
  }
}

/**
 * Upload release assets
 */
async function uploadAssets(releaseId) {
  const distPath = path.join(__dirname, '..', 'dist');
  const assets = [
    'latest-mac.yml',
    `Compress-${currentVersion}-mac.zip`,
    `Compress-${currentVersion}-mac.zip.blockmap`
  ];

  console.log('\n📤 Uploading assets...');
  
  // Get existing assets to avoid duplicates
  let existingAssets = [];
  try {
    const release = await makeRequest(`/repos/${config.owner}/${config.repo}/releases/${releaseId}`);
    existingAssets = release.assets.map(asset => asset.name);
  } catch (error) {
    console.warn('Could not fetch existing assets:', error.message);
  }
  
  for (const asset of assets) {
    const assetPath = path.join(distPath, asset);
    if (fs.existsSync(assetPath)) {
      // Skip if asset already exists
      if (existingAssets.includes(asset)) {
        console.log(`  ⏭️  ${asset} already exists, skipping...`);
        continue;
      }
      
      try {
        console.log(`  📄 Uploading ${asset}...`);
        const uploadedAsset = await uploadAsset(releaseId, assetPath, asset);
        const sizeMB = (uploadedAsset.size / (1024 * 1024)).toFixed(2);
        console.log(`  ✅ ${asset} uploaded (${sizeMB} MB)`);
      } catch (error) {
        console.error(`  ❌ Failed to upload ${asset}: ${error.message}`);
      }
    } else {
      console.error(`  ❌ Asset not found: ${assetPath}`);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    // Check if dist folder exists
    const distPath = path.join(__dirname, '..', 'dist');
    if (!fs.existsSync(distPath)) {
      console.error('❌ Dist folder not found! Run "npm run dist" first.');
      process.exit(1);
    }

    // Check for required files
    const requiredFiles = [
      'latest-mac.yml',
      `Compress-${currentVersion}-mac.zip`,
      `Compress-${currentVersion}-mac.zip.blockmap`
    ];

    console.log('🔍 Checking required files...');
    for (const file of requiredFiles) {
      const filePath = path.join(distPath, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`  ✅ ${file} (${sizeMB} MB)`);
      } else {
        console.error(`  ❌ ${file} (missing)`);
        process.exit(1);
      }
    }

    // Create release
    const release = await createRelease();
    
    // Upload assets
    await uploadAssets(release.id);

    console.log('\n🎉 Release published successfully!');
    console.log(`🔗 Release URL: ${release.html_url}`);
    console.log(`📥 Download URL: ${release.assets_url}`);
    
    console.log('\n💡 Next steps:');
    console.log('1. Go to the release URL above');
    console.log('2. Click "Set as latest release" if needed');
    console.log('3. Test the update in your app!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createRelease, uploadAssets };
