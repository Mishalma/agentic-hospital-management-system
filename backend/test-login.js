const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const admin = await User.findOne({ username: 'admin' });
    if (admin) {
      console.log('✅ Admin user found');
      
      // Test password comparison
      const testPassword = 'admin123';
      const isValid = await admin.comparePassword(testPassword);
      console.log('🔑 Password test for "admin123":', isValid);
      
      // Also test bcrypt directly
      const directTest = await bcrypt.compare(testPassword, admin.password);
      console.log('🔑 Direct bcrypt test:', directTest);
      
      console.log('📝 Stored password hash:', admin.password.substring(0, 20) + '...');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testLogin();