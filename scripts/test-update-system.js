#!/usr/bin/env node

/**
 * Test Update System Script
 * 
 * This script helps test the in-app update functionality by:
 * 1. Checking current version
 * 2. Verifying dist files exist
 * 3. Providing instructions for GitHub release
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Update System Setup...\n');

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

// Check for required files
const requiredFiles = [
  'latest-mac.yml',
  `Compress-${currentVersion}-mac.zip`,
  `Compress-${currentVersion}-mac.zip.blockmap`
];

console.log('\n📁 Checking dist files:');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(distPath, file);
  const exists = fs.existsSync(filePath);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

if (!allFilesExist) {
  console.error('\n❌ Missing required files! Run "npm run dist" to build.');
  process.exit(1);
}

// Check latest-mac.yml content
const latestMacPath = path.join(distPath, 'latest-mac.yml');
const latestMacContent = fs.readFileSync(latestMacPath, 'utf8');
const ymlVersion = latestMacContent.match(/version: (.+)/)?.[1];

console.log(`\n📋 latest-mac.yml version: ${ymlVersion}`);

if (ymlVersion !== currentVersion) {
  console.error('❌ Version mismatch! latest-mac.yml version does not match package.json');
  process.exit(1);
}

console.log('\n✅ All checks passed!');
console.log('\n🚀 Next steps to test in-app updates:');
console.log('\n1. Create a GitHub release:');
console.log(`   - Go to: https://github.com/Panther-Cub/compress-app/releases`);
console.log(`   - Click "Create a new release"`);
console.log(`   - Tag: v${currentVersion}`);
console.log(`   - Title: Version ${currentVersion}`);
console.log(`   - Upload these files:`);

requiredFiles.forEach(file => {
  console.log(`     - ${file}`);
});

console.log('\n2. Test the update:');
console.log('   - Install version 0.2.0 (if you have it)');
console.log('   - Open the app and go to About dialog');
console.log('   - Check for updates');
console.log('   - Download and install the update');
console.log('   - Verify the About dialog shows version 0.2.1');

console.log('\n3. Alternative test method:');
console.log('   - Run the app in development mode: npm run electron-dev');
console.log('   - The update manager will check for updates automatically');
console.log('   - Check the console for update logs');

console.log('\n📝 Note: Make sure your GitHub repository is public or you have proper authentication set up.');
