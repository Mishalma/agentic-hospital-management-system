import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Card,
  CardContent,
  Grid,
  Alert
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  Send as SendIcon,
  Phone as PhoneIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';

const WhatsAppDemo = () => {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+1234567890');
  const [conversationState, setConversationState] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadAnalytics();
    loadConversationState();
    
    // Auto-refresh analytics every 30 seconds
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, [phoneNumber]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadAnalytics = async () => {
    try {
      const response = await axios.get('/api/whatsapp/analytics');
      if (response.data.success) {
        setAnalytics(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to load WhatsApp analytics:', error);
    }
  };

  const loadConversationState = async () => {
    try {
      const response = await axios.get(`/api/whatsapp/conversation/${encodeURIComponent(phoneNumber)}`);
      if (response.data.success) {
        setConversationState(response.data.conversation);
      }
    } catch (error) {
      console.error('Failed to load conversation state:', error);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: currentMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    try {
      // Send message to WhatsApp service
      const response = await axios.post('/api/whatsapp/test-message', {
        phone: phoneNumber,
        message: currentMessage
      });

      if (response.data.success) {
        // Simulate bot response (in real implementation, this would come via webhook)
        setTimeout(() => {
          const botResponse = {
            id: Date.now() + 1,
            text: getBotResponse(currentMessage),
            sender: 'bot',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          loadConversationState();
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }

    setCurrentMessage('');
  };

  const getBotResponse = (userMessage) => {
    // Simulate bot responses based on conversation flow
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('book') || lowerMessage.includes('appointment')) {
      return '🏥 Welcome to HealthTech Scheduler!\n\nAre you a new or existing patient?\n\n👤 New Patient\n🔍 Existing Patient';
    } else if (lowerMessage.includes('new')) {
      return '👤 New Patient Registration\n\nLet\'s collect your information. First, what\'s your full name?';
    } else if (lowerMessage.includes('existing')) {
      return '🔍 Existing Patient Lookup\n\nPlease provide your Patient ID (format: PT followed by 10 digits, e.g., PT2024123456)';
    } else if (lowerMessage.match(/^pt\d{10}$/)) {
      return '✅ Welcome back, John Doe!\n\nPlease describe your symptoms or reason for this visit:';
    } else if (lowerMessage.includes('fever') || lowerMessage.includes('pain')) {
      return '👨‍⚕️ Which doctor would you like to see?\n\n• Dr. Sarah Johnson (General)\n• Dr. Michael Chen (Cardiology)\n• Dr. Emily Rodriguez (Pediatrics)';
    } else if (lowerMessage.includes('johnson') || lowerMessage.includes('general')) {
      return '📅 Available slots for Dr. Sarah Johnson:\n\n• 10:00 AM\n• 2:00 PM\n• 4:00 PM';
    } else if (lowerMessage.includes('10:00') || lowerMessage.includes('10')) {
      return '📋 Booking Summary:\n\n👤 Patient: John Doe\n👨‍⚕️ Doctor: Dr. Sarah Johnson\n🏥 Department: General Medicine\n📅 Time: 10:00 AM\n💬 Symptoms: Fever and headache\n\nType "CONFIRM" to book this appointment or "CANCEL" to start over.';
    } else if (lowerMessage === 'confirm') {
      return '✅ Appointment Confirmed!\n\n🎫 Token: Q12345678\n📅 Date & Time: Today 10:00 AM\n👨‍⚕️ Doctor: Dr. Sarah Johnson\n\n📱 Your QR code: Q12345678\n\nShow this token at the hospital reception.';
    } else {
      return '👋 Hello! I can help you book an appointment.\n\nJust type "book appointment" to get started!';
    }
  };

  const quickMessages = [
    'book appointment',
    'new patient',
    'existing patient',
    'PT2024123456',
    'fever and headache',
    'Dr. Johnson',
    '10:00 AM',
    'CONFIRM'
  ];

  const handleQuickMessage = (message) => {
    setCurrentMessage(message);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <WhatsAppIcon sx={{ color: '#25D366' }} />
        WhatsApp Integration Demo
      </Typography>

      <Grid container spacing={4}>
        {/* Chat Interface */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ height: 600, display: 'flex', flexDirection: 'column' }}>
            {/* Chat Header */}
            <Box sx={{ 
              p: 2, 
              backgroundColor: '#25D366', 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <PhoneIcon />
              <Box>
                <Typography variant="h6">HealthTech Bot</Typography>
                <Typography variant="caption">
                  {phoneNumber} • Online
                </Typography>
              </Box>
            </Box>

            {/* Messages */}
            <Box sx={{ 
              flexGrow: 1, 
              overflow: 'auto', 
              p: 2,
              backgroundColor: '#f0f0f0'
            }}>
              <List>
                {messages.map((message) => (
                  <ListItem 
                    key={message.id}
                    sx={{ 
                      justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                      mb: 1
                    }}
                  >
                    <Paper
                      sx={{
                        p: 2,
                        maxWidth: '70%',
                        backgroundColor: message.sender === 'user' ? '#DCF8C6' : 'white',
                        borderRadius: 2
                      }}
                    >
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {message.text}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        {message.timestamp.toLocaleTimeString()}
                      </Typography>
                    </Paper>
                  </ListItem>
                ))}
              </List>
              <div ref={messagesEndRef} />
            </Box>

            {/* Message Input */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  size="small"
                />
                <Button
                  variant="outlined"
                  onClick={loadConversationState}
                  startIcon={<RefreshIcon />}
                >
                  Refresh
                </Button>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={3}
                  placeholder="Type a message..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button
                  variant="contained"
                  onClick={sendMessage}
                  disabled={!currentMessage.trim()}
                  sx={{ minWidth: 60 }}
                >
                  <SendIcon />
                </Button>
              </Box>

              {/* Quick Messages */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Quick Messages:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {quickMessages.map((msg, index) => (
                    <Chip
                      key={index}
                      label={msg}
                      onClick={() => handleQuickMessage(msg)}
                      size="small"
                      variant="outlined"
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Analytics & State */}
        <Grid item xs={12} md={4}>
          {/* Conversation State */}
          {conversationState && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Conversation State
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Current State:
                  </Typography>
                  <Chip 
                    label={conversationState.state} 
                    color="primary" 
                    size="small"
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Last Activity:
                  </Typography>
                  <Typography variant="body2">
                    {new Date(conversationState.lastActivity).toLocaleString()}
                  </Typography>
                </Box>
                {Object.keys(conversationState.data).length > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Collected Data:
                    </Typography>
                    <Box sx={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                      {JSON.stringify(conversationState.data, null, 2)}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* Analytics */}
          {analytics && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  WhatsApp Analytics
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
                      State Breakdown:
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

          {/* Instructions */}
          <Alert severity="info">
            <Typography variant="subtitle2" gutterBottom>
              Demo Instructions:
            </Typography>
            <Typography variant="body2">
              1. Use quick messages or type manually<br />
              2. Follow the conversation flow<br />
              3. Complete a full booking to see integration<br />
              4. Check admin dashboard for real-time updates
            </Typography>
          </Alert>

          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Production Setup:
            </Typography>
            <Typography variant="body2">
              • Configure Meta Developer Account<br />
              • Set up WhatsApp Business API<br />
              • Add webhook URL to Meta<br />
              • Update environment variables
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Container>
  );
};

export default WhatsAppDemo;