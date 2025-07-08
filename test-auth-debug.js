require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const TEST_EMAIL = 'admin@vhm24.uz';
const TEST_PASSWORD = 'admin123';

// Helper function to test endpoints
async function testEndpoint(name, url, options = {}) {
  console.log(`\n${name}:`);
  try {
    const response = await fetch(url, options);
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    console.log('Response:', typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
    return { response, data };
  } catch (error) {
    console.log('Error:', error.message);
    return { error };
  }
}

async function checkServiceHealth() {
  console.log('=== Checking Service Health ===');
  
  const services = [
    { name: 'Auth Service', url: 'http://localhost:3001/health' },
    { name: 'Gateway', url: 'http://localhost:8000/health' },
    { name: 'Gateway Auth Endpoint', url: 'http://localhost:8000/api/v1/auth/health' }
  ];
  
  for (const service of services) {
    await testEndpoint(service.name, service.url);
  }
}

async function checkEnvironment() {
  console.log('\n=== Environment Variables ===');
  const envVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY',
    'DIRECT_URL',
    'AUTH_SERVICE_URL',
    'GATEWAY_PORT'
  ];
  
  for (const varName of envVars) {
    const value = process.env[varName];
    if (value) {
      const maskedValue = varName.includes('SECRET') || varName.includes('KEY') 
        ? value.substring(0, 10) + '...' 
        : value;
      console.log(`${varName}: ${maskedValue}`);
    } else {
      console.log(`${varName}: NOT SET ❌`);
    }
  }
}

async function checkDatabase() {
  console.log('\n=== Database Connection ===');
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      log: ['query', 'error', 'warn']
    });
    
    // Check connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Get user count
    const userCount = await prisma.user.count();
    console.log(`Total users in database: ${userCount}`);
    
    // List existing users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        createdAt: true
      }
    });
    
    if (users.length > 0) {
      console.log('\nExisting users:');
      users.forEach(user => {
        console.log(`- ${user.email} (${user.name || 'No name'}) - Roles: ${user.roles || 'none'} - Created: ${user.createdAt}`);
      });
    }
    
    // Check if test user exists
    const testUser = await prisma.user.findUnique({
      where: { email: TEST_EMAIL }
    });
    
    if (!testUser) {
      console.log(`\n⚠️  Test user ${TEST_EMAIL} not found. Creating...`);
      
      const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
      const newUser = await prisma.user.create({
        data: {
          email: TEST_EMAIL,
          passwordHash: hashedPassword,
          name: 'Admin User',
          roles: ['ADMIN']
        }
      });
      console.log('✅ Test user created:', newUser.email);
    } else {
      console.log(`\n✅ Test user exists: ${testUser.email}`);
      // Verify password hash
      const isValidPassword = await bcrypt.compare(TEST_PASSWORD, testUser.passwordHash);
      console.log(`Password hash valid: ${isValidPassword ? '✅' : '❌'}`);
      
      // Update password if needed
      if (!isValidPassword) {
        console.log('Updating password hash...');
        const newHashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
        await prisma.user.update({
          where: { email: TEST_EMAIL },
          data: { passwordHash: newHashedPassword }
        });
        console.log('✅ Password updated');
      }
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.log('❌ Database error:', error.message);
    if (error.stack) {
      console.log('Stack trace:', error.stack);
    }
  }
}

async function testAuthFlow() {
  console.log('\n=== Testing Auth Flow ===');
  
  let accessToken = null;
  let refreshToken = null;
  
  // 1. Test registration (if user doesn't exist)
  await testEndpoint(
    '1. Registration Test',
    'http://localhost:8000/api/v1/auth/register',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test.user@vhm24.uz',
        password: 'test123',
        name: 'Test User'
      })
    }
  );
  
  // 2. Test login through Auth service directly
  const authResult = await testEndpoint(
    '2. Login via Auth Service (Direct)',
    'http://localhost:3001/api/v1/auth/login',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    }
  );
  
  // 3. Test login through Gateway
  const gatewayResult = await testEndpoint(
    '3. Login via Gateway',
    'http://localhost:8000/api/v1/auth/login',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    }
  );
  
  // Проверяем разные форматы ответа
  if (gatewayResult.data) {
    if (gatewayResult.data.data) {
      // Gateway format
      accessToken = gatewayResult.data.data.accessToken || gatewayResult.data.data.token;
      refreshToken = gatewayResult.data.data.refreshToken;
    } else if (gatewayResult.data.token) {
      // Direct auth service format
      accessToken = gatewayResult.data.token;
      refreshToken = gatewayResult.data.refreshToken;
    }
    
    console.log('\n📝 Token Analysis:');
    if (accessToken) {
      try {
        const decoded = jwt.decode(accessToken);
        console.log('Access Token Payload:', JSON.stringify(decoded, null, 2));
      } catch (error) {
        console.log('Failed to decode access token:', error.message);
      }
    }
  }
  
  // Также проверим прямой ответ от auth service
  if (!accessToken && authResult.data && authResult.data.token) {
    accessToken = authResult.data.token;
    console.log('\n📝 Using token from auth service direct response');
  }
  
  // 4. Test /me endpoint
  if (accessToken) {
    await testEndpoint(
      '4. Get Current User (/me)',
      'http://localhost:8000/api/v1/auth/me',
      {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
  }
  
  // 5. Test refresh token
  if (refreshToken) {
    await testEndpoint(
      '5. Refresh Token',
      'http://localhost:8000/api/v1/auth/refresh',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken: refreshToken
        })
      }
    );
  }
  
  // 6. Test logout
  if (accessToken) {
    await testEndpoint(
      '6. Logout',
      'http://localhost:8000/api/v1/auth/logout',
      {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
  }
}

async function testProtectedEndpoints(token) {
  console.log('\n=== Testing Protected Endpoints ===');
  
  const endpoints = [
    { name: 'Machines List', url: 'http://localhost:8000/api/v1/machines' },
    { name: 'Tasks List', url: 'http://localhost:8000/api/v1/tasks' },
    { name: 'Bunkers List', url: 'http://localhost:8000/api/v1/bunkers' }
  ];
  
  for (const endpoint of endpoints) {
    await testEndpoint(
      endpoint.name,
      endpoint.url,
      {
        method: 'GET',
        headers: { 
          'Authorization': token ? `Bearer ${token}` : undefined
        }
      }
    );
  }
}

async function runAllTests() {
  console.log('🚀 Starting Auth Debug Tests...\n');
  console.log('Current time:', new Date().toISOString());
  console.log('Node version:', process.version);
  
  // Check environment
  await checkEnvironment();
  
  // Check service health
  await checkServiceHealth();
  
  // Check database
  await checkDatabase();
  
  // Test auth flow
  await testAuthFlow();
  
  console.log('\n✅ All tests completed!');
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
