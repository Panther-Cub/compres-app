#!/usr/bin/env node

/**
 * Upload Release Script
 * 
 * This script helps upload the built files to GitHub releases.
 * It provides instructions and file paths for manual upload.
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 GitHub Release Upload Helper\n');

// Check current version
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const currentVersion = packageJson.version;
console.log(`📦 Current version: ${currentVersion}`);

// Check dist folder
const distPath = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ Dist folder not found! Run "npm run dist" first.');
  process.exit(1);
}

// Get file sizes
const files = [
  'latest-mac.yml',
  `Compress-${currentVersion}-mac.zip`,
  `Compress-${currentVersion}-mac.zip.blockmap`
];

console.log('\n📁 Files to upload:');
let totalSize = 0;

files.forEach(file => {
  const filePath = path.join(distPath, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    totalSize += stats.size;
    console.log(`  📄 ${file} (${sizeMB} MB)`);
  } else {
    console.log(`  ❌ ${file} (missing)`);
  }
});

const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
console.log(`\n📊 Total size: ${totalSizeMB} MB`);

console.log('\n🔗 GitHub Release Instructions:');
console.log('\n1. Go to GitHub Releases:');
console.log(`   https://github.com/Panther-Cub/compress-app/releases`);

console.log('\n2. Click "Create a new release"');

console.log('\n3. Fill in the release details:');
console.log(`   - Tag: v${currentVersion}`);
console.log(`   - Title: Version ${currentVersion}`);
console.log(`   - Description: Update with improved About dialog version display`);

console.log('\n4. Upload these files (drag and drop):');
files.forEach(file => {
  const filePath = path.join(distPath, file);
  console.log(`   - ${filePath}`);
});

console.log('\n5. Click "Publish release"');

console.log('\n✅ After publishing, the app should detect the update!');
console.log('\n💡 Test the update:');
console.log('   - Open the app (if running version 0.2.0)');
console.log('   - Go to About dialog to see current version');
console.log('   - Check for updates');
console.log('   - Download and install the update');
console.log('   - Verify About dialog shows version 0.2.1');

console.log('\n🔍 Debug info:');
console.log(`   - Current app version: ${currentVersion}`);
console.log(`   - GitHub repo: Panther-Cub/compress-app`);
console.log(`   - Update feed URL: https://github.com/Panther-Cub/compress-app/releases/latest/download/latest-mac.yml`);
