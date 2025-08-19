/**
 * Complete Mock Data Seeding Process
 * 
 * This script orchestrates the complete process:
 * 1. Disable data validation
 * 2. Seed comprehensive mock data
 * 3. Restore data validation
 * 
 * @author Financial Systems Expert
 * @version 1.0
 */

const { execSync } = require('child_process');

function runCommand(command, description) {
  try {
    console.log(`🔄 ${description}...`);
    execSync(command, { stdio: 'inherit', cwd: __dirname });
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

async function main() {
  console.log('🚀 Starting complete mock data seeding process...');
  console.log('='.repeat(60));
  
  // Step 1: Disable validation
  console.log('\n📋 Step 1: Disabling data validation');
  console.log('-'.repeat(40));
  runCommand('node disable-validation-temporarily.js disable', 'Disabling data validation');
  
  // Step 2: Seed comprehensive mock data
  console.log('\n📋 Step 2: Seeding comprehensive mock data');
  console.log('-'.repeat(40));
  runCommand('node seed-comprehensive-mock-data.js', 'Seeding comprehensive mock data');
  
  // Step 3: Restore validation
  console.log('\n📋 Step 3: Restoring data validation');
  console.log('-'.repeat(40));
  runCommand('node disable-validation-temporarily.js restore', 'Restoring data validation');
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Complete mock data seeding process finished successfully!');
  console.log('\n📊 Your dashboard now has:');
  console.log('   ✅ 120 days of historical data for 4 cryptocurrencies');
  console.log('   ✅ Realistic price, volume, and on-chain metrics');
  console.log('   ✅ TVL metrics with different growth patterns');
  console.log('   ✅ Technical indicators and sentiment data');
  console.log('   ✅ AI analysis history');
  console.log('   ✅ Data validation restored to original state');
  console.log('\n🌐 Dashboard should now display full metrics with proper timeframe functionality!');
}

main().catch(error => {
  console.error('❌ Seeding process failed:', error);
  process.exit(1);
});