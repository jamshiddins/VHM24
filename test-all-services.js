const axios = require('axios');
const colors = require('colors');

// Configuration
const BASE_URL = 'http://localhost:8000';
const AUTH_URL = 'http://localhost:3001';
const MACHINES_URL = 'http://localhost:3002';
const INVENTORY_URL = 'http://localhost:3003';
const TASKS_URL = 'http://localhost:3004';

let authToken = null;

// Test utilities
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const logTest = (name, status, message = '') => {
  const statusColor = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  console.log(`[${status[statusColor]}] ${name} ${message}`);
};

const makeRequest = async (method, url, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) config.data = data;
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
};

// Test functions
async function testHealthChecks() {
  console.log('\n=== HEALTH CHECKS ==='.cyan.bold);
  
  const services = [
    { name: 'Gateway', url: `${BASE_URL}/health` },
    { name: 'Auth Service', url: `${AUTH_URL}/health` },
    { name: 'Machines Service', url: `${MACHINES_URL}/health` },
    { name: 'Inventory Service', url: `${INVENTORY_URL}/health` },
    { name: 'Tasks Service', url: `${TASKS_URL}/health` }
  ];
  
  for (const service of services) {
    const result = await makeRequest('GET', service.url);
    if (result.success && result.data.status === 'ok') {
      logTest(`${service.name} Health Check`, 'PASS');
    } else {
      logTest(`${service.name} Health Check`, 'FAIL', `- ${result.error}`);
    }
  }
}

async function testAuthentication() {
  console.log('\n=== AUTHENTICATION TESTS ==='.cyan.bold);
  
  // Test user registration
  const registerData = {
    email: `test-${Date.now()}@vhm24.com`,
    password: 'testpass123',
    name: 'Test User',
    roles: ['OPERATOR']
  };
  
  const registerResult = await makeRequest('POST', `${BASE_URL}/api/v1/auth/register`, registerData);
  if (registerResult.success && registerResult.data.success) {
    logTest('User Registration', 'PASS');
    authToken = registerResult.data.data.token;
  } else {
    logTest('User Registration', 'FAIL', `- ${registerResult.error?.error || registerResult.error}`);
    
    // Try login with default admin
    const loginResult = await makeRequest('POST', `${BASE_URL}/api/v1/auth/login`, {
      email: 'admin@vhm24.ru',
      password: 'admin123'
    });
    
    if (loginResult.success && loginResult.data.success) {
      logTest('Admin Login Fallback', 'PASS');
      authToken = loginResult.data.token;
    } else {
      logTest('Admin Login Fallback', 'FAIL', `- ${loginResult.error?.error || loginResult.error}`);
      return false;
    }
  }
  
  // Test token validation
  if (authToken) {
    const meResult = await makeRequest('GET', `${BASE_URL}/api/v1/auth/me`, null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    if (meResult.success && meResult.data.success) {
      logTest('Token Validation', 'PASS');
      return true;
    } else {
      logTest('Token Validation', 'FAIL', `- ${meResult.error?.error || meResult.error}`);
    }
  }
  
  return false;
}

async function testMachinesService() {
  console.log('\n=== MACHINES SERVICE TESTS ==='.cyan.bold);
  
  if (!authToken) {
    logTest('Machines Service', 'SKIP', '- No auth token');
    return;
  }
  
  const headers = { 'Authorization': `Bearer ${authToken}` };
  
  // Test get machines
  const getMachinesResult = await makeRequest('GET', `${BASE_URL}/api/v1/machines`, null, headers);
  if (getMachinesResult.success && getMachinesResult.data.success) {
    logTest('Get Machines', 'PASS', `- Found ${getMachinesResult.data.data.total} machines`);
  } else {
    logTest('Get Machines', 'FAIL', `- ${getMachinesResult.error?.error || getMachinesResult.error}`);
  }
  
  // Test create machine
  const machineData = {
    code: `CVM-${String(Date.now()).slice(-5)}`,
    serialNumber: `SN${Date.now()}`,
    type: 'COFFEE',
    name: 'Test Coffee Machine'
  };
  
  const createMachineResult = await makeRequest('POST', `${BASE_URL}/api/v1/machines`, machineData, headers);
  if (createMachineResult.success && createMachineResult.data.success) {
    logTest('Create Machine', 'PASS');
    
    // Test get machine by ID
    const machineId = createMachineResult.data.data.id;
    const getMachineResult = await makeRequest('GET', `${BASE_URL}/api/v1/machines/${machineId}`, null, headers);
    if (getMachineResult.success && getMachineResult.data.success) {
      logTest('Get Machine by ID', 'PASS');
    } else {
      logTest('Get Machine by ID', 'FAIL', `- ${getMachineResult.error?.error || getMachineResult.error}`);
    }
  } else {
    logTest('Create Machine', 'FAIL', `- ${createMachineResult.error?.error || createMachineResult.error}`);
  }
  
  // Test machines stats
  const statsResult = await makeRequest('GET', `${BASE_URL}/api/v1/machines/stats`, null, headers);
  if (statsResult.success && statsResult.data.success) {
    logTest('Machines Statistics', 'PASS');
  } else {
    logTest('Machines Statistics', 'FAIL', `- ${statsResult.error?.error || statsResult.error}`);
  }
}

async function testInventoryService() {
  console.log('\n=== INVENTORY SERVICE TESTS ==='.cyan.bold);
  
  if (!authToken) {
    logTest('Inventory Service', 'SKIP', '- No auth token');
    return;
  }
  
  const headers = { 'Authorization': `Bearer ${authToken}` };
  
  // Test get inventory items
  const getItemsResult = await makeRequest('GET', `${BASE_URL}/api/v1/inventory/items`, null, headers);
  if (getItemsResult.success && getItemsResult.data.success) {
    logTest('Get Inventory Items', 'PASS', `- Found ${getItemsResult.data.data.total} items`);
  } else {
    logTest('Get Inventory Items', 'FAIL', `- ${getItemsResult.error?.error || getItemsResult.error}`);
  }
  
  // Test create inventory item
  const itemData = {
    name: 'Test Coffee Beans',
    sku: `SKU-${Date.now()}`,
    unit: 'KG',
    category: 'Coffee',
    price: 25.50,
    minQuantity: 5
  };
  
  const createItemResult = await makeRequest('POST', `${BASE_URL}/api/v1/inventory/items`, itemData, headers);
  if (createItemResult.success && createItemResult.data.success) {
    logTest('Create Inventory Item', 'PASS');
    
    // Test stock movement
    const itemId = createItemResult.data.data.id;
    const movementData = {
      itemId,
      type: 'IN',
      quantity: 10,
      reason: 'Initial stock'
    };
    
    const movementResult = await makeRequest('POST', `${BASE_URL}/api/v1/inventory/stock-movement`, movementData, headers);
    if (movementResult.success && movementResult.data.success) {
      logTest('Stock Movement', 'PASS');
    } else {
      logTest('Stock Movement', 'FAIL', `- ${movementResult.error?.error || movementResult.error}`);
    }
  } else {
    logTest('Create Inventory Item', 'FAIL', `- ${createItemResult.error?.error || createItemResult.error}`);
  }
  
  // Test inventory stats
  const statsResult = await makeRequest('GET', `${BASE_URL}/api/v1/inventory/stats`, null, headers);
  if (statsResult.success && statsResult.data.success) {
    logTest('Inventory Statistics', 'PASS');
  } else {
    logTest('Inventory Statistics', 'FAIL', `- ${statsResult.error?.error || statsResult.error}`);
  }
}

async function testTasksService() {
  console.log('\n=== TASKS SERVICE TESTS ==='.cyan.bold);
  
  if (!authToken) {
    logTest('Tasks Service', 'SKIP', '- No auth token');
    return;
  }
  
  const headers = { 'Authorization': `Bearer ${authToken}` };
  
  // First, get a machine ID for task creation
  const getMachinesResult = await makeRequest('GET', `${BASE_URL}/api/v1/machines`, null, headers);
  let machineId = null;
  
  if (getMachinesResult.success && getMachinesResult.data.success && getMachinesResult.data.data.items.length > 0) {
    machineId = getMachinesResult.data.data.items[0].id;
  }
  
  // Test get tasks
  const getTasksResult = await makeRequest('GET', `${BASE_URL}/api/v1/tasks`, null, headers);
  if (getTasksResult.success && getTasksResult.data.success) {
    logTest('Get Tasks', 'PASS', `- Found ${getTasksResult.data.data.total} tasks`);
  } else {
    logTest('Get Tasks', 'FAIL', `- ${getTasksResult.error?.error || getTasksResult.error}`);
  }
  
  // Test create task (if we have a machine)
  if (machineId) {
    const taskData = {
      title: 'Test Maintenance Task',
      description: 'Test task for system verification',
      machineId,
      priority: 'MEDIUM'
    };
    
    const createTaskResult = await makeRequest('POST', `${BASE_URL}/api/v1/tasks`, taskData, headers);
    if (createTaskResult.success && createTaskResult.data.success) {
      logTest('Create Task', 'PASS');
      
      // Test add task action
      const taskId = createTaskResult.data.data.id;
      const actionData = {
        action: 'COMMENT',
        comment: 'Test comment for task verification'
      };
      
      const actionResult = await makeRequest('POST', `${BASE_URL}/api/v1/tasks/${taskId}/actions`, actionData, headers);
      if (actionResult.success && actionResult.data.success) {
        logTest('Add Task Action', 'PASS');
      } else {
        logTest('Add Task Action', 'FAIL', `- ${actionResult.error?.error || actionResult.error}`);
      }
    } else {
      logTest('Create Task', 'FAIL', `- ${createTaskResult.error?.error || createTaskResult.error}`);
    }
  } else {
    logTest('Create Task', 'SKIP', '- No machines available');
  }
  
  // Test tasks stats
  const statsResult = await makeRequest('GET', `${BASE_URL}/api/v1/tasks/stats`, null, headers);
  if (statsResult.success && statsResult.data.success) {
    logTest('Tasks Statistics', 'PASS');
  } else {
    logTest('Tasks Statistics', 'FAIL', `- ${statsResult.error?.error || statsResult.error}`);
  }
}

async function testDashboardStats() {
  console.log('\n=== DASHBOARD TESTS ==='.cyan.bold);
  
  if (!authToken) {
    logTest('Dashboard', 'SKIP', '- No auth token');
    return;
  }
  
  const headers = { 'Authorization': `Bearer ${authToken}` };
  
  // Test dashboard stats
  const statsResult = await makeRequest('GET', `${BASE_URL}/api/v1/dashboard/stats`, null, headers);
  if (statsResult.success && statsResult.data.success) {
    logTest('Dashboard Statistics', 'PASS');
    console.log('  Dashboard Data:'.gray);
    console.log(`    Machines: ${statsResult.data.data.totalMachines} (${statsResult.data.data.onlineMachines} online)`.gray);
    console.log(`    Tasks: ${statsResult.data.data.totalTasks} (${statsResult.data.data.pendingTasks} pending)`.gray);
    console.log(`    Users: ${statsResult.data.data.totalUsers} (${statsResult.data.data.activeUsers} active)`.gray);
    console.log(`    Inventory: ${statsResult.data.data.inventoryItems} items (${statsResult.data.data.lowStockItems} low stock)`.gray);
  } else {
    logTest('Dashboard Statistics', 'FAIL', `- ${statsResult.error?.error || statsResult.error}`);
  }
}

async function testWebSocketConnection() {
  console.log('\n=== WEBSOCKET TESTS ==='.cyan.bold);
  
  try {
    const WebSocket = require('ws');
    const ws = new WebSocket('ws://localhost:8000/ws');
    
    const wsPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('WebSocket connection timeout'));
      }, 5000);
      
      ws.on('open', () => {
        clearTimeout(timeout);
        ws.send(JSON.stringify({ type: 'test', message: 'Hello WebSocket' }));
      });
      
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'connected' || message.type === 'echo') {
          ws.close();
          resolve(true);
        }
      });
      
      ws.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
    
    await wsPromise;
    logTest('WebSocket Connection', 'PASS');
  } catch (error) {
    logTest('WebSocket Connection', 'FAIL', `- ${error.message}`);
  }
}

// Main test runner
async function runAllTests() {
  console.log('VHM24 Platform - Service Tests'.rainbow.bold);
  console.log('================================'.rainbow);
  
  const startTime = Date.now();
  
  // Wait a bit for services to be ready
  console.log('\nWaiting for services to be ready...'.yellow);
  await delay(3000);
  
  try {
    await testHealthChecks();
    
    const authSuccess = await testAuthentication();
    if (authSuccess) {
      await testMachinesService();
      await testInventoryService();
      await testTasksService();
      await testDashboardStats();
    }
    
    await testWebSocketConnection();
    
  } catch (error) {
    console.error('\nUnexpected error during testing:'.red, error.message);
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log('\n================================'.rainbow);
  console.log(`Tests completed in ${duration}s`.rainbow.bold);
  console.log('================================'.rainbow);
}

// Handle command line execution
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };
