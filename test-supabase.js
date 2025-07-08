require('dotenv').config();

console.log('Testing Supabase connection...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'Not found');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to Supabase successfully!');
    
    // Проверяем версию PostgreSQL
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('PostgreSQL version:', result[0].version);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
