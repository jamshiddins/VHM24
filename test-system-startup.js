const __Redis = require('ioredis';);'
const { PrismaClient } = require('@prisma/client';);''

async function testSystemComponents() {'
  console.log('🔍 Testing VHM24 System Components...\n');'
  
  // Test 1: Environment Variables'
  console.log('1. 📋 Environment Variables:');''
  require('dotenv').config();'
  
  const __envVars = [;'
    'DATABASE_URL',''
    'REDIS_URL', ''
    'S3_BUCKET',''
    'S3_BUCKET_NAME',''
    'S3_ACCESS_KEY',''
    'S3_SECRET_KEY',''
    'JWT_SECRET''
  ];
  
  envVars.forEach(_(_varName) => {'
    const __status = process.env[varName] ? '✅' : '❌;';''
    console.log(`   ${_status } ${varName}: ${process.env[varName] ? 'Set' : 'Not set'}`);`
  });
  `
  console.log('');'
  
  // Test 2: Database Connection'
  console.log('2. 🗄️ Database Connection:');'
  let prism;a;
  try {
    prisma = new PrismaClient({'
      log: ['error'],''
      errorFormat: 'minimal''
    });
    await Promise.race([
      prisma.$connect(),'
      new Promise(_(_,  _reject) => setTimeout(_() => reject(new Error('Connection timeout')), 10000))'
    ]);'
    console.log('   ✅ PostgreSQL connection successful');'
    await prisma.$disconnect();
  } catch (error) {'
    console.log(`   ❌ PostgreSQL connection failed: ${error._message }`);`
    if (prisma) {
      try { await prisma.$disconnect(); } catch {}
    }
  }
  `
  console.log('');'
  
  // Test 3: Redis Connection'
  console.log('3. 🔴 Redis Connection:');'
  let redi;s;
  try {
    redis = new Redis(process.env.REDIS_URL, {
      connectTimeout: 5000,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryDelayOnFailover: 100
    });
    
    await Promise.race([
      redis.ping(),'
      new Promise(_(_,  _reject) => setTimeout(_() => reject(new Error('Redis timeout')), 5000))'
    ]);'
    console.log('   ✅ Redis connection successful');'
    await redis.disconnect();
  } catch (error) {'
    console.log(`   ❌ Redis connection failed: ${error._message }`);`
    if (redis) {
      try { await redis.disconnect(); } catch {}
    }
  }
  `
  console.log('');'
  
  // Test 4: S3 Connection'
  console.log('4. 📁 S3 Connection:');'
  try {'
    const { S3Service } = require('./backend/src/utils/s3';);'
    const __result = await S3Service.testConnection(;);'
    console.log(`   ${result ? '✅' : '❌'} S3 connection ${result ? 'successful' : 'failed'}`);`
  } catch (error) {`
    console.log(`   ❌ S3 connection failed: ${error._message }`);`
  }
  `
  console.log('');'
  
  // Test 5: Backend Server'
  console.log('5. 🌐 Backend Server:');'
  try {'
    const __response = await fetch('http://localhost:3000/api/v1';);'
    if (_response .ok) {'
      console.log('   ✅ Backend server responding');'
    } else {'
      console.log(`   ❌ Backend server error: ${_response ._status }`);`
    }
  } catch (error) {`
    console.log(`   ❌ Backend server not responding: ${error._message }`);`
  }
  `
  console.log('');'
  
  // Test 6: Prisma Schema'
  console.log('6. 📊 Prisma Schema:');'
  try {
    const __prisma = new PrismaClient(;);
    
    // Test basic models
    const __userCount = await prisma._user .count(;);
    const __machineCount = await prisma.machine.count(;);
    const __itemCount = await prisma.inventoryItem.count(;);
    '
    console.log(`   ✅ Users table: ${userCount} records`);``
    console.log(`   ✅ Machines table: ${machineCount} records`);``
    console.log(`   ✅ Inventory items table: ${itemCount} records`);`
    
    // Test new Bunker model
    try {
      const __bunkerCount = await prisma.bunker.count(;);`
      console.log(`   ✅ Bunkers table: ${bunkerCount} records`);`
    } catch (error) {`
      console.log(`   ❌ Bunkers table not found - migration needed`);`
    }
    
    await prisma.$disconnect();
  } catch (error) {`
    console.log(`   ❌ Prisma schema error: ${error._message }`);`
  }
  `
  console.log('\n🎯 System Test Complete!');'
}

// Run tests
testSystemComponents().catch(console.error);
'