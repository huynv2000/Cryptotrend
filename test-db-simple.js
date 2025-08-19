import { db } from './src/lib/db';

async function testDB() {
  try {
    console.log('Testing database connection...');
    console.log('DB object:', db);
    console.log('DB cryptocurrencies:', db.cryptocurrencies);
    
    const cryptocurrencies = await db.cryptocurrencies.findMany();
    console.log('Cryptocurrencies found:', cryptocurrencies.length);
    console.log('First crypto:', cryptocurrencies[0]);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testDB();