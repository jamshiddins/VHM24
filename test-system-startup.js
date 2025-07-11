const { PrismaClient } = require('@prisma/client');
const Redis = require('ioredis');

async function testSystemComponents() {
  console.log('🔍 Testing VHM24 System Components...\n');
  
  // Test 1: Environment Variables
  console.log('1. 📋 Environment Variables:');
  require('dotenv').config();
  
  const envVars = [
    'DATABASE_URL',
    'REDIS_URL', 
    'S3_BUCKET',
    'S3_ACCESS_KEY',
    'S3_SECRET_KEY',
    'JWT_SECRET'
  ];
  
  envVars.forEach(varName => {
    const status = process.env[varName] ? '✅' : '❌';
    console.log(`   ${status} ${varName}: ${process.env[varName] ? 'Set' : 'Not set'}`);
  });
  
  console.log('');
  
  // Test 2: Database Connection
  console.log('2. 🗄️ Database Connection:');
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('   ✅ PostgreSQL connection successful');
    await prisma.$disconnect();
  } catch (error) {
    console.log(`   ❌ PostgreSQL connection failed: ${error.message}`);
  }
  
  console.log('');
  
  // Test 3: Redis Connection
  console.log('3. 🔴 Redis Connection:');
  try {
    const redis = new Redis(process.env.REDIS_URL);
    await redis.ping();
    console.log('   ✅ Redis connection successful');
    await redis.disconnect();
  } catch (error) {
    console.log(`   ❌ Redis connection failed: ${error.message}`);
  }
  
  console.log('');
  
  // Test 4: S3 Connection
  console.log('4. 📁 S3 Connection:');
  try {
    const { S3Service } = require('./backend/src/utils/s3');
    const result = await S3Service.testConnection();
    console.log(`   ${result ? '✅' : '❌'} S3 connection ${result ? 'successful' : 'failed'}`);
  } catch (error) {
    console.log(`   ❌ S3 connection failed: ${error.message}`);
  }
  
  console.log('');
  
  // Test 5: Backend Server
  console.log('5. 🌐 Backend Server:');
  try {
    const response = await fetch('http://localhost:3000/api/v1');
    if (response.ok) {
      console.log('   ✅ Backend server responding');
    } else {
      console.log(`   ❌ Backend server error: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Backend server not responding: ${error.message}`);
  }
  
  console.log('');
  
  // Test 6: Prisma Schema
  console.log('6. 📊 Prisma Schema:');
  try {
    const prisma = new PrismaClient();
    
    // Test basic models
    const userCount = await prisma.user.count();
    const machineCount = await prisma.machine.count();
    const itemCount = await prisma.inventoryItem.count();
    
    console.log(`   ✅ Users table: ${userCount} records`);
    console.log(`   ✅ Machines table: ${machineCount} records`);
    console.log(`   ✅ Inventory items table: ${itemCount} records`);
    
    // Test new Bunker model
    try {
      const bunkerCount = await prisma.bunker.count();
      console.log(`   ✅ Bunkers table: ${bunkerCount} records`);
    } catch (error) {
      console.log(`   ❌ Bunkers table not found - migration needed`);
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.log(`   ❌ Prisma schema error: ${error.message}`);
  }
  
  console.log('\n🎯 System Test Complete!');
}

// Run tests
testSystemComponents().catch(console.error);
