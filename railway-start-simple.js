#!/usr/bin/env node

/**
 * Railway Production Start Script for VHM24
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚂 Starting VHM24 on Railway...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT);

// Change to backend directory and start the server
const backendPath = path.join(__dirname, 'backend');
const mainScript = path.join(backendPath, 'src', 'index.js');

console.log('Backend path:', backendPath);
console.log('Main script:', mainScript);

// Check if main script exists
const fs = require('fs');
if (!fs.existsSync(mainScript)) {
  console.error('❌ Main script not found:', mainScript);
  process.exit(1);
}

// Set working directory to backend
process.chdir(backendPath);
console.log('Working directory:', process.cwd());

// Start the backend server
const server = spawn('node', ['src/index.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: process.env.PORT || 8000
  }
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`🚂 Server exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🚂 Received SIGTERM, shutting down gracefully...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('🚂 Received SIGINT, shutting down gracefully...');
  server.kill('SIGINT');
});

console.log('✅ VHM24 Backend starting...');
