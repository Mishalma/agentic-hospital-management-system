import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  IconButton,
  Chip
} from '@mui/material';
import { 
  Home as HomeIcon,
  PersonAdd as RegisterIcon,
  Queue as QueueIcon,
  Dashboard as AdminIcon,
  Computer as KioskIcon,
  WhatsApp as WhatsAppIcon,
  Telegram as TelegramIcon,
  Sms as SmsIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Report as ComplaintIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const { connected } = useSocket();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { path: '/', label: 'Home', icon: <HomeIcon /> },
    { path: '/register', label: 'Register', icon: <RegisterIcon /> },
    { path: '/queue', label: 'Queue', icon: <QueueIcon /> },
    { path: '/kiosk', label: 'Kiosk', icon: <KioskIcon /> },
    { path: '/whatsapp', label: 'WhatsApp', icon: <WhatsAppIcon /> },
    { path: '/telegram', label: 'Telegram', icon: <TelegramIcon /> },
    { path: '/sms', label: 'SMS', icon: <SmsIcon /> },
    { path: '/complaints', label: 'Complaints', icon: <ComplaintIcon /> }
  ];

  if (isAuthenticated) {
    navItems.push({ path: '/admin', label: 'Admin', icon: <AdminIcon /> });
  }

  return (
    <AppBar position="static" elevation={2}>
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ flexGrow: 1, fontWeight: 600 }}
        >
          🏥 HealthTech Scheduler
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Connection Status */}
          <Chip
            label={connected ? 'Online' : 'Offline'}
            color={connected ? 'success' : 'error'}
            size="small"
            sx={{ mr: 2 }}
          />

          {/* Navigation Items */}
          {navItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              startIcon={item.icon}
              onClick={() => navigate(item.path)}
              sx={{
                backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              {item.label}
            </Button>
          ))}

          {/* Auth Section */}
          {isAuthenticated ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
              <Chip
                label={`${user.name} (${user.role})`}
                color="secondary"
                size="small"
              />
              <IconButton
                color="inherit"
                onClick={handleLogout}
                title="Logout"
              >
                <LogoutIcon />
              </IconButton>
            </Box>
          ) : (
            <Button
              color="inherit"
              startIcon={<LoginIcon />}
              onClick={() => navigate('/login')}
              sx={{ ml: 2 }}
            >
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;