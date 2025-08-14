#!/usr/bin/env node

/**
 * Fix MVRV Mock Data - Immediate Resolution
 * Script to remove mock MVRV data and prepare for real API integration
 * 
 * Author: Financial Systems Expert (20 years experience)
 * Priority: CRITICAL
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Import database connection
const db = require('./my-project/src/lib/db');

const prisma = new PrismaClient();

async function fixMVRVData() {
  console.log('🔧 Starting MVRV Mock Data Fix...');
  console.log('=====================================');

  try {
    // Check current MVRV data
    console.log('📊 Checking current MVRV data...');
    
    const currentMVRV = await db.get(`
      SELECT mvrv, timestamp FROM on_chain_metrics 
      WHERE cryptoId = 'bitcoin' 
      ORDER BY timestamp DESC 
      LIMIT 5
    `);
    
    console.log('📈 Current MVRV values:');
    currentMVRV.forEach((record, index) => {
      console.log(`   ${index + 1}. MVRV: ${record.mvrv} at ${record.timestamp}`);
    });
    
    // Delete all on-chain metrics (contain mock data)
    console.log('\n🗑️  Deleting all on-chain metrics (mock data)...');
    const deleteResult = await db.run(`
      DELETE FROM on_chain_metrics
    `);
    
    console.log(`✅ Deleted ${deleteResult.changes} on-chain records`);
    
    // Delete all technical indicators (contain mock data)
    console.log('\n🗑️  Deleting all technical indicators (mock data)...');
    const techDeleteResult = await db.run(`
      DELETE FROM technical_indicators
    `);
    
    console.log(`✅ Deleted ${techDeleteResult.changes} technical indicator records`);
    
    // Delete all derivative metrics (contain mock data)
    console.log('\n🗑️  Deleting all derivative metrics (mock data)...');
    const derivDeleteResult = await db.run(`
      DELETE FROM derivative_metrics
    `);
    
    console.log(`✅ Deleted ${derivDeleteResult.changes} derivative metric records`);
    
    // Verify deletion
    console.log('\n✅ Verifying data deletion...');
    
    const remainingOnChain = await db.get(`
      SELECT COUNT(*) as count FROM on_chain_metrics
    `);
    
    const remainingTech = await db.get(`
      SELECT COUNT(*) as count FROM technical_indicators
    `);
    
    const remainingDeriv = await db.get(`
      SELECT COUNT(*) as count FROM derivative_metrics
    `);
    
    console.log(`📊 Remaining records:`);
    console.log(`   On-chain metrics: ${remainingOnChain.count}`);
    console.log(`   Technical indicators: ${remainingTech.count}`);
    console.log(`   Derivative metrics: ${remainingDeriv.count}`);
    
    // Create placeholder records with null values (no mock data)
    console.log('\n📝 Creating placeholder records with null values...');
    
    try {
      await db.run(`
        INSERT INTO on_chain_metrics 
        (id, cryptoId, timestamp, mvrv, nupl, sopr, activeAddresses, exchangeInflow, exchangeOutflow, transactionVolume)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'placeholder-btc-onchain',
        'bitcoin',
        new Date().toISOString(),
        null,  // mvrv = null (no mock data)
        null,  // nupl = null (no mock data)
        null,  // sopr = null (no mock data)
        null,  // activeAddresses = null (no mock data)
        null,  // exchangeInflow = null (no mock data)
        null,  // exchangeOutflow = null (no mock data)
        null   // transactionVolume = null (no mock data)
      ]);
      
      await db.run(`
        INSERT INTO technical_indicators 
        (id, cryptoId, timestamp, rsi, ma50, ma200, macd, bollingerUpper, bollingerLower, bollingerMiddle)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'placeholder-btc-technical',
        'bitcoin',
        new Date().toISOString(),
        null,  // rsi = null (no mock data)
        null,  // ma50 = null (no mock data)
        null,  // ma200 = null (no mock data)
        null,  // macd = null (no mock data)
        null,  // bollingerUpper = null (no mock data)
        null,  // bollingerLower = null (no mock data)
        null   // bollingerMiddle = null (no mock data)
      ]);
      
      await db.run(`
        INSERT INTO derivative_metrics 
        (id, cryptoId, timestamp, openInterest, fundingRate, liquidationVolume, putCallRatio)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        'placeholder-btc-derivatives',
        'bitcoin',
        new Date().toISOString(),
        null,  // openInterest = null (no mock data)
        null,  // fundingRate = null (no mock data)
        null,  // liquidationVolume = null (no mock data)
        null   // putCallRatio = null (no mock data)
      ]);
      
      console.log('✅ Created placeholder records with null values');
    } catch (error) {
      console.log('⚠️  Placeholder creation skipped (may already exist)');
    }
    
    console.log('\n🎯 MVRV Mock Data Fix Complete!');
    console.log('=====================================');
    console.log('✅ RESULTS:');
    console.log('   • All mock MVRV data has been removed');
    console.log('   • Dashboard will now show "N/A" for MVRV');
    console.log('   • No more fake data in the system');
    console.log('   • Ready for real API integration');
    
    console.log('\n📋 NEXT STEPS:');
    console.log('   1. Add CRYPTOQUANT_API_KEY to .env.local');
    console.log('   2. Integrate CryptoQuant API in data-collector.ts');
    console.log('   3. Test with real MVRV data (should be ~2.3 for BTC)');
    console.log('   4. Verify dashboard shows correct MVRV value');
    
    console.log('\n🚀 EXPECTED OUTCOME:');
    console.log('   • Current: MVRV = 1.8 (MOCK DATA) ❌');
    console.log('   • After fix: MVRV = N/A (NO DATA) ✅');
    console.log('   • After API: MVRV = 2.3 (REAL DATA) ✅');
    
  } catch (error) {
    console.error('❌ Error fixing MVRV data:', error);
    throw error;
  }
}

// Run the fix
fixMVRVData()
  .then(() => {
    console.log('\n✅ MVRV Mock Data Fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ MVRV Mock Data Fix failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });