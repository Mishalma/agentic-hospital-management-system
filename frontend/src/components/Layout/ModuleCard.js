import React from 'react';
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  Box,
  Typography,
  Tooltip
} from '@mui/material';
import {
  CheckCircle as ActiveIcon,
  Schedule as ComingSoonIcon,
  Build as DevelopmentIcon,
  Lock as RestrictedIcon
} from '@mui/icons-material';

const ModuleCard = ({ module, isActive, onClick }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'active':
        return {
          color: 'success',
          icon: <ActiveIcon sx={{ fontSize: 16 }} />,
          label: 'Active',
          clickable: true
        };
      case 'restricted':
        return {
          color: 'error',
          icon: <RestrictedIcon sx={{ fontSize: 16 }} />,
          label: 'Access Denied',
          clickable: false
        };
      case 'coming-soon':
        return {
          color: 'warning',
          icon: <ComingSoonIcon sx={{ fontSize: 16 }} />,
          label: 'Coming Soon',
          clickable: false
        };
      case 'development':
        return {
          color: 'info',
          icon: <DevelopmentIcon sx={{ fontSize: 16 }} />,
          label: 'In Development',
          clickable: false
        };
      default:
        return {
          color: 'default',
          icon: null,
          label: 'Unknown',
          clickable: false
        };
    }
  };

  const statusConfig = getStatusConfig(module.status);

  const handleClick = () => {
    if (statusConfig.clickable) {
      onClick();
    }
  };

  return (
    <ListItem disablePadding>
      <Tooltip 
        title={
          !statusConfig.clickable 
            ? `${module.name} - ${statusConfig.label}${module.status === 'restricted' ? ': Insufficient permissions' : ''}` 
            : module.description || module.name
        }
        placement="right"
      >
        <ListItemButton
          onClick={handleClick}
          disabled={!statusConfig.clickable}
          sx={{
            pl: 4,
            py: 1,
            backgroundColor: isActive ? 'rgba(103, 126, 234, 0.1)' : 'transparent',
            borderLeft: isActive ? '3px solid #667eea' : '3px solid transparent',
            '&:hover': {
              backgroundColor: statusConfig.clickable 
                ? 'rgba(103, 126, 234, 0.05)' 
                : 'rgba(0,0,0,0.02)',
              cursor: statusConfig.clickable ? 'pointer' : 'not-allowed'
            },
            '&.Mui-disabled': {
              opacity: 0.6
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Box
              sx={{
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: '8px',
                backgroundColor: isActive ? '#667eea' : 'rgba(103, 126, 234, 0.1)',
                color: isActive ? 'white' : '#667eea'
              }}
            >
              {module.icon}
            </Box>
          </ListItemIcon>
          
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#667eea' : 'text.primary',
                    fontSize: '0.875rem'
                  }}
                >
                  {module.name}
                </Typography>
                
                <Chip
                  size="small"
                  label={statusConfig.label}
                  color={statusConfig.color}
                  icon={statusConfig.icon}
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    '& .MuiChip-label': {
                      px: 1
                    },
                    '& .MuiChip-icon': {
                      fontSize: 12
                    }
                  }}
                />
              </Box>
            }
          />
        </ListItemButton>
      </Tooltip>
    </ListItem>
  );
};

export default ModuleCard;