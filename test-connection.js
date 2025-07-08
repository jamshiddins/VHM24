require('dotenv').config();

console.log('=== Supabase Connection Test ===\n');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env file');
  process.exit(1);
}

console.log('✅ DATABASE_URL found');
console.log('��� Connecting to Supabase...\n');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: ['error', 'warn']
});

async function testConnection() {
  try {
    // Тест подключения
    await prisma.$connect();
    console.log('✅ Successfully connected to Supabase!');
    
    // Проверяем таблицы
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('\n��� Found tables:');
    tables.forEach(t => console.log(`   - ${t.table_name}`));
    
    // Проверяем пользователей
    try {
      const userCount = await prisma.user.count();
      console.log(`\n��� Users in database: ${userCount}`);
    } catch (e) {
      console.log('\n⚠️  User table not found. Need to run migrations.');
    }
    
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error:', error.message);
    console.error('\nPossible issues:');
    console.error('1. Check your internet connection');
    console.error('2. Verify DATABASE_URL in .env file');
    console.error('3. Check if Supabase project is active');
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
