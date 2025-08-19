#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  console.log('🧪 Testing database connectivity...');
  
  try {
    // Test the fixed query method
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connectivity test PASSED');
    console.log('Result:', result);
    
    // Test a simple query to check if tables exist
    try {
      const tables = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`;
      console.log('📋 Database tables:', tables);
    } catch (tableError) {
      console.log('⚠️  Could not list tables (this is normal if database is empty):', tableError.message);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Database connectivity test FAILED');
    console.error('Error:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase()
  .then(success => {
    console.log('\n🎯 Database Fix Test Summary:');
    console.log(success ? '✅ Fix appears to be working correctly' : '❌ Fix needs further investigation');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });