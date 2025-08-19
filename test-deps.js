const fs = require('fs');
const path = require('path');

// Check if critical dependencies exist
const criticalDeps = [
  'next',
  'react',
  'react-dom',
  'prisma',
  '@prisma/client',
  'socket.io',
  'ws'
];

console.log('Checking critical dependencies...\n');

const nodeModulesPath = path.join(__dirname, 'node_modules');

criticalDeps.forEach(dep => {
  const depPath = path.join(nodeModulesPath, dep);
  const exists = fs.existsSync(depPath);
  console.log(`${dep}: ${exists ? '✅ FOUND' : '❌ MISSING'}`);
});

console.log('\nChecking binary files...\n');

const binPath = path.join(nodeModulesPath, '.bin');
const binExists = fs.existsSync(binPath);
console.log(`.bin directory: ${binExists ? '✅ FOUND' : '❌ MISSING'}`);

if (binExists) {
  const binFiles = fs.readdirSync(binPath);
  console.log('Binary files:', binFiles);
}

console.log('\nNext.js check...');
try {
  const nextPath = path.join(nodeModulesPath, 'next');
  const nextPackageJson = path.join(nextPath, 'package.json');
  if (fs.existsSync(nextPackageJson)) {
    const nextPackage = require(nextPackageJson);
    console.log(`Next.js version: ${nextPackage.version}`);
  } else {
    console.log('❌ Next.js package.json not found');
  }
} catch (error) {
  console.log('❌ Error checking Next.js:', error.message);
}