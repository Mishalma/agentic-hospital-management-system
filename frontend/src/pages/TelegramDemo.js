import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Alert,
  Button,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Telegram as TelegramIcon,
  SmartToy as BotIcon,
  QrCode as QrCodeIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Launch as LaunchIcon
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';

const TelegramDemo = () => {
  const [botInfo, setBotInfo] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [botToken, setBotToken] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBotInfo();
    loadAnalytics();
    
    // Auto-refresh analytics every 30 seconds
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadBotInfo = async () => {
    try {
      const response = await axios.get('/api/telegram/bot-info');
      if (response.data.success) {
        setBotInfo(response.data.bot);
      }
    } catch (error) {
      console.error('Failed to load bot info:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await axios.get('/api/telegram/analytics');
      if (response.data.success) {
        setAnalytics(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const setupInstructions = [
    {
      step: 1,
      title: 'Create Telegram Bot',
      description: 'Open Telegram and search for @BotFather',
      action: 'Send /newbot command'
    },
    {
      step: 2,
      title: 'Configure Bot',
      description: 'Choose name: "HealthTech Scheduler Bot"',
      action: 'Choose username: healthtech_scheduler_bot'
    },
    {
      step: 3,
      title: 'Get Bot Token',
      description: 'Copy the bot token from BotFather',
      action: 'Format: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz'
    },
    {
      step: 4,
      title: 'Update Environment',
      description: 'Add token to backend/.env file',
      action: 'TELEGRAM_BOT_TOKEN=your_bot_token'
    },
    {
      step: 5,
      title: 'Restart Server',
      description: 'Restart the backend server',
      action: 'npm run dev (in backend folder)'
    }
  ];

  const features = [
    {
      icon: <BotIcon color="primary" />,
      title: 'Interactive Commands',
      description: '/start, /book, /help, /status [token]'
    },
    {
      icon: <CheckIcon color="success" />,
      title: 'Complete Booking Flow',
      description: 'New/existing patient → symptoms → doctor → slot → confirmation'
    },
    {
      icon: <QrCodeIcon color="secondary" />,
      title: 'QR Code Generation',
      description: 'Automatic QR code sent as image with appointment token'
    },
    {
      icon: <TelegramIcon sx={{ color: '#0088cc' }} />,
      title: 'Real-time Integration',
      description: 'Bookings sync instantly with admin dashboard'
    }
  ];

  const demoFlow = [
    { user: '/start', bot: 'Welcome message with booking button' },
    { user: '📅 Book Appointment', bot: 'New or existing patient?' },
    { user: '👤 New Patient', bot: 'What\'s your full name?' },
    { user: 'John Doe', bot: 'Date of birth (YYYY-MM-DD)?' },
    { user: '1990-05-15', bot: 'Email address or skip?' },
    { user: 'john@email.com', bot: 'Registration complete! Describe symptoms:' },
    { user: 'fever and headache', bot: 'Select doctor (inline buttons)' },
    { user: '👨‍⚕️ Dr. Johnson', bot: 'Available time slots (buttons)' },
    { user: '🕐 10:00 AM', bot: 'Booking summary with confirm/cancel' },
    { user: '✅ Confirm', bot: 'Appointment confirmed + QR code image' }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <TelegramIcon sx={{ color: '#0088cc' }} />
        Telegram Bot Integration
      </Typography>

      <Grid container spacing={4}>
        {/* Bot Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🤖 Bot Status
              </Typography>
              
              {loading ? (
                <Typography>Loading bot information...</Typography>
              ) : botInfo ? (
                <Box>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">
                      ✅ Bot Active: @{botInfo.username}
                    </Typography>
                  </Alert>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Bot Name:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {botInfo.first_name}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Username:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        @{botInfo.username}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Bot ID:
                      </Typography>
                      <Typography variant="body1">
                        {botInfo.id}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Can Join Groups:
                      </Typography>
                      <Chip 
                        label={botInfo.can_join_groups ? 'Yes' : 'No'} 
                        color={botInfo.can_join_groups ? 'success' : 'default'}
                        size="small"
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<LaunchIcon />}
                      href={`https://t.me/${botInfo.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ backgroundColor: '#0088cc' }}
                    >
                      Open in Telegram
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Alert severity="warning">
                  <Typography variant="subtitle2" gutterBottom>
                    Bot Not Configured
                  </Typography>
                  <Typography variant="body2">
                    Please follow the setup instructions below to configure your Telegram bot.
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Analytics */}
          {analytics && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📊 Analytics
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {analytics.totalConversations}
                      </Typography>
                      <Typography variant="caption">
                        Total Conversations
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main">
                        {analytics.activeConversations}
                      </Typography>
                      <Typography variant="caption">
                        Active Now
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {Object.keys(analytics.stateBreakdown).length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Conversation States:
                    </Typography>
                    {Object.entries(analytics.stateBreakdown).map(([state, count]) => (
                      <Box key={state} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">{state}:</Typography>
                        <Chip label={count} size="small" />
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Setup Instructions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🛠️ Setup Instructions
              </Typography>
              
              <List>
                {setupInstructions.map((instruction, index) => (
                  <React.Fragment key={instruction.step}>
                    <ListItem>
                      <ListItemIcon>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: 'primary.main',
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: 'bold'
                        }}>
                          {instruction.step}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={instruction.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {instruction.description}
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              fontFamily: 'monospace', 
                              backgroundColor: 'grey.100', 
                              p: 0.5, 
                              borderRadius: 1,
                              mt: 0.5,
                              fontSize: '0.75rem'
                            }}>
                              {instruction.action}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < setupInstructions.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Features */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            ✨ Features
          </Typography>
          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ height: '100%', textAlign: 'center' }}>
                  <CardContent>
                    <Box sx={{ mb: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="subtitle1" gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Demo Flow */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                💬 Demo Conversation Flow
              </Typography>
              
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {demoFlow.map((exchange, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    {/* User Message */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                      <Paper sx={{ 
                        p: 1.5, 
                        backgroundColor: '#e3f2fd', 
                        maxWidth: '70%',
                        borderRadius: 2
                      }}>
                        <Typography variant="body2">
                          👤 {exchange.user}
                        </Typography>
                      </Paper>
                    </Box>
                    
                    {/* Bot Response */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <Paper sx={{ 
                        p: 1.5, 
                        backgroundColor: '#f5f5f5', 
                        maxWidth: '70%',
                        borderRadius: 2
                      }}>
                        <Typography variant="body2">
                          🤖 {exchange.bot}
                        </Typography>
                      </Paper>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Important Notes */}
        <Grid item xs={12}>
          <Alert severity="info" icon={<InfoIcon />}>
            <Typography variant="subtitle2" gutterBottom>
              📱 How to Test:
            </Typography>
            <Typography variant="body2">
              1. Complete the setup instructions above<br />
              2. Open Telegram and search for your bot<br />
              3. Send /start command to begin<br />
              4. Follow the booking flow<br />
              5. Check admin dashboard for real-time updates
            </Typography>
          </Alert>

          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              🚀 Production Ready:
            </Typography>
            <Typography variant="body2">
              • Real Telegram Bot API integration<br />
              • Interactive inline keyboards<br />
              • QR code image generation<br />
              • Complete appointment booking flow<br />
              • Real-time sync with admin dashboard
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TelegramDemo;