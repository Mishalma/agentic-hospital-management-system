#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏥 HealthTech Scheduler Setup');
console.log('============================\n');

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 16) {
  console.error('❌ Node.js 16 or higher is required');
  console.error(`   Current version: ${nodeVersion}`);
  process.exit(1);
}

console.log(`✅ Node.js version: ${nodeVersion}`);

// Install dependencies
console.log('\n📦 Installing dependencies...');

try {
  console.log('   Installing root dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('   Installing backend dependencies...');
  execSync('cd backend && npm install', { stdio: 'inherit' });
  
  console.log('   Installing frontend dependencies...');
  execSync('cd frontend && npm install', { stdio: 'inherit' });
  
  console.log('✅ All dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install dependencies');
  console.error(error.message);
  process.exit(1);
}

// Check environment files
console.log('\n🔧 Checking environment configuration...');

const backendEnvPath = path.join(__dirname, '..', 'backend', '.env');
const frontendEnvPath = path.join(__dirname, '..', 'frontend', '.env');

if (!fs.existsSync(backendEnvPath)) {
  console.log('   Creating backend .env file...');
  const backendEnvExample = path.join(__dirname, '..', 'backend', '.env.example');
  if (fs.existsSync(backendEnvExample)) {
    fs.copyFileSync(backendEnvExample, backendEnvPath);
  }
}

if (!fs.existsSync(frontendEnvPath)) {
  console.log('   Creating frontend .env file...');
  fs.writeFileSync(frontendEnvPath, 'REACT_APP_API_URL=http://localhost:5000\nGENERATE_SOURCEMAP=false\n');
}

console.log('✅ Environment files configured');

// Display startup instructions
console.log('\n🚀 Setup Complete!');
console.log('==================\n');

console.log('To start the development servers:');
console.log('   npm run dev\n');

console.log('This will start:');
console.log('   • Backend API: http://localhost:5000');
console.log('   • Frontend App: http://localhost:3000\n');

console.log('Demo Access:');
console.log('   • Patient Registration: http://localhost:3000');
console.log('   • Admin Dashboard: http://localhost:3000/admin');
console.log('   • Kiosk Mode: http://localhost:3000/kiosk\n');

console.log('Demo Credentials:');
console.log('   • Admin: admin / admin123');
console.log('   • Doctor: doctor / doctor123');
console.log('   • Staff: staff / staff123\n');

console.log('Demo Patient IDs:');
console.log('   • PT2024123456 - John Doe');
console.log('   • PT2024789012 - Jane Smith');
console.log('   • PT2024345678 - Bob Johnson\n');

console.log('🎉 Ready for hackathon demo!');