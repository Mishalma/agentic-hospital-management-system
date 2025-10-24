const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Gemini AI Status Check');
console.log('=' .repeat(40));

// Check 1: Backend directory
const backendPath = path.join(__dirname, 'backend');
console.log('1. Backend Directory:', fs.existsSync(backendPath) ? '✅ Found' : '❌ Missing');

if (!fs.existsSync(backendPath)) {
  console.log('❌ Cannot continue without backend directory');
  process.exit(1);
}

// Check 2: Package installation
console.log('2. Package Installation:');
try {
  const packageCheck = execSync('npm list @google/generative-ai', { 
    cwd: backendPath, 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  if (packageCheck.includes('@google/generative-ai')) {
    console.log('   ✅ @google/generative-ai is installed');
    
    // Get version
    const versionMatch = packageCheck.match(/@google\/generative-ai@([\d.]+)/);
    if (versionMatch) {
      console.log('   📦 Version:', versionMatch[1]);
    }
  } else {
    console.log('   ❌ Package not found in dependencies');
  }
} catch (error) {
  console.log('   ❌ Package not installed');
  console.log('   🔧 Install with: cd backend && npm install @google/generative-ai');
}

// Check 3: Environment variables
console.log('3. Environment Configuration:');
const envPath = path.join(backendPath, '.env');
if (fs.existsSync(envPath)) {
  console.log('   ✅ .env file found');
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const geminiKeyMatch = envContent.match(/GEMINI_API_KEY=(.+)/);
  
  if (geminiKeyMatch) {
    const apiKey = geminiKeyMatch[1].trim();
    console.log('   ✅ GEMINI_API_KEY found');
    console.log('   📏 Key length:', apiKey.length);
    console.log('   🔑 Key format:', apiKey.startsWith('AIza') ? '✅ Valid' : '❌ Invalid');
    
    if (apiKey.length < 30) {
      console.log('   ⚠️  Key appears too short');
    }
  } else {
    console.log('   ❌ GEMINI_API_KEY not found in .env');
  }
} else {
  console.log('   ❌ .env file not found');
}

// Check 4: Test files
console.log('4. Test Files:');
const testFiles = [
  'test-gemini-connection.js',
  'config/gemini.js',
  'services/geminiService.js'
];

testFiles.forEach(file => {
  const filePath = path.join(backendPath, file);
  console.log(`   ${fs.existsSync(filePath) ? '✅' : '❌'} ${file}`);
});

// Check 5: Try to load the module
console.log('5. Module Loading:');
try {
  // Change to backend directory for require
  process.chdir(backendPath);
  
  const geminiConfig = require('./config/gemini');
  console.log('   ✅ Gemini config loaded');
  
  const status = geminiConfig.getStatus();
  console.log('   📊 Status:', JSON.stringify(status, null, 6));
  
} catch (error) {
  console.log('   ❌ Failed to load modules:', error.message);
}

console.log('');
console.log('🎯 Summary & Recommendations:');

// Provide specific recommendations
const envExists = fs.existsSync(envPath);
const envContent = envExists ? fs.readFileSync(envPath, 'utf8') : '';
const hasApiKey = envContent.includes('GEMINI_API_KEY');

if (!hasApiKey) {
  console.log('❌ CRITICAL: No API key configured');
  console.log('   1. Get API key from: https://makersuite.google.com/app/apikey');
  console.log('   2. Add to backend/.env: GEMINI_API_KEY=your-key-here');
}

console.log('');
console.log('🚀 Quick Setup Commands:');
console.log('   # Install package:');
console.log('   cd backend && npm install @google/generative-ai');
console.log('');
console.log('   # Run setup script:');
console.log('   node setup-gemini.js');
console.log('');
console.log('   # Test connection:');
console.log('   cd backend && node test-gemini-connection.js');