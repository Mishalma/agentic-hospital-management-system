const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Installing Google Generative AI package...');

try {
  // Check if we're in the right directory
  const backendPath = path.join(__dirname, 'backend');
  const packageJsonPath = path.join(backendPath, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ Backend package.json not found. Make sure you\'re in the project root directory.');
    process.exit(1);
  }

  // Install the package in the backend directory
  console.log('📦 Installing @google/generative-ai in backend...');
  execSync('npm install @google/generative-ai', { 
    cwd: backendPath, 
    stdio: 'inherit' 
  });

  console.log('✅ Google Generative AI package installed successfully!');
  console.log('');
  console.log('🚀 Next steps:');
  console.log('1. Make sure your GEMINI_API_KEY is set in backend/.env');
  console.log('2. Restart your backend server');
  console.log('3. Test the AI functionality');
  console.log('');
  console.log('💡 To test the connection, run:');
  console.log('   cd backend');
  console.log('   node test-gemini-connection.js');

} catch (error) {
  console.error('❌ Installation failed:', error.message);
  console.log('');
  console.log('🔧 Manual installation:');
  console.log('   cd backend');
  console.log('   npm install @google/generative-ai');
}