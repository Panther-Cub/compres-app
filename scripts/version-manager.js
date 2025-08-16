#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

const config = {
  owner: 'Panther-Cub',
  repo: 'compress-app',
  token: process.env.GH_TOKEN
};

const packageJsonPath = path.join(__dirname, '..', 'package.json');

/**
 * Version management utilities
 */
class VersionManager {
  /**
   * Read current version from package.json
   */
  static getCurrentVersion() {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version;
  }

  /**
   * Parse version string
   */
  static parseVersion(version) {
    // Support both semver and beta formats
    const semverMatch = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
    const betaMatch = version.match(/^(\d+)\.(\d+)\.(\d+)-beta\.(\d+)$/);
    const alphaMatch = version.match(/^(\d+)\.(\d+)\.(\d+)-alpha\.(\d+)$/);
    
    if (semverMatch) {
      return {
        major: parseInt(semverMatch[1]),
        minor: parseInt(semverMatch[2]),
        patch: parseInt(semverMatch[3]),
        prerelease: null,
        prereleaseNumber: null
      };
    } else if (betaMatch) {
      return {
        major: parseInt(betaMatch[1]),
        minor: parseInt(betaMatch[2]),
        patch: parseInt(betaMatch[3]),
        prerelease: 'beta',
        prereleaseNumber: parseInt(betaMatch[4])
      };
    } else if (alphaMatch) {
      return {
        major: parseInt(alphaMatch[1]),
        minor: parseInt(alphaMatch[2]),
        patch: parseInt(alphaMatch[3]),
        prerelease: 'alpha',
        prereleaseNumber: parseInt(alphaMatch[4])
      };
    }
    
    throw new Error(`Invalid version format: ${version}`);
  }

  /**
   * Format version object to string
   */
  static formatVersion(versionObj) {
    if (versionObj.prerelease) {
      return `${versionObj.major}.${versionObj.minor}.${versionObj.patch}-${versionObj.prerelease}.${versionObj.prereleaseNumber}`;
    }
    return `${versionObj.major}.${versionObj.minor}.${versionObj.patch}`;
  }

  /**
   * Bump version
   */
  static bumpVersion(type = 'patch', prerelease = null) {
    const currentVersion = this.getCurrentVersion();
    const versionObj = this.parseVersion(currentVersion);
    
    let newVersion;
    
    switch (type) {
      case 'major':
        newVersion = {
          major: versionObj.major + 1,
          minor: 0,
          patch: 0,
          prerelease: prerelease,
          prereleaseNumber: prerelease ? 1 : null
        };
        break;
      case 'minor':
        newVersion = {
          major: versionObj.major,
          minor: versionObj.minor + 1,
          patch: 0,
          prerelease: prerelease,
          prereleaseNumber: prerelease ? 1 : null
        };
        break;
      case 'patch':
        newVersion = {
          major: versionObj.major,
          minor: versionObj.minor,
          patch: versionObj.patch + 1,
          prerelease: prerelease,
          prereleaseNumber: prerelease ? 1 : null
        };
        break;
      case 'prerelease':
        if (!versionObj.prerelease) {
          throw new Error('Cannot bump prerelease on stable version');
        }
        newVersion = {
          ...versionObj,
          prereleaseNumber: versionObj.prereleaseNumber + 1
        };
        break;
      default:
        throw new Error(`Invalid bump type: ${type}`);
    }
    
    return this.formatVersion(newVersion);
  }

  /**
   * Update package.json with new version
   */
  static updatePackageJson(newVersion) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    packageJson.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    
    // Also update package-lock.json if it exists
    const packageLockPath = path.join(__dirname, '..', 'package-lock.json');
    if (fs.existsSync(packageLockPath)) {
      try {
        const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));
        packageLock.version = newVersion;
        if (packageLock.packages && packageLock.packages['']) {
          packageLock.packages[''].version = newVersion;
        }
        fs.writeFileSync(packageLockPath, JSON.stringify(packageLock, null, 2));
        console.log('✅ Updated package-lock.json');
      } catch (error) {
        console.warn('⚠️  Could not update package-lock.json:', error.message);
      }
    }
  }

  /**
   * Create a new release on GitHub
   */
  static async createRelease(version, releaseNotes = '') {
    if (!config.token) {
      throw new Error('GH_TOKEN environment variable is required');
    }

    const tagName = `v${version}`;
    const releaseName = `Release ${version}`;
    
    const releaseData = {
      tag_name: tagName,
      name: releaseName,
      body: releaseNotes || `Release ${version}`,
      draft: true,
      prerelease: version.includes('-beta') || version.includes('-alpha')
    };

    return new Promise((resolve, reject) => {
      const url = `https://api.github.com/repos/${config.owner}/${config.repo}/releases`;
      const postData = JSON.stringify(releaseData);
      
      const options = {
        method: 'POST',
        headers: {
          'Authorization': `token ${config.token}`,
          'User-Agent': 'Compress-App-Version-Manager',
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      
      const req = https.request(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const release = JSON.parse(data);
            resolve(release);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(new Error(`Failed to create release: ${error.message}`));
      });
      
      req.write(postData);
      req.end();
    });
  }

  /**
   * Get the latest release from GitHub
   */
  static async getLatestRelease() {
    return new Promise((resolve, reject) => {
      const url = `https://api.github.com/repos/${config.owner}/${config.repo}/releases/latest`;
      
      const options = {
        headers: {
          'User-Agent': 'Compress-App-Version-Manager',
          'Accept': 'application/vnd.github.v3+json'
        }
      };
      
      https.get(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const release = JSON.parse(data);
            resolve(release);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      }).on('error', (error) => {
        reject(new Error(`Failed to fetch latest release: ${error.message}`));
      });
    });
  }
}

/**
 * CLI Commands
 */
async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  try {
    switch (command) {
      case 'bump':
        const bumpType = args[0] || 'patch';
        const prerelease = args[1]; // 'beta' or 'alpha'
        
        console.log(`🔄 Bumping version (${bumpType}${prerelease ? `-${prerelease}` : ''})...`);
        
        const currentVersion = VersionManager.getCurrentVersion();
        const newVersion = VersionManager.bumpVersion(bumpType, prerelease);
        
        VersionManager.updatePackageJson(newVersion);
        
        console.log(`✅ Version bumped from ${currentVersion} to ${newVersion}`);
        break;

      case 'release':
        const version = args[0];
        const releaseNotes = args[1] || '';
        
        if (!version) {
          throw new Error('Version is required for release command');
        }
        
        console.log(`🚀 Creating release for version ${version}...`);
        
        const release = await VersionManager.createRelease(version, releaseNotes);
        
        console.log(`✅ Release created successfully!`);
        console.log(`🔗 Release URL: ${release.html_url}`);
        break;

      case 'latest':
        console.log('🔍 Fetching latest release...');
        
        const latestRelease = await VersionManager.getLatestRelease();
        
        console.log(`📦 Latest release: ${latestRelease.name} (${latestRelease.tag_name})`);
        console.log(`🔗 URL: ${latestRelease.html_url}`);
        break;

      case 'current':
        const current = VersionManager.getCurrentVersion();
        console.log(`📋 Current version: ${current}`);
        break;

      case 'help':
      default:
        console.log(`
📦 Compress App Version Manager

Usage:
  node scripts/version-manager.js <command> [options]

Commands:
  bump [type] [prerelease]    Bump version (patch|minor|major|prerelease) [beta|alpha]
  release <version> [notes]   Create a new GitHub release
  latest                      Get the latest GitHub release
  current                     Show current version
  help                        Show this help message

Examples:
  node scripts/version-manager.js bump patch
  node scripts/version-manager.js bump minor beta
  node scripts/version-manager.js bump prerelease
  node scripts/version-manager.js release 1.2.3 "Bug fixes and improvements"
  node scripts/version-manager.js latest

Environment Variables:
  GH_TOKEN                    GitHub personal access token (required for releases)
        `);
        break;
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = VersionManager;
