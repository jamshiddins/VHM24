#!/usr/bin/env node

/**
 * Enhanced Railway Production Start Script for VHM24
 * With comprehensive error handling and diagnostics
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚂 Starting VHM24 on Railway...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT);
console.log('Working Directory:', process.cwd());

// Validate environment
function validateEnvironment() {
  console.log('\n🔍 Validating environment...');
  
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'PORT'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    return false;
  }
  
  console.log('✅ Required environment variables present');
  return true;
}

// Check file structure
function validateFileStructure() {
  console.log('\n📁 Validating file structure...');
  
  const backendPath = path.join(__dirname, 'backend');
  const mainScript = path.join(backendPath, 'src', 'index.js');
  const packageJson = path.join(backendPath, 'package.json');
  const prismaSchema = path.join(backendPath, 'prisma', 'schema.prisma');
  
  console.log('Checking paths:');
  console.log('  Backend:', backendPath);
  console.log('  Main script:', mainScript);
  console.log('  Package.json:', packageJson);
  console.log('  Prisma schema:', prismaSchema);
  
  if (!fs.existsSync(backendPath)) {
    console.error('❌ Backend directory not found:', backendPath);
    return false;
  }
  
  if (!fs.existsSync(mainScript)) {
    console.error('❌ Main script not found:', mainScript);
    return false;
  }
  
  if (!fs.existsSync(packageJson)) {
    console.error('❌ Package.json not found:', packageJson);
    return false;
  }
  
  if (!fs.existsSync(prismaSchema)) {
    console.error('❌ Prisma schema not found:', prismaSchema);
    return false;
  }
  
  console.log('✅ All required files present');
  return true;
}

// Test database connection
async function testDatabaseConnection() {
  console.log('\n🗄️ Testing database connection...');
  
  try {
    // Change to backend directory for Prisma commands
    const backendPath = path.join(__dirname, 'backend');
    process.chdir(backendPath);
    
    console.log('Running Prisma validation...');
    const validateProcess = spawn('npx', ['prisma', 'validate'], {
      stdio: 'pipe',
      env: process.env
    });
    
    return new Promise((resolve) => {
      let output = '';
      let errorOutput = '';
      
      validateProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      validateProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      validateProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Prisma schema validation successful');
          resolve(true);
        } else {
          console.error('❌ Prisma validation failed:', errorOutput);
          resolve(false);
        }
      });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        validateProcess.kill();
        console.log('⏰ Database validation timeout');
        resolve(false);
      }, 10000);
    });
  } catch (error) {
    console.error('❌ Database test error:', error.message);
    return false;
  }
}

// Start the application
async function startApplication() {
  console.log('\n🚀 Starting VHM24 application...');
  
  try {
    // Ensure we're in the backend directory
    const backendPath = path.join(__dirname, 'backend');
    process.chdir(backendPath);
    
    console.log('Working directory:', process.cwd());
    console.log('Starting Node.js application...');
    
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
    
    server.on('exit', (code, signal) => {
      if (signal) {
        console.log(`🚂 Server terminated by signal ${signal}`);
      } else {
        console.log(`🚂 Server exited with code ${code}`);
      }
      process.exit(code || 0);
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
    
    console.log('✅ VHM24 Backend started successfully');
    
  } catch (error) {
    console.error('❌ Application start error:', error);
    process.exit(1);
  }
}

// Main execution
async function main() {
  try {
    console.log('\n' + '='.repeat(50));
    console.log('🚂 VHM24 Railway Production Startup');
    console.log('='.repeat(50));
    
    // Step 1: Validate environment
    if (!validateEnvironment()) {
      console.error('❌ Environment validation failed');
      process.exit(1);
    }
    
    // Step 2: Validate file structure
    if (!validateFileStructure()) {
      console.error('❌ File structure validation failed');
      process.exit(1);
    }
    
    // Step 3: Test database connection
    const dbValid = await testDatabaseConnection();
    if (!dbValid) {
      console.log('⚠️ Database validation failed, but continuing...');
    }
    
    // Step 4: Start application
    await startApplication();
    
  } catch (error) {
    console.error('❌ Startup failed:', error);
    process.exit(1);
  }
}

// Add some debug info
console.log('\n📊 Environment Debug Info:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('REDIS_URL exists:', !!process.env.REDIS_URL);
console.log('Platform:', process.platform);
console.log('Node version:', process.version);

main();
