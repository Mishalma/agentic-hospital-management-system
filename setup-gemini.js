const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Gemini AI Setup Script');
console.log('=' .repeat(40));

// Step 1: Check if backend directory exists
const backendPath = path.join(__dirname, 'backend');
if (!fs.existsSync(backendPath)) {
  console.error('❌ Backend directory not found!');
  process.exit(1);
}

// Step 2: Check package.json
const packageJsonPath = path.join(backendPath, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Backend package.json not found!');
  process.exit(1);
}

console.log('✅ Backend directory found');

// Step 3: Install the package
try {
  console.log('📦 Installing @google/generative-ai...');
  execSync('npm install @google/generative-ai', { 
    cwd: backendPath, 
    stdio: 'inherit' 
  });
  console.log('✅ Package installed successfully!');
} catch (error) {
  console.error('❌ Failed to install package:', error.message);
  console.log('');
  console.log('🔧 Try manual installation:');
  console.log('   cd backend');
  console.log('   npm install @google/generative-ai');
  process.exit(1);
}

// Step 4: Check .env file
const envPath = path.join(backendPath, '.env');
if (!fs.existsSync(envPath)) {
  console.warn('⚠️  .env file not found in backend directory');
} else {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasGeminiKey = envContent.includes('GEMINI_API_KEY');
  
  if (hasGeminiKey) {
    console.log('✅ GEMINI_API_KEY found in .env');
  } else {
    console.warn('⚠️  GEMINI_API_KEY not found in .env file');
    console.log('   Add this line to backend/.env:');
    console.log('   GEMINI_API_KEY=your-api-key-here');
  }
}

// Step 5: Test the installation
console.log('');
console.log('🧪 Testing installation...');
try {
  const testPath = path.join(backendPath, 'test-gemini-connection.js');
  if (fs.existsSync(testPath)) {
    console.log('Running connection test...');
    execSync('node test-gemini-connection.js', { 
      cwd: backendPath, 
      stdio: 'inherit' 
    });
  } else {
    console.log('⚠️  Test file not found, skipping test');
  }
} catch (error) {
  console.log('⚠️  Test failed, but installation should be complete');
}

console.log('');
console.log('🎉 Setup complete!');
console.log('');
console.log('📋 Next steps:');
console.log('1. Make sure GEMINI_API_KEY is set in backend/.env');
console.log('2. Get your API key from: https://makersuite.google.com/app/apikey');
console.log('3. Restart your backend server');
console.log('4. Test the AI features in your application');
console.log('');
console.log('🔧 To test manually:');
console.log('   cd backend');
console.log('   node test-gemini-connection.js');