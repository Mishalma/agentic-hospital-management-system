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
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Sms as SmsIcon,
  Send as SendIcon,
  Phone as PhoneIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  AccountBalance as BalanceIcon
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';

const SMSDemo = () => {
  const [balance, setBalance] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [testMessage, setTestMessage] = useState({
    phoneNumber: '+919778393574',
    message: 'Hello! This is a test message from HealthTech Scheduler.'
  });
  const [messageType, setMessageType] = useState('test');
  const [loading, setLoading] = useState(false);
  const [sentMessages, setSentMessages] = useState([]);

  useEffect(() => {
    loadBalance();
    loadAnalytics();
  }, []);

  const loadBalance = async () => {
    try {
      const response = await axios.get('/api/sms/balance');
      if (response.data.success) {
        setBalance(response.data);
      }
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await axios.get('/api/sms/analytics');
      if (response.data.success) {
        setAnalytics(response.data.analytics);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const sendTestSMS = async () => {
    if (!testMessage.phoneNumber || !testMessage.message) {
      toast.error('Please enter phone number and message');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/sms/send-test', testMessage);
      
      if (response.data.success) {
        toast.success('SMS sent successfully!');
        setSentMessages(prev => [{
          id: Date.now(),
          phoneNumber: testMessage.phoneNumber,
          message: testMessage.message,
          messageId: response.data.messageId,
          status: response.data.status,
          timestamp: new Date(),
          type: 'Test Message'
        }, ...prev]);
        
        // Clear form
        setTestMessage({
          phoneNumber: '+919778393574',
          message: 'Hello! This is a test message from HealthTech Scheduler.'
        });
      } else {
        toast.error(response.data.error || 'Failed to send SMS');
      }
    } catch (error) {
      console.error('SMS send error:', error);
      toast.error('Failed to send SMS');
    } finally {
      setLoading(false);
    }
  };

  const sendOTP = async () => {
    if (!testMessage.phoneNumber) {
      toast.error('Please enter phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/sms/send-otp', {
        phoneNumber: testMessage.phoneNumber
      });
      
      if (response.data.success) {
        toast.success(`OTP sent! Code: ${response.data.otp}`);
        setSentMessages(prev => [{
          id: Date.now(),
          phoneNumber: testMessage.phoneNumber,
          message: `OTP: ${response.data.otp}`,
          messageId: response.data.messageId,
          status: 'sent',
          timestamp: new Date(),
          type: 'OTP'
        }, ...prev]);
      } else {
        toast.error(response.data.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('OTP send error:', error);
      toast.error('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const validatePhone = async () => {
    if (!testMessage.phoneNumber) {
      toast.error('Please enter phone number');
      return;
    }

    try {
      const response = await axios.post('/api/sms/validate-phone', {
        phoneNumber: testMessage.phoneNumber
      });
      
      if (response.data.success && response.data.valid) {
        toast.success(`Valid number: ${response.data.formatted}`);
      } else {
        toast.error('Invalid phone number');
      }
    } catch (error) {
      console.error('Phone validation error:', error);
      toast.error('Failed to validate phone number');
    }
  };

  const messageTemplates = {
    test: 'Hello! This is a test message from HealthTech Scheduler.',
    appointment: '🏥 Appointment Confirmed!\n\nToken: Q12345678\nDoctor: Dr. Sarah Johnson\nDate: Today 10:00 AM\n\nPlease arrive 15 minutes early.',
    reminder: '🔔 Appointment Reminder\n\nYour appointment is tomorrow at 10:00 AM with Dr. Johnson.\nToken: Q12345678\n\nPlease arrive 15 minutes early.',
    queue: '⏳ Queue Update\n\nToken: Q12345678\nPosition: #3 in queue\nEstimated wait: 15 minutes',
    welcome: '🏥 Welcome to HealthTech!\n\nYour Patient ID: PT2024123456\nBook appointments via Telegram: @Srm123bot'
  };

  const handleTemplateChange = (template) => {
    setMessageType(template);
    setTestMessage(prev => ({
      ...prev,
      message: messageTemplates[template]
    }));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <SmsIcon sx={{ color: '#4caf50' }} />
        SMS Integration (Twilio)
      </Typography>

      <Grid container spacing={4}>
        {/* Account Status */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📱 Account Status
              </Typography>
              
              {balance ? (
                <Box>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">
                      ✅ Twilio Connected
                    </Typography>
                  </Alert>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <BalanceIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6" color="primary">
                          ${balance.balance}
                        </Typography>
                        <Typography variant="caption">
                          Account Balance
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <PhoneIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                        <Typography variant="body2" fontWeight="bold">
                          +91 97783 93574
                        </Typography>
                        <Typography variant="caption">
                          Twilio Number
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {balance.mock && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        Demo mode - SMS will be logged to console
                      </Typography>
                    </Alert>
                  )}
                </Box>
              ) : (
                <Alert severity="warning">
                  <Typography variant="subtitle2" gutterBottom>
                    Connecting to Twilio...
                  </Typography>
                  <Typography variant="body2">
                    Checking account status and balance.
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
                  📊 SMS Analytics
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {analytics.totalSent}
                      </Typography>
                      <Typography variant="caption">
                        Total Sent
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main">
                        {analytics.delivered}
                      </Typography>
                      <Typography variant="caption">
                        Delivered
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="error.main">
                        {analytics.failed}
                      </Typography>
                      <Typography variant="caption">
                        Failed
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="warning.main">
                        {analytics.pending}
                      </Typography>
                      <Typography variant="caption">
                        Pending
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* SMS Testing */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📤 Send Test SMS
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={testMessage.phoneNumber}
                    onChange={(e) => setTestMessage(prev => ({
                      ...prev,
                      phoneNumber: e.target.value
                    }))}
                    placeholder="+919778393574"
                    helperText="Include country code (e.g., +91 for India)"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Message Template</InputLabel>
                    <Select
                      value={messageType}
                      onChange={(e) => handleTemplateChange(e.target.value)}
                      label="Message Template"
                    >
                      <MenuItem value="test">Test Message</MenuItem>
                      <MenuItem value="appointment">Appointment Confirmation</MenuItem>
                      <MenuItem value="reminder">Appointment Reminder</MenuItem>
                      <MenuItem value="queue">Queue Update</MenuItem>
                      <MenuItem value="welcome">Welcome Message</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Message"
                    value={testMessage.message}
                    onChange={(e) => setTestMessage(prev => ({
                      ...prev,
                      message: e.target.value
                    }))}
                    helperText={`${testMessage.message.length}/160 characters`}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      startIcon={<SendIcon />}
                      onClick={sendTestSMS}
                      disabled={loading}
                    >
                      {loading ? 'Sending...' : 'Send SMS'}
                    </Button>
                    
                    <Button
                      variant="outlined"
                      onClick={sendOTP}
                      disabled={loading}
                    >
                      Send OTP
                    </Button>
                    
                    <Button
                      variant="outlined"
                      onClick={validatePhone}
                    >
                      Validate Phone
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Sent Messages */}
          {sentMessages.length > 0 && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📋 Recent Messages
                </Typography>
                
                <List>
                  {sentMessages.slice(0, 5).map((msg, index) => (
                    <React.Fragment key={msg.id}>
                      <ListItem>
                        <ListItemIcon>
                          {msg.status === 'sent' || msg.status === 'delivered' ? (
                            <CheckIcon color="success" />
                          ) : (
                            <ErrorIcon color="error" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Typography variant="subtitle2">
                                {msg.phoneNumber}
                              </Typography>
                              <Chip 
                                label={msg.type} 
                                size="small" 
                                color="primary"
                              />
                              <Chip 
                                label={msg.status} 
                                size="small" 
                                color={msg.status === 'sent' ? 'success' : 'default'}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" sx={{ 
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: 400
                              }}>
                                {msg.message}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {msg.timestamp.toLocaleString()} • ID: {msg.messageId}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < sentMessages.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Features & Integration */}
        <Grid item xs={12}>
          <Alert severity="info" icon={<InfoIcon />}>
            <Typography variant="subtitle2" gutterBottom>
              🚀 Real SMS Integration Features:
            </Typography>
            <Typography variant="body2">
              • <strong>Appointment Confirmations:</strong> Automatic SMS when booking via web/Telegram<br />
              • <strong>Reminders:</strong> 24-hour advance notifications<br />
              • <strong>Queue Updates:</strong> Position and wait time notifications<br />
              • <strong>Status Changes:</strong> Real-time appointment status updates<br />
              • <strong>OTP Verification:</strong> Secure phone number validation<br />
              • <strong>Bulk Messaging:</strong> Announcements and emergency notifications
            </Typography>
          </Alert>

          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              ✅ Production Ready:
            </Typography>
            <Typography variant="body2">
              • Real Twilio API integration with your credentials<br />
              • Automatic phone number formatting for Indian numbers<br />
              • Delivery status tracking and error handling<br />
              • Rate limiting and retry logic<br />
              • Complete SMS templates for all appointment scenarios
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SMSDemo;