const fs = require('fs');
const path = require('path');

console.log('🔍 Checking TypeScript setup...\n');

// Check if TypeScript is available
const tsPath = path.join(__dirname, 'node_modules', 'typescript');
const tsExists = fs.existsSync(tsPath);
console.log(`TypeScript directory: ${tsExists ? '✅ FOUND' : '❌ MISSING'}`);

if (tsExists) {
  try {
    const tsPackageJson = path.join(tsPath, 'package.json');
    const tsPackage = require(tsPackageJson);
    console.log(`TypeScript version: ${tsPackage.version}`);
  } catch (error) {
    console.log('❌ Cannot read TypeScript package.json');
  }
}

// Check if tsc is available
const tscPath = path.join(__dirname, 'node_modules', '.bin', 'tsc');
const tscExists = fs.existsSync(tscPath);
console.log(`tsc binary: ${tscExists ? '✅ FOUND' : '❌ MISSING'}`);

// Check if we can compile a simple TS file
console.log('\n📝 Testing TypeScript compilation...');
try {
  const testTsContent = `
const test: string = "Hello TypeScript";
console.log(test);
`;
  
  fs.writeFileSync(path.join(__dirname, 'test.ts'), testTsContent);
  
  // Try to compile with npx tsc
  const { execSync } = require('child_process');
  execSync('npx tsc test.ts --target es2020 --module commonjs --outDir .', { 
    cwd: __dirname,
    stdio: 'pipe'
  });
  
  console.log('✅ TypeScript compilation successful');
  
  // Clean up
  fs.unlinkSync(path.join(__dirname, 'test.ts'));
  fs.unlinkSync(path.join(__dirname, 'test.js'));
  
} catch (error) {
  console.log('❌ TypeScript compilation failed:', error.message);
}