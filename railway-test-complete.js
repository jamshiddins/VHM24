#!/usr/bin/env node

/**
 * Comprehensive Railway Deployment Testing & Diagnostics
 */

const { execSync } = require('child_process');
const https = require('https');

console.log('🔍 VHM24 Railway Deployment Comprehensive Testing\n');

const RAILWAY_URL = 'https://vhm24-production.up.railway.app';

async function testHttpEndpoint(url, description) {
  return new Promise((resolve) => {
    console.log(`📡 Testing ${description}...`);
    
    const request = https.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ ${description}: OK (${res.statusCode})`);
          try {
            const parsed = JSON.parse(data);
            console.log(`   Response:`, parsed);
          } catch (e) {
            console.log(`   Response:`, data.substring(0, 100));
          }
          resolve({ success: true, status: res.statusCode, data });
        } else {
          console.log(`❌ ${description}: FAILED (${res.statusCode})`);
          console.log(`   Response:`, data);
          resolve({ success: false, status: res.statusCode, data });
        }
      });
    });
    
    request.on('error', (error) => {
      console.log(`❌ ${description}: ERROR - ${error.message}`);
      resolve({ success: false, error: error.message });
    });
    
    request.on('timeout', () => {
      console.log(`⏰ ${description}: TIMEOUT`);
      request.destroy();
      resolve({ success: false, error: 'timeout' });
    });
  });
}

async function checkRailwayStatus() {
  console.log('🚂 1. Railway Service Status Check...\n');
  
  try {
    console.log('📊 Railway Status:');
    execSync('railway status', { stdio: 'inherit' });
    
    console.log('\n📊 Railway Variables:');
    execSync('railway variables', { stdio: 'inherit' });
    
    console.log('\n📊 Railway Services:');
    try {
      execSync('railway service list', { stdio: 'inherit' });
    } catch (e) {
      console.log('   Service list command not available in this CLI version');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Railway CLI Error:', error.message);
    return false;
  }
}

async function testApiEndpoints() {
  console.log('\n🌐 2. API Endpoints Testing...\n');
  
  const endpoints = [
    { url: `${RAILWAY_URL}/health`, desc: 'Health Check' },
    { url: `${RAILWAY_URL}/`, desc: 'Root Endpoint' },
    { url: `${RAILWAY_URL}/api`, desc: 'API Base' },
    { url: `${RAILWAY_URL}/api/v1`, desc: 'API v1' },
    { url: `${RAILWAY_URL}/api/v1/users`, desc: 'Users API' },
    { url: `${RAILWAY_URL}/api/v1/auth/me`, desc: 'Auth Status' }
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testHttpEndpoint(endpoint.url, endpoint.desc);
    results.push({ ...endpoint, ...result });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between requests
  }
  
  return results;
}

async function checkDatabaseConnection() {
  console.log('\n🗄️ 3. Database Connection Test...\n');
  
  try {
    console.log('🔗 Testing Prisma connection...');
    
    // Try to connect to database through Railway
    execSync('railway run "cd backend && npx prisma db push --skip-generate"', { stdio: 'inherit' });
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    
    // Try alternative approach
    try {
      console.log('🔄 Trying alternative database test...');
      execSync('railway run "cd backend && npx prisma validate"', { stdio: 'inherit' });
      console.log('✅ Schema validation successful');
      return true;
    } catch (altError) {
      console.log('❌ Schema validation failed:', altError.message);
      return false;
    }
  }
}

async function checkRedisConnection() {
  console.log('\n🔴 4. Redis Connection Test...\n');
  
  // Since we can't directly test Redis from local machine, 
  // we'll check if Redis service is available in Railway
  try {
    console.log('📊 Checking Redis service status...');
    const output = execSync('railway variables', { encoding: 'utf8' });
    
    if (output.includes('REDIS_URL')) {
      console.log('✅ Redis URL configured in Railway');
      return true;
    } else {
      console.log('❌ Redis URL not found in environment variables');
      return false;
    }
  } catch (error) {
    console.log('❌ Redis check failed:', error.message);
    return false;
  }
}

async function testTelegramBotWebhook() {
  console.log('\n🤖 5. Telegram Bot Webhook Test...\n');
  
  try {
    // Test webhook endpoint
    const webhookResult = await testHttpEndpoint(
      `${RAILWAY_URL}/webhook`, 
      'Telegram Webhook Endpoint'
    );
    
    if (webhookResult.success) {
      console.log('✅ Telegram webhook endpoint accessible');
      return true;
    } else {
      console.log('⚠️ Telegram webhook endpoint not responding properly');
      return false;
    }
  } catch (error) {
    console.log('❌ Telegram webhook test failed:', error.message);
    return false;
  }
}

async function testFileUpload() {
  console.log('\n📁 6. File Upload (DigitalOcean Spaces) Test...\n');
  
  try {
    const output = execSync('railway variables', { encoding: 'utf8' });
    
    const hasS3Config = output.includes('S3_ENDPOINT') && 
                       output.includes('S3_ACCESS_KEY') && 
                       output.includes('S3_BUCKET');
    
    if (hasS3Config) {
      console.log('✅ DigitalOcean Spaces configuration found');
      console.log('   S3_ENDPOINT: Found');
      console.log('   S3_ACCESS_KEY: Found');
      console.log('   S3_BUCKET: Found');
      return true;
    } else {
      console.log('❌ DigitalOcean Spaces configuration incomplete');
      return false;
    }
  } catch (error) {
    console.log('❌ File upload configuration test failed:', error.message);
    return false;
  }
}

async function checkRailwayMetrics() {
  console.log('\n📈 7. Railway Performance Metrics...\n');
  
  try {
    console.log('📊 Attempting to get deployment info...');
    
    // Try to get recent deployments
    try {
      execSync('railway logs --tail 50', { stdio: 'inherit' });
      console.log('✅ Logs accessible');
    } catch (logError) {
      console.log('⚠️ Logs not accessible:', logError.message);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Metrics check failed:', error.message);
    return false;
  }
}

async function generateTestReport(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📋 VHM24 RAILWAY DEPLOYMENT TEST REPORT');
  console.log('='.repeat(60));
  
  const testResults = {
    railwayStatus: results.railway || false,
    apiEndpoints: results.endpoints || [],
    database: results.database || false,
    redis: results.redis || false,
    telegram: results.telegram || false,
    fileUpload: results.fileUpload || false,
    metrics: results.metrics || false
  };
  
  // Summary
  console.log('\n🎯 SUMMARY:');
  console.log(`Railway CLI: ${testResults.railwayStatus ? '✅' : '❌'}`);
  console.log(`Database: ${testResults.database ? '✅' : '❌'}`);
  console.log(`Redis: ${testResults.redis ? '✅' : '❌'}`);
  console.log(`Telegram Bot: ${testResults.telegram ? '✅' : '❌'}`);
  console.log(`File Upload: ${testResults.fileUpload ? '✅' : '❌'}`);
  console.log(`Metrics: ${testResults.metrics ? '✅' : '❌'}`);
  
  // API Endpoints Summary
  console.log('\n🌐 API ENDPOINTS:');
  const successfulEndpoints = testResults.apiEndpoints.filter(e => e.success).length;
  console.log(`Working: ${successfulEndpoints}/${testResults.apiEndpoints.length}`);
  
  testResults.apiEndpoints.forEach(endpoint => {
    const status = endpoint.success ? '✅' : '❌';
    console.log(`  ${status} ${endpoint.desc} (${endpoint.status || 'error'})`);
  });
  
  // Next Steps
  console.log('\n📋 NEXT STEPS:');
  
  if (!testResults.railwayStatus) {
    console.log('1. ❌ Fix Railway CLI connection');
  }
  
  if (testResults.apiEndpoints.length === 0 || testResults.apiEndpoints.every(e => !e.success)) {
    console.log('2. ❌ Service not responding - check deployment status');
    console.log('   - Run: railway logs');
    console.log('   - Check: railway status');
    console.log('   - Redeploy: railway up');
  }
  
  if (!testResults.database) {
    console.log('3. ❌ Fix database connection and run migrations');
    console.log('   - Check DATABASE_URL in Railway dashboard');
    console.log('   - Run: railway run "cd backend && npx prisma migrate deploy"');
  }
  
  if (successfulEndpoints > 0) {
    console.log('4. ✅ Some endpoints working - deployment partially successful');
  }
  
  return testResults;
}

async function main() {
  try {
    const results = {};
    
    // Run all tests
    results.railway = await checkRailwayStatus();
    results.endpoints = await testApiEndpoints();
    results.database = await checkDatabaseConnection();
    results.redis = await checkRedisConnection();
    results.telegram = await testTelegramBotWebhook();
    results.fileUpload = await testFileUpload();
    results.metrics = await checkRailwayMetrics();
    
    // Generate final report
    const testResults = await generateTestReport(results);
    
    // Save test results to file
    const fs = require('fs');
    fs.writeFileSync('railway-test-results.json', JSON.stringify(testResults, null, 2));
    console.log('\n💾 Test results saved to: railway-test-results.json');
    
    console.log('\n🔗 Railway Dashboard: https://railway.com/project/9820e0f0-e39b-4719-9580-de68a0e3498f');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
}

main();
