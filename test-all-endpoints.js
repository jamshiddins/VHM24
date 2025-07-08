require('dotenv').config();

const GATEWAY_URL = 'http://localhost:8000';
const TEST_EMAIL = 'admin@vhm24.ru';
const TEST_PASSWORD = 'admin123';

console.log('=== VHM24 Platform Test Suite ===\n');

const tests = {
  infrastructure: {
    'Redis': false,
    'MinIO': false,
    'Supabase': false
  },
  services: {
    'Auth Service': false,
    'Machines Service': false,
    'Inventory Service': false,
    'Tasks Service': false,
    'Gateway': false
  },
  endpoints: {
    'GET /health': false,
    'POST /api/v1/auth/login': false,
    'GET /api/v1/dashboard/stats': false,
    'GET /api/v1/test-db': false,
    'GET /api/v1/tasks': false,
    'GET /api/v1/inventory': false
  },
  functionality: {
    'Authentication': false,
    'Database queries': false,
    'Service routing': false
  }
};

async function testInfrastructure() {
  console.log('📦 Testing Infrastructure...\n');
  
  // Test Redis
  try {
    const redis = require('redis');
    const client = redis.createClient({ url: 'redis://localhost:6379' });
    await client.connect();
    await client.ping();
    await client.quit();
    tests.infrastructure.Redis = true;
    console.log('✅ Redis: Connected');
  } catch (error) {
    console.log('❌ Redis: ' + error.message);
  }
  
  // Test MinIO
  try {
    const response = await fetch('http://localhost:9000/minio/health/live');
    tests.infrastructure.MinIO = response.ok;
    console.log(tests.infrastructure.MinIO ? '✅ MinIO: Available' : '❌ MinIO: Not available');
  } catch (error) {
    console.log('❌ MinIO: ' + error.message);
  }
  
  // Test Supabase
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$connect();
    await prisma.user.count();
    await prisma.$disconnect();
    tests.infrastructure.Supabase = true;
    console.log('✅ Supabase: Connected');
  } catch (error) {
    console.log('❌ Supabase: ' + error.message);
  }
}

async function testServices() {
  console.log('\n🔧 Testing Services...\n');
  
  try {
    const response = await fetch(`${GATEWAY_URL}/health`);
    const data = await response.json();
    
    tests.services.Gateway = data.status === 'ok';
    tests.services['Auth Service'] = data.services.auth === 'ok';
    tests.services['Machines Service'] = data.services.machines === 'ok';
    tests.services['Inventory Service'] = data.services.inventory === 'ok';
    tests.services['Tasks Service'] = data.services.tasks === 'ok';
    
    Object.entries(tests.services).forEach(([name, status]) => {
      console.log(`${status ? '✅' : '❌'} ${name}: ${status ? 'Running' : 'Offline'}`);
    });
  } catch (error) {
    console.log('❌ Could not check services: ' + error.message);
  }
}

async function testEndpoints() {
  console.log('\n🌐 Testing API Endpoints...\n');
  
  // Test health endpoint
  try {
    const response = await fetch(`${GATEWAY_URL}/health`);
    tests.endpoints['GET /health'] = response.ok;
    console.log(`${response.ok ? '✅' : '❌'} GET /health: ${response.status}`);
  } catch (error) {
    console.log('❌ GET /health: ' + error.message);
  }
  
  // Test login
  let token = null;
  try {
    const response = await fetch(`${GATEWAY_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });
    const data = await response.json();
    tests.endpoints['POST /api/v1/auth/login'] = response.ok && data.success;
    tests.functionality.Authentication = response.ok && data.success;
    if (data.data && data.data.accessToken) {
      token = data.data.accessToken;
    }
    console.log(`${response.ok ? '✅' : '❌'} POST /api/v1/auth/login: ${response.status}`);
  } catch (error) {
    console.log('❌ POST /api/v1/auth/login: ' + error.message);
  }
  
  // Test dashboard stats
  try {
    const response = await fetch(`${GATEWAY_URL}/api/v1/dashboard/stats`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    const data = await response.json();
    tests.endpoints['GET /api/v1/dashboard/stats'] = response.ok && data.success;
    tests.functionality['Database queries'] = response.ok && data.success;
    console.log(`${response.ok ? '✅' : '❌'} GET /api/v1/dashboard/stats: ${response.status}`);
    if (data.data) {
      console.log(`   📊 Stats: ${data.data.totalMachines} machines, ${data.data.totalTasks} tasks`);
    }
  } catch (error) {
    console.log('❌ GET /api/v1/dashboard/stats: ' + error.message);
  }
  
  // Test DB connection
  try {
    const response = await fetch(`${GATEWAY_URL}/api/v1/test-db`);
    const data = await response.json();
    tests.endpoints['GET /api/v1/test-db'] = response.ok && data.success;
    console.log(`${response.ok ? '✅' : '❌'} GET /api/v1/test-db: ${response.status}`);
  } catch (error) {
    console.log('❌ GET /api/v1/test-db: ' + error.message);
  }
  
  // Test tasks endpoint
  try {
    const response = await fetch(`${GATEWAY_URL}/api/v1/tasks`);
    tests.endpoints['GET /api/v1/tasks'] = response.ok;
    tests.functionality['Service routing'] = response.ok;
    console.log(`${response.ok ? '✅' : '❌'} GET /api/v1/tasks: ${response.status}`);
  } catch (error) {
    console.log('❌ GET /api/v1/tasks: ' + error.message);
  }
  
  // Test inventory endpoint
  try {
    const response = await fetch(`${GATEWAY_URL}/api/v1/inventory`);
    tests.endpoints['GET /api/v1/inventory'] = response.ok;
    console.log(`${response.ok ? '✅' : '❌'} GET /api/v1/inventory: ${response.status}`);
  } catch (error) {
    console.log('❌ GET /api/v1/inventory: ' + error.message);
  }
}

function generateReport() {
  console.log('\n=== Test Report ===\n');
  
  let totalTests = 0;
  let passedTests = 0;
  
  Object.entries(tests).forEach(([category, items]) => {
    console.log(`\n${category.toUpperCase()}:`);
    Object.entries(items).forEach(([name, passed]) => {
      console.log(`  ${passed ? '✅' : '❌'} ${name}`);
      totalTests++;
      if (passed) passedTests++;
    });
  });
  
  const percentage = Math.round((passedTests / totalTests) * 100);
  console.log(`\n📊 TOTAL: ${passedTests}/${totalTests} tests passed (${percentage}%)`);
  
  // Generate checklist
  console.log('\n=== Checklist ===\n');
  console.log('```');
  Object.entries(tests).forEach(([category, items]) => {
    console.log(`${category}:`);
    Object.entries(items).forEach(([name, passed]) => {
      console.log(`[${passed ? 'x' : ' '}] ${name}`);
    });
    console.log('');
  });
  console.log('```');
  
  // Recommendations
  console.log('\n=== Recommendations ===\n');
  if (!tests.infrastructure.Redis) {
    console.log('🔸 Redis is not running. Run: docker-compose up -d redis');
  }
  if (!tests.infrastructure.MinIO) {
    console.log('🔸 MinIO is not running. Run: docker-compose up -d minio');
  }
  if (!tests.infrastructure.Supabase) {
    console.log('🔸 Database connection failed. Check DATABASE_URL in .env');
  }
  
  const offlineServices = Object.entries(tests.services)
    .filter(([_, status]) => !status)
    .map(([name]) => name);
  
  if (offlineServices.length > 0) {
    console.log(`🔸 Services offline: ${offlineServices.join(', ')}`);
    console.log('   Run: .\\start-all.bat');
  }
  
  if (percentage === 100) {
    console.log('✨ All systems operational! Platform is ready for use.');
  }
}

async function runAllTests() {
  await testInfrastructure();
  await testServices();
  await testEndpoints();
  generateReport();
}

runAllTests().catch(console.error);
