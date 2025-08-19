const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting simple build process...\n');

try {
  // Check if we can access Next.js
  const nextPath = path.join(__dirname, 'node_modules', 'next');
  if (fs.existsSync(nextPath)) {
    console.log('✅ Next.js found at:', nextPath);
    
    // Try to get Next.js version
    try {
      const packageJson = path.join(nextPath, 'package.json');
      const packageData = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
      console.log('📦 Next.js version:', packageData.version);
    } catch (error) {
      console.log('❌ Cannot read Next.js package.json');
    }
  } else {
    console.log('❌ Next.js not found');
    return;
  }

  // Try to run next build via npx
  console.log('\n🔨 Attempting to build with npx...');
  try {
    const result = execSync('npx next build', { 
      cwd: __dirname,
      stdio: 'inherit',
      timeout: 300000
    });
    console.log('✅ Build successful!');
  } catch (error) {
    console.log('❌ Build failed:', error.message);
    
    // Try alternative approach
    console.log('\n🔄 Trying alternative approach...');
    try {
      const result = execSync('node node_modules/next/bin/next build', { 
        cwd: __dirname,
        stdio: 'inherit',
        timeout: 300000
      });
      console.log('✅ Alternative build successful!');
    } catch (error2) {
      console.log('❌ Alternative build also failed:', error2.message);
    }
  }

} catch (error) {
  console.log('❌ Error:', error.message);
}