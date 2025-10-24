const express = require('express');
const jwt = require('jsonwebtoken');
const  User  = require('../models/User');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find user by username or email
    let user;
    if (User.findOne) {
      // MongoDB User model
      user = await User.findOne({
        $or: [{ username }, { email: username }]
      });
    } else {
      // Mock User model
      user = await User.findOne({ username }) || await User.findOne({ email: username });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check password
    let isPasswordValid;
    if (user.comparePassword) {
      // MongoDB User model
      isPasswordValid = await user.comparePassword(password);
    } else {
      // Mock User model
      isPasswordValid = await User.comparePassword(password, user.password);
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    if (User.findByIdAndUpdate) {
      await User.findByIdAndUpdate(user._id || user.id, { lastLogin: new Date() });
    } else {
      await User.findByIdAndUpdate(user.id, { lastLogin: new Date() });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id || user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );



    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id || user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          department: user.department,
          permissions: user.permissions
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Register new user (public registration)
router.post('/register', async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      fullName,
      role,
      department
    } = req.body;

    // --- Input Validation ---
    if (!username || !email || !password || !fullName || !role) {
      console.warn('⚠️ Missing required fields:', { username, email, fullName, role });
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // --- Check for existing user ---
    try {
      const existingUser = await User.findOne({
        $or: [{ username }, { email }]
      });

      if (existingUser) {
        console.info('🟡 Duplicate user registration attempt:', { username, email });
        return res.status(400).json({
          success: false,
          message: 'Username or email already exists'
        });
      }
    } catch (dbError) {
      console.error('❌ Database query error while checking existing user:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Database error while checking existing user'
      });
    }

    // --- Create new user ---
    try {
      // (Optional) Hash password before saving
      // const hashedPassword = await bcrypt.hash(password, 10);

      const userData = {
        username,
        email,
        password, // replace with hashedPassword if using bcrypt
        fullName,
        role,
        department: department || 'General',
        createdBy: null
      };

      const newUser = await User.create(userData);

      console.info('✅ New user registered successfully:', { id: newUser._id, username });

      return res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          user: {
            id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            fullName: newUser.fullName,
            role: newUser.role,
            department: newUser.department,
            permissions: newUser.permissions || []
          }
        }
      });
    } catch (createError) {
      console.error('❌ Error creating user record:', createError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create user'
      });
    }

  } catch (error) {
    console.error('🔥 Unhandled registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    let user;
    if (User.findById) {
      user = await User.findById(req.user.userId).select('-password');
    } else {
      user = await User.findOne({ id: req.user.userId });
      if (user) {
        delete user.password;
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all users (admin only)
router.get('/users', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { role, department, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (department) query.department = department;

    let users;
    if (User.find) {
      users = await User.find(query)
        .select('-password')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });
    } else {
      users = await User.find(query);
      users = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
    }

    res.json({
      success: true,
      data: { users }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user (admin only)
router.put('/users/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated directly
    delete updateData.password;
    delete updateData.createdAt;

    let updatedUser;
    if (User.findByIdAndUpdate) {
      updatedUser = await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');
    } else {
      updatedUser = await User.findByIdAndUpdate(id, updateData);
      if (updatedUser) {
        delete updatedUser.password;
      }
    }

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
}

// Middleware to authorize specific roles
function authorizeRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
}

// Middleware to check specific permission
function checkPermission(module, action) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user has the required permission
    const hasPermission = req.user.permissions.some(permission => {
      return (permission.module === module || permission.module === 'all') &&
             permission.actions.includes(action);
    });

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Permission denied: ${action} access to ${module} module`
      });
    }

    next();
  };
}

module.exports = {
  router,
  authenticateToken,
  authorizeRole,
  checkPermission
};