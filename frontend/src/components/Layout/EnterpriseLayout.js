import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  Collapse,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountIcon,
  People as PatientsIcon,
  EventNote as AppointmentsIcon,
  LocalHospital as MedicalIcon,
  Inventory as InventoryIcon,
  AttachMoney as BillingIcon,
  Report as ReportsIcon,
  Security as SecurityIcon,
  ExpandLess,
  ExpandMore,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ModuleCard from './ModuleCard';
import './EnterpriseLayout.css';

const drawerWidth = 280;
const collapsedDrawerWidth = 70;

const EnterpriseLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission, hasRole } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerCollapsed, setDrawerCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});

  // Hospital Management Modules - Role-based access
  const getHospitalModules = () => {
    const baseModules = {
      'Patient Management': {
        icon: <PatientsIcon />,
        color: '#2196F3',
        modules: [
          { 
            name: 'Book Appointment', 
            path: '/integrated-booking', 
            icon: '📅', 
            status: hasPermission('appointments', 'create') ? 'active' : 'restricted',
            description: 'Register patient + book appointment',
            requiredPermission: { module: 'appointments', action: 'create' }
          },
          { name: 'Patient Records', path: '/patients', icon: '📋', status: 'coming-soon' },
          { name: 'Patient Portal', path: '/patient-portal', icon: '🌐', status: 'coming-soon' },
          { name: 'Insurance Management', path: '/insurance', icon: '🛡️', status: 'coming-soon' },
          { name: 'Patient Analytics', path: '/patient-analytics', icon: '📊', status: 'coming-soon' }
        ]
      },
      'Appointment & Scheduling': {
        icon: <AppointmentsIcon />,
        color: '#4CAF50',
        modules: [
          { 
            name: 'Queue Management', 
            path: '/queue-status', 
            icon: '⏰', 
            status: hasPermission('queue_management', 'read') ? 'active' : 'restricted',
            description: 'Real-time queue status',
            requiredPermission: { module: 'queue_management', action: 'read' }
          },
          { name: 'Kiosk Mode', path: '/kiosk', icon: '🖥️', status: 'active', description: 'Self-service kiosk' },
          { name: 'Doctor Scheduling', path: '/doctor-schedule', icon: '👨‍⚕️', status: 'coming-soon' },
          { name: 'Resource Booking', path: '/resource-booking', icon: '🏥', status: 'coming-soon' },
          { name: 'Waitlist Management', path: '/waitlist', icon: '📝', status: 'coming-soon' }
        ]
      },
    'Medical Records & EMR': {
      icon: <MedicalIcon />,
      color: '#FF9800',
      modules: [
        { 
          name: 'Vitals Logging', 
          path: '/vitals-logging', 
          icon: '🩺', 
          status: hasRole(['nurse', 'doctor', 'admin']) ? 'active' : 'restricted',
          description: 'Record patient vitals on tablets/mobile',
          requiredRole: ['nurse', 'doctor', 'admin']
        },
        { 
          name: 'Vitals Dashboard', 
          path: '/vitals-dashboard', 
          icon: '📊', 
          status: hasRole(['doctor', 'admin']) ? 'active' : 'restricted',
          description: 'Monitor abnormal vitals and EMR sync',
          requiredRole: ['doctor', 'admin']
        },
        { 
          name: 'Triage Assessment', 
          path: '/triage-assessment', 
          icon: '🚨', 
          status: hasRole(['nurse', 'doctor', 'admin']) ? 'active' : 'restricted',
          description: 'AI-powered patient prioritization',
          requiredRole: ['nurse', 'doctor', 'admin']
        },
        { 
          name: 'Triage Queue', 
          path: '/triage-queue', 
          icon: '📋', 
          status: hasRole(['doctor', 'admin']) ? 'active' : 'restricted',
          description: 'View prioritized patient queue',
          requiredRole: ['doctor', 'admin']
        },
        { 
          name: 'Consultation Dashboard', 
          path: '/consultations', 
          icon: '👨‍⚕️', 
          status: hasRole(['doctor', 'admin']) ? 'active' : 'restricted',
          description: 'AI-powered consultation management',
          requiredRole: ['doctor', 'admin']
        },
        { 
          name: 'New Consultation', 
          path: '/consultation/new', 
          icon: '📝', 
          status: hasRole(['doctor', 'admin']) ? 'active' : 'restricted',
          description: 'Create new consultation with AI assistance',
          requiredRole: ['doctor', 'admin']
        },
        { 
          name: 'Prescription Manager', 
          path: '/prescription/new', 
          icon: '💊', 
          status: hasRole(['doctor', 'admin']) ? 'active' : 'restricted',
          description: 'AI-powered prescription management',
          requiredRole: ['doctor', 'admin']
        },
        { 
          name: 'E-Prescription Tracking', 
          path: '/prescriptions/tracking', 
          icon: '📋', 
          status: hasRole(['doctor', 'admin']) ? 'active' : 'restricted',
          description: 'Track prescription status in real-time',
          requiredRole: ['doctor', 'admin']
        },
        { 
          name: 'Drug Information', 
          path: '/drug-information', 
          icon: '🔍', 
          status: hasRole(['doctor', 'pharmacist', 'admin']) ? 'active' : 'restricted',
          description: 'Drug interactions, food interactions, and safety analysis',
          requiredRole: ['doctor', 'pharmacist', 'admin']
        },
        { 
          name: 'ADR Reporting', 
          path: '/adr-reporting', 
          icon: '⚠️', 
          status: hasRole(['doctor', 'pharmacist', 'admin']) ? 'active' : 'restricted',
          description: 'Adverse Drug Reaction reporting and management',
          requiredRole: ['doctor', 'pharmacist', 'admin']
        },
        { 
          name: 'Laboratory Dashboard', 
          path: '/laboratory', 
          icon: '🧪', 
          status: hasRole(['lab_technician', 'doctor', 'admin']) ? 'active' : 'restricted',
          description: 'Laboratory Information System - test orders and results',
          requiredRole: ['lab_technician', 'doctor', 'admin']
        },
        { 
          name: 'Lab Order Management', 
          path: '/lab-orders', 
          icon: '📋', 
          status: hasRole(['lab_technician', 'doctor', 'admin']) ? 'active' : 'restricted',
          description: 'Manage lab orders, sample tracking, and result entry',
          requiredRole: ['lab_technician', 'doctor', 'admin']
        },
        { name: 'Electronic Health Records', path: '/ehr', icon: '📄', status: 'coming-soon' },
        { name: 'Medical History', path: '/medical-history', icon: '🩺', status: 'coming-soon' },
        { 
          name: 'Lab Results', 
          path: '/lab-results', 
          icon: '🔬', 
          status: hasRole(['lab_technician', 'doctor', 'admin']) ? 'active' : 'restricted',
          description: 'View and manage laboratory test results',
          requiredRole: ['lab_technician', 'doctor', 'admin']
        },
        { name: 'Radiology Reports', path: '/radiology', icon: '🔬', status: 'coming-soon' }
      ]
    },
      'Communication & Support': {
        icon: <NotificationsIcon />,
        color: '#9C27B0',
        modules: [
          { 
            name: 'WhatsApp Integration', 
            path: '/whatsapp', 
            icon: '💬', 
            status: hasRole('admin') ? 'active' : 'restricted',
            requiredRole: 'admin'
          },
          { 
            name: 'Telegram Bot', 
            path: '/telegram', 
            icon: '📱', 
            status: hasRole('admin') ? 'active' : 'restricted',
            requiredRole: 'admin'
          },
          { 
            name: 'SMS Notifications', 
            path: '/sms', 
            icon: '📲', 
            status: hasRole('admin') ? 'active' : 'restricted',
            requiredRole: 'admin'
          },
          { 
            name: 'Complaint Management', 
            path: '/complaints', 
            icon: '📝', 
            status: hasPermission('complaints', 'read') ? 'active' : 'restricted',
            requiredPermission: { module: 'complaints', action: 'read' }
          },
          { name: 'Patient Feedback', path: '/feedback', icon: '⭐', status: 'coming-soon' },
          { name: 'Live Chat Support', path: '/live-chat', icon: '💭', status: 'coming-soon' }
        ]
      },
    'Billing & Finance': {
      icon: <BillingIcon />,
      color: '#F44336',
      modules: [
        { 
          name: 'Billing Dashboard', 
          path: '/billing', 
          icon: '💰', 
          status: hasRole(['billing_staff', 'admin']) ? 'active' : 'restricted',
          description: 'Centralized billing management across all departments',
          requiredRole: ['billing_staff', 'admin']
        },
        { name: 'Insurance Claims', path: '/claims', icon: '📋', status: 'coming-soon' },
        { name: 'Payment Processing', path: '/payments', icon: '💳', status: 'coming-soon' },
        { name: 'Financial Reports', path: '/finance-reports', icon: '📊', status: 'coming-soon' },
        { name: 'Revenue Analytics', path: '/revenue', icon: '📈', status: 'coming-soon' }
      ]
    },
    'Pharmacy Information System': {
      icon: <InventoryIcon />,
      color: '#607D8B',
      modules: [
        { 
          name: 'Pharmacy Dashboard', 
          path: '/pharmacy', 
          icon: '🏥', 
          status: hasRole(['pharmacist', 'admin']) ? 'active' : 'restricted',
          description: 'Real-time pharmacy analytics and alerts',
          requiredRole: ['pharmacist', 'admin']
        },
        { 
          name: 'Inventory Management', 
          path: '/pharmacy/inventory', 
          icon: '📦', 
          status: hasRole(['pharmacist', 'admin']) ? 'active' : 'restricted',
          description: 'Stock tracking with expiry alerts',
          requiredRole: ['pharmacist', 'admin']
        },
        { 
          name: 'E-Prescription Processing', 
          path: '/pharmacy/prescriptions', 
          icon: '💊', 
          status: hasRole(['pharmacist', 'admin']) ? 'active' : 'restricted',
          description: 'Digital prescription dispensing',
          requiredRole: ['pharmacist', 'admin']
        },
        { 
          name: 'Transaction Management', 
          path: '/pharmacy/transactions', 
          icon: '💰', 
          status: hasRole(['pharmacist', 'admin']) ? 'active' : 'restricted',
          description: 'Sales and billing management',
          requiredRole: ['pharmacist', 'admin']
        },
        { 
          name: 'Pharmacy Reports', 
          path: '/pharmacy/reports', 
          icon: '📊', 
          status: hasRole(['pharmacist', 'admin']) ? 'active' : 'restricted',
          description: 'Analytics and compliance reports',
          requiredRole: ['pharmacist', 'admin']
        },
        { name: 'Equipment Management', path: '/equipment', icon: '🏥', status: 'coming-soon' },
        { name: 'Supply Chain', path: '/supply-chain', icon: '📦', status: 'coming-soon' },
        { name: 'Asset Tracking', path: '/assets', icon: '🏷️', status: 'coming-soon' }
      ]
    },
    'Staff & HR Management': {
      icon: <SecurityIcon />,
      color: '#795548',
      modules: [
        { name: 'Staff Directory', path: '/staff', icon: '👥', status: 'coming-soon' },
        { name: 'Shift Management', path: '/shifts', icon: '🕐', status: 'coming-soon' },
        { name: 'Payroll System', path: '/payroll', icon: '💵', status: 'coming-soon' },
        { name: 'Performance Reviews', path: '/reviews', icon: '⭐', status: 'coming-soon' },
        { name: 'Training Programs', path: '/training', icon: '🎓', status: 'coming-soon' }
      ]
    },
      'Analytics & Reports': {
        icon: <ReportsIcon />,
        color: '#3F51B5',
        modules: [
          { 
            name: 'Dashboard Analytics', 
            path: '/admin', 
            icon: '📊', 
            status: hasRole(['admin', 'doctor', 'nurse']) ? 'active' : 'restricted',
            requiredRole: ['admin', 'doctor', 'nurse']
          },
          { 
            name: 'Enterprise Dashboard', 
            path: '/enterprise-dashboard', 
            icon: '🏢', 
            status: hasRole('admin') ? 'active' : 'restricted',
            requiredRole: 'admin'
          },
          { name: 'Patient Analytics', path: '/patient-reports', icon: '👥', status: 'coming-soon' },
          { name: 'Financial Reports', path: '/financial-reports', icon: '💰', status: 'coming-soon' },
          { name: 'Operational Reports', path: '/operational-reports', icon: '⚙️', status: 'coming-soon' },
          { name: 'Compliance Reports', path: '/compliance', icon: '📋', status: 'coming-soon' }
        ]
      }
    };

    // Add System Administration only for admins
    if (hasRole('admin')) {
      baseModules['System Administration'] = {
        icon: <SettingsIcon />,
        color: '#424242',
        modules: [
          { 
            name: 'User Registration', 
            path: '/user-registration', 
            icon: '👤', 
            status: 'active',
            description: 'Create new user accounts'
          },
          { name: 'Role & Permissions', path: '/permissions', icon: '🔐', status: 'coming-soon' },
          { name: 'System Settings', path: '/settings', icon: '⚙️', status: 'coming-soon' },
          { name: 'Backup & Recovery', path: '/backup', icon: '💾', status: 'coming-soon' },
          { name: 'Audit Logs', path: '/audit', icon: '📝', status: 'coming-soon' }
        ]
      };
    }

    return baseModules;
  };

  const hospitalModules = getHospitalModules();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerCollapse = () => {
    setDrawerCollapsed(!drawerCollapsed);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleModuleExpand = (moduleName) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleName]: !prev[moduleName]
    }));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    handleProfileMenuClose();
  };

  const renderModuleList = () => (
    <List sx={{ pt: 0 }}>
      {Object.entries(hospitalModules).map(([categoryName, category]) => (
        <React.Fragment key={categoryName}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 2,
              py: 1.5,
              cursor: 'pointer',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
              borderLeft: expandedModules[categoryName] ? `4px solid ${category.color}` : 'none'
            }}
            onClick={() => handleModuleExpand(categoryName)}
          >
            <Box sx={{ color: category.color, mr: drawerCollapsed ? 0 : 2 }}>
              {category.icon}
            </Box>
            {!drawerCollapsed && (
              <>
                <Typography variant="subtitle2" sx={{ flexGrow: 1, fontWeight: 600 }}>
                  {categoryName}
                </Typography>
                {expandedModules[categoryName] ? <ExpandLess /> : <ExpandMore />}
              </>
            )}
          </Box>
          
          {!drawerCollapsed && (
            <Collapse in={expandedModules[categoryName]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {category.modules.map((module) => (
                  <ModuleCard
                    key={module.name}
                    module={module}
                    isActive={location.pathname === module.path}
                    onClick={() => {
                      if (module.status === 'active') {
                        navigate(module.path);
                      }
                    }}
                  />
                ))}
              </List>
            </Collapse>
          )}
          
          {categoryName !== 'System Administration' && <Divider sx={{ my: 1 }} />}
        </React.Fragment>
      ))}
    </List>
  );

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Hospital Logo & Name */}
      <Box
        sx={{
          p: 2,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center'
        }}
      >
        {!drawerCollapsed ? (
          <>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              🏥 HealthTech
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Enterprise Hospital Management
            </Typography>
          </>
        ) : (
          <Typography variant="h4">🏥</Typography>
        )}
      </Box>

      {/* Module Navigation */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {renderModuleList()}
      </Box>

      {/* Collapse Button */}
      {!isMobile && (
        <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
          <IconButton
            onClick={handleDrawerCollapse}
            sx={{ width: '100%', justifyContent: drawerCollapsed ? 'center' : 'flex-start' }}
          >
            {drawerCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            {!drawerCollapsed && (
              <Typography variant="caption" sx={{ ml: 1 }}>
                Collapse Menu
              </Typography>
            )}
          </IconButton>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerCollapsed ? collapsedDrawerWidth : drawerWidth}px)` },
          ml: { md: `${drawerCollapsed ? collapsedDrawerWidth : drawerWidth}px` },
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" noWrap component="div">
              Hospital Management System
            </Typography>
            {user && (
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Welcome, {user.fullName} ({user.role})
              </Typography>
            )}
          </Box>

          {/* System Status */}
          <Chip
            label="System Online"
            color="success"
            size="small"
            sx={{ mr: 2, color: 'white', backgroundColor: 'rgba(76, 175, 80, 0.8)' }}
          />

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton color="inherit" onClick={handleNotificationOpen}>
              <Badge badgeContent={4} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Profile Menu */}
          <Tooltip title="Account">
            <IconButton color="inherit" onClick={handleProfileMenuOpen}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)' }}>
                {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerCollapsed ? collapsedDrawerWidth : drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerCollapsed ? collapsedDrawerWidth : drawerWidth,
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              })
            }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerCollapsed ? collapsedDrawerWidth : drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: '#f5f5f5'
        }}
      >
        <Toolbar />
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleProfileMenuClose}>
          <AccountIcon sx={{ mr: 2 }} />
          Profile Settings
        </MenuItem>
        <MenuItem onClick={handleProfileMenuClose}>
          <SettingsIcon sx={{ mr: 2 }} />
          System Preferences
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <Typography color="error">Logout</Typography>
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{ sx: { width: 320, maxHeight: 400 } }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">Notifications</Typography>
        </Box>
        <MenuItem>
          <Box>
            <Typography variant="body2" fontWeight="bold">
              New Patient Registration
            </Typography>
            <Typography variant="caption" color="text.secondary">
              John Doe registered 5 minutes ago
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem>
          <Box>
            <Typography variant="body2" fontWeight="bold">
              Complaint Submitted
            </Typography>
            <Typography variant="caption" color="text.secondary">
              High priority complaint received
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem>
          <Box>
            <Typography variant="body2" fontWeight="bold">
              System Update
            </Typography>
            <Typography variant="caption" color="text.secondary">
              New features available
            </Typography>
          </Box>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default EnterpriseLayout;