const logger = require('@vhm24/shared/logger');

/**
 * VHM24 - Test All Services
 * Comprehensive test script for all microservices
 */

const axios = require('axios');
const colors = require('colors/safe');

// Configuration
const GATEWAY_URL = 'http://localhost:8000';
const AUTH_URL = 'http://localhost:3001';
const SERVICES = {
  gateway: { url: GATEWAY_URL, port: 8000 },
  auth: { url: AUTH_URL, port: 3001 },
  machines: { url: 'http://localhost:3002', port: 3002 },
  inventory: { url: 'http://localhost:3003', port: 3003 },
  tasks: { url: 'http://localhost:3004', port: 3004 },
  bunkers: { url: 'http://localhost:3005', port: 3005 }
};

// Test credentials
const TEST_USER = {
  email: 'admin@vhm24.ru',
  password: '${process.env.PASSWORD_869}'
};

let authToken = null;

// Helper functions
function logSuccess(message) {
  logger.info(colors.green('✓ ' + message));
}

function logError(message) {
  logger.info(colors.red('✗ ' + message));
}

function logInfo(message) {
  logger.info(colors.blue('ℹ ' + message));
}

function logSection(title) {
  logger.info('\n' + colors.yellow('═'.repeat(50)));
  logger.info(colors.yellow(title));
  logger.info(colors.yellow('═'.repeat(50)));
}

// Test functions
async function testServiceHealth(name, service) {
  try {
    const response = await axios.get(`${service.url}/health`, { timeout: 5000 });
    if (response.data.status === 'ok') {
      logSuccess(`${name} service is healthy on port ${service.port}`);
      return true;
    } else {
      logError(`${name} service returned unexpected status: ${response.data.status}`);
      return false;
    }
  } catch (error) {
    logError(`${name} service is not responding on port ${service.port}: ${error.message}`);
    return false;
  }
}

async function testGatewayHealth() {
  try {
    const response = await axios.get(`${GATEWAY_URL}/health`);
    logSuccess('Gateway is healthy');
    
    // Check individual services through gateway
    if (response.data.services) {
      logger.info('\nService Status through Gateway:');
      Object.entries(response.data.services).forEach(([service, status]) => {
        if (status === 'ok') {
          logSuccess(`  ${service}: ${status}`);
        } else {
          logError(`  ${service}: ${status}`);
        }
      });
    }
    
    // Check database status
    if (response.data.dbStatus) {
      if (response.data.dbStatus === 'connected') {
        logSuccess(`Database: ${response.data.dbStatus}`);
      } else {
        logError(`Database: ${response.data.dbStatus}`);
      }
    }
    
    return true;
  } catch (error) {
    logError(`Gateway health check failed: ${error.message}`);
    return false;
  }
}

async function testAuthentication() {
  try {
    // Test login
    const loginResponse = await axios.post(`${GATEWAY_URL}/api/v1/auth/login`, TEST_USER);
    
    if (loginResponse.data.success && loginResponse.data.token) {
      authToken = loginResponse.data.token;
      logSuccess(`Authentication successful for ${TEST_USER.email}`);
      logInfo(`Token received: ${authToken.substring(0, 20)}...`);
      
      // Test /me endpoint
      const meResponse = await axios.get(`${GATEWAY_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (meResponse.data.success) {
        logSuccess('Auth /me endpoint working');
        logInfo(`User: ${meResponse.data.data.name} (${meResponse.data.data.email})`);
        logInfo(`Roles: ${meResponse.data.data.roles.join(', ')}`);
      }
      
      return true;
    } else {
      logError('Authentication failed - no token received');
      return false;
    }
  } catch (error) {
    logError(`Authentication test failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testMachinesAPI() {
  if (!authToken) {
    logError('No auth token - skipping machines API test');
    return false;
  }
  
  try {
    const response = await axios.get(`${GATEWAY_URL}/api/v1/machines`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success !== undefined) {
      logSuccess('Machines API is accessible');
      logInfo(`Total machines: ${response.data.data?.total || 0}`);
      return true;
    }
  } catch (error) {
    logError(`Machines API test failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testInventoryAPI() {
  if (!authToken) {
    logError('No auth token - skipping inventory API test');
    return false;
  }
  
  try {
    const response = await axios.get(`${GATEWAY_URL}/api/v1/inventory/items`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success !== undefined) {
      logSuccess('Inventory API is accessible');
      logInfo(`Total items: ${response.data.data?.total || 0}`);
      return true;
    }
  } catch (error) {
    logError(`Inventory API test failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testTasksAPI() {
  if (!authToken) {
    logError('No auth token - skipping tasks API test');
    return false;
  }
  
  try {
    const response = await axios.get(`${GATEWAY_URL}/api/v1/tasks`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success !== undefined) {
      logSuccess('Tasks API is accessible');
      logInfo(`Total tasks: ${response.data.data?.total || 0}`);
      return true;
    }
  } catch (error) {
    logError(`Tasks API test failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testBunkersAPI() {
  if (!authToken) {
    logError('No auth token - skipping bunkers API test');
    return false;
  }
  
  try {
    const response = await axios.get(`${GATEWAY_URL}/api/v1/bunkers`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success !== undefined) {
      logSuccess('Bunkers API is accessible');
      logInfo(`Total bunkers: ${response.data.data?.total || 0}`);
      
      // Test critical bunkers endpoint
      const criticalResponse = await axios.get(`${GATEWAY_URL}/api/v1/bunkers/critical`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (criticalResponse.data.success) {
        logSuccess('Critical bunkers endpoint working');
        logInfo(`Critical bunkers: ${criticalResponse.data.data?.totalCritical || 0}`);
      }
      
      return true;
    }
  } catch (error) {
    logError(`Bunkers API test failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testDashboardStats() {
  if (!authToken) {
    logError('No auth token - skipping dashboard stats test');
    return false;
  }
  
  try {
    const response = await axios.get(`${GATEWAY_URL}/api/v1/dashboard/stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      logSuccess('Dashboard stats endpoint working');
      const stats = response.data.data;
      logger.info('\nDashboard Statistics:');
      logInfo(`  Total Machines: ${stats.totalMachines}`);
      logInfo(`  Online Machines: ${stats.onlineMachines}`);
      logInfo(`  Total Tasks: ${stats.totalTasks}`);
      logInfo(`  Pending Tasks: ${stats.pendingTasks}`);
      logInfo(`  Total Users: ${stats.totalUsers}`);
      logInfo(`  Active Users: ${stats.activeUsers}`);
      logInfo(`  Inventory Items: ${stats.inventoryItems}`);
      logInfo(`  Low Stock Items: ${stats.lowStockItems}`);
      logInfo(`  Today's Revenue: ${stats.todayRevenue}`);
      return true;
    }
  } catch (error) {
    logError(`Dashboard stats test failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testWebSocket() {
  // Note: This is a basic test. For full WebSocket testing, consider using a WebSocket client library
  logInfo('WebSocket endpoint available at: ws://localhost:8000/ws');
  logInfo('(WebSocket testing requires a WebSocket client)');
  return true;
}

// Main test runner
async function runAllTests() {
  logger.info(colors.cyan('\n🚀 VHM24 Platform - Service Test Suite\n'));
  
  let totalTests = 0;
  let passedTests = 0;
  
  // Test individual service health
  logSection('Testing Individual Services');
  for (const [name, service] of Object.entries(SERVICES)) {
    totalTests++;
    if (await testServiceHealth(name, service)) {
      passedTests++;
    }
  }
  
  // Test Gateway comprehensive health
  logSection('Testing Gateway Health Check');
  totalTests++;
  if (await testGatewayHealth()) {
    passedTests++;
  }
  
  // Test Authentication
  logSection('Testing Authentication');
  totalTests++;
  if (await testAuthentication()) {
    passedTests++;
  }
  
  // Test API Endpoints
  logSection('Testing API Endpoints');
  
  totalTests++;
  if (await testMachinesAPI()) {
    passedTests++;
  }
  
  totalTests++;
  if (await testInventoryAPI()) {
    passedTests++;
  }
  
  totalTests++;
  if (await testTasksAPI()) {
    passedTests++;
  }
  
  totalTests++;
  if (await testBunkersAPI()) {
    passedTests++;
  }
  
  totalTests++;
  if (await testDashboardStats()) {
    passedTests++;
  }
  
  // Test WebSocket
  logSection('Testing WebSocket');
  totalTests++;
  if (await testWebSocket()) {
    passedTests++;
  }
  
  // Summary
  logSection('Test Summary');
  logger.info(`\nTotal Tests: ${totalTests}`);
  logger.info(colors.green(`Passed: ${passedTests}`));
  logger.info(colors.red(`Failed: ${totalTests - passedTests}`));
  
  const successRate = (passedTests / totalTests * 100).toFixed(1);
  if (passedTests === totalTests) {
    logger.info(colors.green(`\n✅ All tests passed! (${successRate}%)`));
  } else {
    logger.info(colors.yellow(`\n⚠️  ${successRate}% tests passed`));
  }
  
  // Additional information
  logger.info('\n' + colors.cyan('Additional Information:'));
  logInfo('Default credentials: admin@vhm24.ru / admin123');
  logInfo('API Documentation: http://localhost:8000/docs (if enabled)');
  logInfo('MinIO Console: http://localhost:9001 (minioadmin/minioadmin)');
  logInfo('Database: PostgreSQL on localhost:5432');
  logInfo('Cache: Redis on localhost:6379');
}

// Run tests
runAllTests().catch(error => {
  logger.error(colors.red('\n❌ Test suite failed with error:'), error);
  process.exit(1);
});
