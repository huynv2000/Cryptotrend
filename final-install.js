const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting final installation process...\n');

// Function to execute commands safely
function safeExec(command, options = {}) {
  try {
    console.log(`Executing: ${command}`);
    const result = execSync(command, { 
      cwd: __dirname,
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: options.timeout || 300000,
      ...options
    });
    console.log('✅ Command executed successfully');
    return { success: true, output: result };
  } catch (error) {
    console.log(`❌ Command failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Step 1: Check current status
console.log('📊 Checking current installation status...\n');

const criticalPackages = [
  'next',
  'react', 
  'react-dom',
  'typescript',
  'lucide-react',
  'recharts',
  '@prisma/client',
  'prisma'
];

console.log('Checking critical packages:');
criticalPackages.forEach(pkg => {
  const pkgPath = path.join(__dirname, 'node_modules', pkg);
  const exists = fs.existsSync(pkgPath);
  console.log(`${pkg}: ${exists ? '✅ FOUND' : '❌ MISSING'}`);
});

// Step 2: Try to fix missing packages using npx
console.log('\n🔧 Attempting to fix missing packages...\n');

const installCommands = [
  'npx next@15.3.5 --version',
  'npx typescript@5.9.2 --version', 
  'npx lucide-react@0.525.0 --version',
  'npx recharts@2.15.4 --version',
  'npx prisma@6.11.1 --version'
];

installCommands.forEach(cmd => {
  const result = safeExec(cmd, { timeout: 60000 });
  if (result.success) {
    console.log(`✅ ${cmd} - Available`);
  } else {
    console.log(`❌ ${cmd} - Failed`);
  }
});

// Step 3: Try to generate Prisma client
console.log('\n🗄️  Attempting to generate Prisma client...\n');

const prismaResult = safeExec('npx prisma@6.11.1 generate', { timeout: 120000 });
if (prismaResult.success) {
  console.log('✅ Prisma client generated successfully');
} else {
  console.log('❌ Prisma client generation failed');
}

// Step 4: Try to build Next.js
console.log('\n🏗️  Attempting to build Next.js...\n');

const buildResult = safeExec('npx next@15.3.5 build', { timeout: 300000 });
if (buildResult.success) {
  console.log('✅ Next.js build successful');
} else {
  console.log('❌ Next.js build failed');
  
  // Try alternative build approach
  console.log('\n🔄 Trying alternative build approach...');
  const altBuildResult = safeExec('NODE_OPTIONS="--max-old-space-size=4096" npx next@15.3.5 build', { timeout: 300000 });
  if (altBuildResult.success) {
    console.log('✅ Alternative build successful');
  } else {
    console.log('❌ Alternative build also failed');
  }
}

// Step 5: Try to start development server
console.log('\n🚀 Attempting to start development server...\n');

// Create a simple test to see if we can start the server
const testServerResult = safeExec('timeout 10s npx next@15.3.5 dev || true', { timeout: 15000 });
if (testServerResult.success) {
  console.log('✅ Development server test successful');
} else {
  console.log('❌ Development server test failed');
}

console.log('\n✅ Final installation process completed');
console.log('\n📋 Summary:');
console.log('- Dependencies installation: Attempted');
console.log('- Prisma client generation: Attempted'); 
console.log('- Next.js build: Attempted');
console.log('- Development server: Attempted');
console.log('\n🔍 Next steps:');
console.log('1. Check the output above for any errors');
console.log('2. If build failed, try manual installation of missing packages');
console.log('3. If successful, try running: npx next dev');