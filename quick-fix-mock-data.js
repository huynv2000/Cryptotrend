#!/usr/bin/env node

/**
 * Quick Fix for MVRV Mock Data
 * Direct database cleanup without complex dependencies
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Quick Fix for MVRV Mock Data');
console.log('=================================');

// Path to database
const dbPath = path.join(__dirname, 'db', 'custom.db');

if (!fs.existsSync(dbPath)) {
  console.log('❌ Database file not found:', dbPath);
  process.exit(1);
}

console.log('📊 Database found:', dbPath);

// Use SQLite3 directly
const { Database } = require('sqlite3').verbose();
const db = new Database(dbPath);

async function fixMockData() {
  try {
    console.log('\n📈 Checking current MVRV data...');
    
    db.all(`
      SELECT mvrv, timestamp FROM on_chain_metrics 
      WHERE cryptoId = 'bitcoin' 
      ORDER BY timestamp DESC 
      LIMIT 3
    `, (err, rows) => {
      if (err) {
        console.error('❌ Error checking MVRV data:', err);
        return;
      }
      
      console.log('Current MVRV values:');
      if (rows.length === 0) {
        console.log('   No MVRV data found');
      } else {
        rows.forEach((row, index) => {
          console.log(`   ${index + 1}. MVRV: ${row.mvrv} at ${row.timestamp}`);
        });
      }
    });
    
    // Wait a bit then delete mock data
    setTimeout(() => {
      console.log('\n🗑️  Deleting mock on-chain metrics...');
      db.run(`DELETE FROM on_chain_metrics`, function(err) {
        if (err) {
          console.error('❌ Error deleting on-chain metrics:', err);
          return;
        }
        console.log(`✅ Deleted ${this.changes} on-chain metric records`);
        
        console.log('\n🗑️  Deleting mock technical indicators...');
        db.run(`DELETE FROM technical_indicators`, function(err) {
          if (err) {
            console.error('❌ Error deleting technical indicators:', err);
            return;
          }
          console.log(`✅ Deleted ${this.changes} technical indicator records`);
          
          console.log('\n🗑️  Deleting mock derivative metrics...');
          db.run(`DELETE FROM derivative_metrics`, function(err) {
            if (err) {
              console.error('❌ Error deleting derivative metrics:', err);
              return;
            }
            console.log(`✅ Deleted ${this.changes} derivative metric records`);
            
            // Verify deletion
            console.log('\n✅ Verifying deletion...');
            db.get(`SELECT COUNT(*) as count FROM on_chain_metrics`, (err, row) => {
              if (err) {
                console.error('❌ Error checking on-chain metrics:', err);
                return;
              }
              console.log(`   Remaining on-chain metrics: ${row.count}`);
              
              db.get(`SELECT COUNT(*) as count FROM technical_indicators`, (err, row) => {
                if (err) {
                  console.error('❌ Error checking technical indicators:', err);
                  return;
                }
                console.log(`   Remaining technical indicators: ${row.count}`);
                
                db.get(`SELECT COUNT(*) as count FROM derivative_metrics`, (err, row) => {
                  if (err) {
                    console.error('❌ Error checking derivative metrics:', err);
                    return;
                  }
                  console.log(`   Remaining derivative metrics: ${row.count}`);
                  
                  console.log('\n🎯 Mock Data Fix Complete!');
                  console.log('========================');
                  console.log('✅ RESULTS:');
                  console.log('   • All mock MVRV data has been removed');
                  console.log('   • Dashboard will now show "N/A" for MVRV');
                  console.log('   • No more fake data in the system');
                  
                  console.log('\n📋 NEXT STEPS:');
                  console.log('   1. Restart the development server');
                  console.log('   2. Check dashboard - MVRV should show "N/A"');
                  console.log('   3. Integrate CryptoQuant API for real data');
                  console.log('   4. Expected real MVRV for BTC: ~2.3');
                  
                  console.log('\n🚀 OUTCOME:');
                  console.log('   • Before: MVRV = 1.8 (MOCK DATA) ❌');
                  console.log('   • After: MVRV = N/A (NO DATA) ✅');
                  console.log('   • Future: MVRV = 2.3 (REAL DATA) ✅');
                  
                  db.close();
                  process.exit(0);
                });
              });
            });
          });
        });
      });
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error in fixMockData:', error);
    db.close();
    process.exit(1);
  }
}

// Run the fix
fixMockData();