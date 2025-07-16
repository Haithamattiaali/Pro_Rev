#!/usr/bin/env node

import { spawn } from 'child_process';
import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Track running processes
let frontendProcess = null;
let backendProcess = null;

// Log with timestamp and color
function log(message, color = colors.reset) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

// Kill a process and its children
function killProcess(process, name) {
  if (process) {
    log(`Stopping ${name}...`, colors.yellow);
    process.kill('SIGTERM');
    process = null;
  }
}

// Start frontend dev server
function startFrontend() {
  killProcess(frontendProcess, 'frontend');
  
  log('Starting frontend dev server...', colors.cyan);
  frontendProcess = spawn('npm run dev', [], {
    stdio: 'inherit',
    shell: true
  });

  frontendProcess.on('error', (err) => {
    log(`Frontend error: ${err.message}`, colors.red);
  });

  frontendProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      log(`Frontend exited with code ${code}`, colors.red);
    }
  });
}

// Start backend dev server
function startBackend() {
  killProcess(backendProcess, 'backend');
  
  log('Starting backend dev server...', colors.magenta);
  backendProcess = spawn('npm run dev', [], {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: 'development' }
  });

  backendProcess.on('error', (err) => {
    log(`Backend error: ${err.message}`, colors.red);
  });

  backendProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      log(`Backend exited with code ${code}`, colors.red);
    }
  });
}

// Initialize watchers
function initializeWatchers() {
  // Frontend watcher
  const frontendWatcher = chokidar.watch([
    'src/**/*',
    'index.html',
    'vite.config.js',
    'tailwind.config.js',
    'postcss.config.js'
  ], {
    ignored: [
      'node_modules',
      '.git',
      'dist',
      '**/*.log'
    ],
    persistent: true,
    ignoreInitial: true
  });

  // Backend watcher
  const backendWatcher = chokidar.watch([
    'backend/**/*.js',
    'backend/**/*.json',
    '!backend/node_modules/**',
    '!backend/database/*.db*'
  ], {
    ignored: [
      'backend/node_modules',
      'backend/uploads',
      '**/*.log'
    ],
    persistent: true,
    ignoreInitial: true
  });

  // Frontend file change handler
  frontendWatcher
    .on('add', path => log(`Frontend file added: ${path}`, colors.green))
    .on('change', path => {
      log(`Frontend file changed: ${path}`, colors.green);
      log('Frontend will hot-reload automatically', colors.cyan);
    })
    .on('unlink', path => log(`Frontend file removed: ${path}`, colors.yellow));

  // Backend file change handler
  let backendRestartTimeout;
  backendWatcher
    .on('add', path => {
      log(`Backend file added: ${path}`, colors.green);
      clearTimeout(backendRestartTimeout);
      backendRestartTimeout = setTimeout(() => {
        log('Restarting backend due to file addition...', colors.magenta);
        startBackend();
      }, 1000);
    })
    .on('change', path => {
      log(`Backend file changed: ${path}`, colors.green);
      // Nodemon will handle the restart
    })
    .on('unlink', path => {
      log(`Backend file removed: ${path}`, colors.yellow);
      clearTimeout(backendRestartTimeout);
      backendRestartTimeout = setTimeout(() => {
        log('Restarting backend due to file removal...', colors.magenta);
        startBackend();
      }, 1000);
    });

  log('Watchers initialized', colors.green);
}

// Handle process termination
process.on('SIGINT', () => {
  log('\nShutting down dev servers...', colors.yellow);
  killProcess(frontendProcess, 'frontend');
  killProcess(backendProcess, 'backend');
  process.exit();
});

process.on('SIGTERM', () => {
  killProcess(frontendProcess, 'frontend');
  killProcess(backendProcess, 'backend');
  process.exit();
});

// Main execution
console.clear();
log('=================================', colors.bright);
log('Proceed Dashboard Dev Watcher', colors.bright);
log('=================================', colors.bright);
log('');
log('Starting development servers...', colors.green);
log('Frontend: http://localhost:5173', colors.cyan);
log('Backend: http://localhost:3001', colors.magenta);
log('');
log('Press Ctrl+C to stop all servers', colors.yellow);
log('=================================', colors.bright);
log('');

// Check if database directory exists
const dbDir = path.join(__dirname, 'backend', 'database');
if (!fs.existsSync(dbDir)) {
  log('Creating database directory...', colors.yellow);
  fs.mkdirSync(dbDir, { recursive: true });
}

// Also ensure /var/data exists if in production mode
if (process.env.NODE_ENV === 'production') {
  const prodDbDir = '/var/data';
  if (!fs.existsSync(prodDbDir)) {
    try {
      fs.mkdirSync(prodDbDir, { recursive: true });
      log('Created production database directory', colors.green);
    } catch (err) {
      log(`Warning: Could not create production db directory: ${err.message}`, colors.yellow);
    }
  }
}

// Start servers
startFrontend();
setTimeout(() => startBackend(), 2000); // Delay backend start to avoid port conflicts

// Initialize file watchers
setTimeout(() => initializeWatchers(), 5000);