const bcrypt = require('bcryptjs');

class MockUser {
  constructor() {
    this.users = [
      {
        id: '1',
        username: 'admin',
        email: 'admin@hospital.com',
        password: '$2b$10$DMNu3KohWybHqiPNxQlrPeXaRxpXoY/XbL9H94J2BtYHoqhoIVt/S', // password
        fullName: 'System Administrator',
        role: 'admin',
        department: 'administration',
        permissions: [{ module: 'all', actions: ['create', 'read', 'update', 'delete', 'manage'] }],
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        username: 'receptionist1',
        email: 'receptionist@hospital.com',
        password: '$2b$10$DMNu3KohWybHqiPNxQlrPeXaRxpXoY/XbL9H94J2BtYHoqhoIVt/S', // password
        fullName: 'Sarah Johnson',
        role: 'receptionist',
        department: 'outpatient',
        permissions: [
          { module: 'appointments', actions: ['create', 'read', 'update'] },
          { module: 'patients', actions: ['create', 'read', 'update'] },
          { module: 'registration', actions: ['create', 'read', 'update'] }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        username: 'doctor1',
        email: 'doctor@hospital.com',
        password: '$2b$10$Xm7i.Cu7jFH/96Y/BjftVeaHgNV25cBZ0DEiOho36ssWZnrT8vIaO', // password
        fullName: 'Dr. Michael Smith',
        role: 'doctor',
        department: 'outpatient',
        permissions: [
          { module: 'appointments', actions: ['read', 'update'] },
          { module: 'patients', actions: ['read', 'update'] },
          { module: 'medical_records', actions: ['create', 'read', 'update'] }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    this.nextId = 4;
  }

  async findOne(query) {
    if (query.username) {
      return this.users.find(user => user.username === query.username);
    }
    if (query.email) {
      return this.users.find(user => user.email === query.email);
    }
    if (query._id || query.id) {
      const id = query._id || query.id;
      return this.users.find(user => user.id === id);
    }
    return null;
  }

  async find(query = {}) {
    let result = [...this.users];
    
    if (query.role) {
      result = result.filter(user => user.role === query.role);
    }
    if (query.department) {
      result = result.filter(user => user.department === query.department);
    }
    if (query.isActive !== undefined) {
      result = result.filter(user => user.isActive === query.isActive);
    }
    
    return result;
  }

  async create(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const newUser = {
      id: this.nextId.toString(),
      ...userData,
      password: hashedPassword,
      permissions: this.getDefaultPermissions(userData.role),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.push(newUser);
    this.nextId++;
    
    return newUser;
  }

  async findByIdAndUpdate(id, updateData) {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;
    
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updateData,
      updatedAt: new Date()
    };
    
    return this.users[userIndex];
  }

  async findByIdAndDelete(id) {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;
    
    const deletedUser = this.users[userIndex];
    this.users.splice(userIndex, 1);
    return deletedUser;
  }

  async comparePassword(candidatePassword, hashedPassword) {
    return bcrypt.compare(candidatePassword, hashedPassword);
  }

  hasPermission(user, module, action) {
    if (user.role === 'admin') return true;
    
    return user.permissions.some(permission => {
      return (permission.module === module || permission.module === 'all') &&
             permission.actions.includes(action);
    });
  }

  getDefaultPermissions(role) {
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
        { module: 'lab_results', actions: ['read'] }
      ],
      nurse: [
        { module: 'patients', actions: ['read', 'update'] },
        { module: 'appointments', actions: ['read'] },
        { module: 'medical_records', actions: ['read', 'update'] },
        { module: 'inventory', actions: ['read'] }
      ],
      pharmacist: [
        { module: 'prescriptions', actions: ['read', 'update'] },
        { module: 'inventory', actions: ['read', 'update'] },
        { module: 'patients', actions: ['read'] }
      ]
    };

    return rolePermissions[role] || [];
  }
}

module.exports = MockUser;