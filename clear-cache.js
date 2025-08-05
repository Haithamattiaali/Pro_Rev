#!/usr/bin/env node

/**
 * Node.js Cache Clear Script
 * Removes all caches, dependencies, and build artifacts
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function removeItem(itemPath) {
  try {
    if (fs.existsSync(itemPath)) {
      fs.rmSync(itemPath, { recursive: true, force: true });
      log(`✓ Removed ${itemPath}`, 'green');
    }
  } catch (error) {
    log(`✗ Failed to remove ${itemPath}: ${error.message}`, 'red');
  }
}

function execCommand(command, description) {
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✓ ${description}`, 'green');
  } catch (error) {
    log(`✗ ${description} failed`, 'red');
  }
}

async function main() {
  log('🧹 Starting complete Node.js cache cleanup...', 'green');
  console.log();

  // Step 1: Remove dependencies and lock files
  log('📋 Step 1: Removing dependencies and lock files...', 'yellow');
  const dependencyItems = [
    'node_modules',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    '.pnpm'
  ];
  
  dependencyItems.forEach(removeItem);
  console.log();

  // Step 2: Clear package manager caches
  log('📋 Step 2: Clearing package manager caches...', 'yellow');
  execCommand('npm cache clean --force', 'npm cache cleared');
  
  // Check for other package managers
  try {
    execSync('which yarn', { stdio: 'ignore' });
    execCommand('yarn cache clean', 'yarn cache cleared');
  } catch {}
  
  try {
    execSync('which pnpm', { stdio: 'ignore' });
    execCommand('pnpm store prune', 'pnpm store pruned');
  } catch {}
  console.log();

  // Step 3: Remove build artifacts
  log('📋 Step 3: Removing build artifacts...', 'yellow');
  const buildArtifacts = [
    'dist',
    'build',
    '.next',
    '.nuxt',
    '.cache',
    '.parcel-cache',
    'coverage',
    '.turbo',
    '.svelte-kit',
    'out',
    'public/build',
    '.vite',
    '.rollup.cache',
    '.webpack',
    '.eslintcache',
    '.stylelintcache',
    '.tmp',
    'temp',
    '.temp',
    // Deployment artifacts
    '.netlify',
    '.vercel',
    '.render',
    'netlify.toml',
    'render.yaml',
    // GitHub artifacts
    '.github'
  ];
  
  buildArtifacts.forEach(removeItem);
  console.log();

  // Step 4: Remove log files
  log('📋 Step 4: Removing log files...', 'yellow');
  const logPatterns = [
    '*.log',
    'npm-debug.log*',
    'yarn-debug.log*',
    'yarn-error.log*',
    'lerna-debug.log*',
    // Deployment files
    '*.zip',
    'deploy*.sh',
    '*deploy*.py',
    'DEPLOY*.md',
    '*DEPLOYMENT*.md'
  ];
  
  logPatterns.forEach(pattern => {
    try {
      const files = fs.readdirSync('.').filter(file => {
        if (pattern.includes('*')) {
          const regex = new RegExp(pattern.replace('*', '.*'));
          return regex.test(file);
        }
        return file === pattern;
      });
      
      files.forEach(file => removeItem(file));
    } catch {}
  });
  console.log();

  // Step 5: Verify cleanup
  log('📋 Step 5: Verifying cleanup...', 'yellow');
  execCommand('npm cache verify', 'Cache verification');
  console.log();

  log('✅ Cache cleanup complete!', 'green');
  console.log();
  log('Next steps:', 'cyan');
  log('1. Run "npm install" to reinstall dependencies');
  log('2. Run your build command to regenerate artifacts');
}

// Run the script
main().catch(error => {
  log(`Error: ${error.message}`, 'red');
  process.exit(1);
});