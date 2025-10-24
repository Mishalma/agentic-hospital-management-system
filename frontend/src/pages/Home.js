import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  PersonAdd as RegisterIcon,
  Queue as QueueIcon,
  Computer as KioskIcon,
  WhatsApp as WhatsAppIcon,
  RecordVoiceOver as VoiceIcon,
  CheckCircle as CheckIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Accessibility as AccessibilityIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Multi-Channel Registration',
      description: 'Register via web, kiosk, WhatsApp, or voice AI',
      icon: <RegisterIcon fontSize="large" />,
      action: () => navigate('/register'),
      actionText: 'Start Registration'
    },
    {
      title: 'Real-Time Queue',
      description: 'Live queue updates with ETA and position tracking',
      icon: <QueueIcon fontSize="large" />,
      action: () => navigate('/queue'),
      actionText: 'View Queue'
    },
    {
      title: 'Kiosk Mode',
      description: 'Touch-friendly interface for hospital kiosks',
      icon: <KioskIcon fontSize="large" />,
      action: () => navigate('/kiosk'),
      actionText: 'Open Kiosk'
    },
    {
      title: 'WhatsApp Booking',
      description: 'Chat-based appointments via WhatsApp integration',
      icon: <WhatsAppIcon fontSize="large" sx={{ color: '#25D366' }} />,
      action: () => navigate('/whatsapp'),
      actionText: 'Try WhatsApp Demo'
    }
  ];

  const benefits = [
    { icon: <SpeedIcon />, text: '40-50% reduction in admin time' },
    { icon: <CheckIcon />, text: '25% decrease in no-shows' },
    { icon: <SecurityIcon />, text: 'HIPAA compliant & secure' },
    { icon: <AccessibilityIcon />, text: 'Inclusive design for all users' }
  ];

  const channels = [
    { name: 'Web Portal', icon: '🌐', status: 'Active' },
    { name: 'Kiosk', icon: '🖥️', status: 'Active' },
    { name: 'WhatsApp', icon: <WhatsAppIcon />, status: 'Active' },
    { name: 'Voice AI', icon: <VoiceIcon />, status: 'Coming Soon' }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Section */}
      <Box textAlign="center" mb={6}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          Unified Digital Registration
        </Typography>
        <Typography variant="h5" color="text.secondary" gutterBottom>
          Streamline hospital appointments across all channels
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
          Reduce admin chaos, eliminate double-bookings, and provide seamless patient experience 
          with our omnichannel appointment scheduler.
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Button 
            variant="contained" 
            size="large" 
            onClick={() => navigate('/register')}
            startIcon={<RegisterIcon />}
          >
            Book Appointment
          </Button>
          <Button 
            variant="outlined" 
            size="large" 
            onClick={() => navigate('/queue')}
            startIcon={<QueueIcon />}
          >
            Check Queue
          </Button>
        </Box>
      </Box>

      {/* Features Grid */}
      <Grid container spacing={4} mb={6}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ color: 'primary.main', mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography variant="h6" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button 
                  variant="contained" 
                  onClick={feature.action}
                  fullWidth
                  sx={{ mx: 2 }}
                >
                  {feature.actionText}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Benefits & Channels */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Key Benefits
              </Typography>
              <List>
                {benefits.map((benefit, index) => (
                  <ListItem key={index}>
                    <ListItemIcon sx={{ color: 'success.main' }}>
                      {benefit.icon}
                    </ListItemIcon>
                    <ListItemText primary={benefit.text} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Available Channels
              </Typography>
              <List>
                {channels.map((channel, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {typeof channel.icon === 'string' ? (
                        <span style={{ fontSize: '24px' }}>{channel.icon}</span>
                      ) : (
                        channel.icon
                      )}
                    </ListItemIcon>
                    <ListItemText primary={channel.name} />
                    <Chip 
                      label={channel.status}
                      color={channel.status === 'Active' ? 'success' : 'default'}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Demo Notice */}
      <Box 
        sx={{ 
          mt: 4, 
          p: 3, 
          backgroundColor: 'info.light', 
          borderRadius: 2,
          textAlign: 'center'
        }}
      >
        <Typography variant="h6" gutterBottom>
          🚀 Hackathon Demo
        </Typography>
        <Typography variant="body2">
          This is a functional MVP built for a 50-hour HealthTech hackathon. 
          Features mock data and simplified integrations for demonstration purposes.
        </Typography>
      </Box>
    </Container>
  );
};

export default Home;