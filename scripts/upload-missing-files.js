#!/usr/bin/env node

/**
 * Upload Missing Files Script
 * 
 * This script uploads the missing latest-mac.yml file to the existing GitHub release.
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
  process.exit(1);
}

// Get current version
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const currentVersion = packageJson.version;

console.log(`📤 Uploading missing files for v${currentVersion}\n`);

/**
 * Upload asset to GitHub release
 */
async function uploadAsset(releaseId, assetPath, assetName) {
  return new Promise((resolve, reject) => {
    const fileBuffer = fs.readFileSync(assetPath);
    const fileStats = fs.statSync(assetPath);
    
    const url = `/repos/${config.owner}/${config.repo}/releases/${releaseId}/assets?name=${encodeURIComponent(assetName)}`;
    
    const options = {
      hostname: 'uploads.github.com',
      path: url,
      method: 'POST',
      headers: {
        'Authorization': `token ${config.token}`,
        'User-Agent': 'Compress-App-Uploader',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/octet-stream',
        'Content-Length': fileStats.size
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const asset = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(asset);
          } else {
            reject(new Error(`GitHub API error: ${res.statusCode} - ${asset.message || data}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.write(fileBuffer);
    req.end();
  });
}

/**
 * Get release by tag
 */
async function getReleaseByTag(tag) {
  return new Promise((resolve, reject) => {
    const url = `/repos/${config.owner}/${config.repo}/releases/tags/${tag}`;
    
    const options = {
      hostname: 'api.github.com',
      path: url,
      method: 'GET',
      headers: {
        'Authorization': `token ${config.token}`,
        'User-Agent': 'Compress-App-Uploader',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const release = JSON.parse(data);
          if (res.statusCode === 200) {
            resolve(release);
          } else {
            reject(new Error(`GitHub API error: ${res.statusCode} - ${release.message || data}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });
  });
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🔍 Getting release...');
    const release = await getReleaseByTag(`v${currentVersion}`);
    console.log(`✅ Found release: ${release.html_url}`);

    const distPath = path.join(__dirname, '..', 'dist');
    const files = [
      'latest-mac.yml',
      `Compress-${currentVersion}-mac.zip.blockmap`
    ];

    console.log('\n📤 Uploading missing files...');
    
    for (const file of files) {
      const filePath = path.join(distPath, file);
      if (fs.existsSync(filePath)) {
        try {
          console.log(`  📄 Uploading ${file}...`);
          const uploadedAsset = await uploadAsset(release.id, filePath, file);
          const sizeMB = (uploadedAsset.size / (1024 * 1024)).toFixed(2);
          console.log(`  ✅ ${file} uploaded (${sizeMB} MB)`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`  ⚠️  ${file} already exists`);
          } else {
            console.error(`  ❌ Failed to upload ${file}: ${error.message}`);
          }
        }
      } else {
        console.error(`  ❌ File not found: ${filePath}`);
      }
    }

    console.log('\n🎉 Files uploaded successfully!');
    console.log(`🔗 Release URL: ${release.html_url}`);
    console.log('\n💡 The update system should now work properly!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
