import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        // Set default authorization header for future requests
        setAuthHeader(token);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const setAuthHeader = (token) => {
    // Set default authorization header for axios if available
    if (window.axios) {
      window.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  };

  const login = async (username, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (result.success) {
        const { user: userData, token } = result.data;
        setUser(userData);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setAuthHeader(token);
        return { success: true, user: userData };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: 'Network error. Please try again.' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Remove authorization header
    if (window.axios) {
      delete window.axios.defaults.headers.common['Authorization'];
    }
  };

  const hasPermission = (module, action) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    
    return user.permissions?.some(permission => {
      return (permission.module === module || permission.module === 'all') &&
             permission.actions.includes(action);
    });
  };

  const hasRole = (roles) => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  const getAccessibleModules = () => {
    if (!user) return [];
    if (user.role === 'admin') return ['all'];
    
    return user.permissions?.map(permission => permission.module) || [];
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    hasPermission,
    hasRole,
    getAccessibleModules,
    // Role-based helpers
    isAdmin: user?.role === 'admin',
    isDoctor: user?.role === 'doctor',
    isReceptionist: user?.role === 'receptionist',
    isNurse: user?.role === 'nurse',
    isPharmacist: user?.role === 'pharmacist',
    isLabTechnician: user?.role === 'lab_technician',
    isBillingStaff: user?.role === 'billing_staff',
    isHRManager: user?.role === 'hr_manager',
    isInventoryManager: user?.role === 'inventory_manager',
    isSecurityGuard: user?.role === 'security_guard'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};