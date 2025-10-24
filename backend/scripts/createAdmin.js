const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// User Schema (same as in models/User.js)
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  role: {
    type: String,
    required: true,
    enum: [
      'admin',
      'receptionist', 
      'doctor',
      'nurse',
      'pharmacist',
      'lab_technician',
      'billing_staff',
      'hr_manager',
      'inventory_manager',
      'security_guard'
    ],
    default: 'receptionist'
  },
  department: {
    type: String,
    enum: [
      'administration',
      'emergency',
      'outpatient',
      'inpatient',
      'surgery',
      'laboratory',
      'pharmacy',
      'radiology',
      'billing'
    ]
  },
  permissions: [{
    module: {
      type: String,
      required: true
    },
    actions: [{
      type: String,
      enum: ['create', 'read', 'update', 'delete', 'manage']
    }]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Set default permissions based on role
userSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('role')) {
    this.permissions = getDefaultPermissions(this.role);
  }
  next();
});

function getDefaultPermissions(role) {
  const rolePermissions = {
    admin: [
      { module: 'all', actions: ['create', 'read', 'update', 'delete', 'manage'] }
    ],
    receptionist: [
      { module: 'appointments', actions: ['create', 'read', 'update'] },
      { module: 'patients', actions: ['create', 'read', 'update'] },
      { module: 'registration', actions: ['create', 'read', 'update'] },
      { module: 'queue_management', actions: ['read', 'update'] },
      { module: 'billing', actions: ['read'] }
    ],
    doctor: [
      { module: 'appointments', actions: ['read', 'update'] },
      { module: 'patients', actions: ['read', 'update'] },
      { module: 'medical_records', actions: ['create', 'read', 'update'] },
      { module: 'prescriptions', actions: ['create', 'read', 'update'] },
      { module: 'lab_results', actions: ['read'] },
      { module: 'complaints', actions: ['read', 'update'] }
    ]
  };

  return rolePermissions[role] || [];
}

const User = mongoose.model('User', userSchema);

const createAdminUser = async () => {
  try {
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.username);
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@hospital.com',
      password: 'admin123', // Will be hashed automatically
      fullName: 'System Administrator',
      role: 'admin',
      department: 'administration',
      isActive: true
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminUser.email);
    console.log('👤 Username:', adminUser.username);
    console.log('🔑 Password: admin123');
    console.log('🎭 Role:', adminUser.role);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser();