const express = require('express');
const whatsappService = require('../services/whatsappService');
const router = express.Router();

// Webhook verification (required by WhatsApp)
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Verify the webhook (use your own verify token)
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'healthtech_verify_token';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ WhatsApp webhook verified');
    res.status(200).send(challenge);
  } else {
    console.log('❌ WhatsApp webhook verification failed');
    res.sendStatus(403);
  }
});

// Webhook for incoming messages
router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    // Check if this is a WhatsApp message
    if (body.object === 'whatsapp_business_account') {
      const entries = body.entry || [];
      
      for (const entry of entries) {
        const changes = entry.changes || [];
        
        for (const change of changes) {
          if (change.field === 'messages') {
            const value = change.value;
            
            // Process incoming messages
            if (value.messages) {
              for (const message of value.messages) {
                await processIncomingMessage(message, value);
              }
            }
            
            // Process message status updates
            if (value.statuses) {
              for (const status of value.statuses) {
                console.log('📱 Message status update:', status);
              }
            }
          }
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.sendStatus(500);
  }
});

// Process incoming WhatsApp message
async function processIncomingMessage(message, value) {
  try {
    const from = message.from;
    const messageId = message.id;
    const timestamp = message.timestamp;

    console.log(`📱 Incoming WhatsApp message from ${from}:`, message);

    // Handle different message types
    let messageText = '';
    let messageType = 'text';

    if (message.type === 'text') {
      messageText = message.text.body;
      messageType = 'text';
    } else if (message.type === 'interactive') {
      if (message.interactive.type === 'button_reply') {
        messageText = message.interactive.button_reply.id;
        messageType = 'button';
      } else if (message.interactive.type === 'list_reply') {
        messageText = message.interactive.list_reply.id;
        messageType = 'list';
      }
    } else if (message.type === 'button') {
      messageText = message.button.payload;
      messageType = 'button';
    } else {
      console.log('Unsupported message type:', message.type);
      await whatsappService.sendMessage(from, 
        'Sorry, I can only process text messages. Please send a text message.'
      );
      return;
    }

    // Process the message through our conversation flow
    await whatsappService.processMessage(from, messageText, messageType);

    // Emit real-time update to admin dashboard
    const io = req.app?.get('io');
    if (io) {
      io.to('admin-updates').emit('whatsapp-message', {
        from,
        message: messageText,
        timestamp: new Date(parseInt(timestamp) * 1000),
        type: messageType
      });
    }

  } catch (error) {
    console.error('Error processing WhatsApp message:', error);
  }
}

// Test endpoint for demo purposes
router.post('/test-message', async (req, res) => {
  try {
    const { phone, message } = req.body;
    
    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'Phone and message are required'
      });
    }

    // Process test message
    await whatsappService.processMessage(phone, message);

    res.json({
      success: true,
      message: 'Test message processed'
    });
  } catch (error) {
    console.error('Test message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process test message'
    });
  }
});

// Get conversation state (for debugging)
router.get('/conversation/:phone', (req, res) => {
  try {
    const conversation = whatsappService.getConversationState(req.params.phone);
    res.json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversation state'
    });
  }
});

// Send test message (for demo)
router.post('/send-test', async (req, res) => {
  try {
    const { to, message } = req.body;
    
    const result = await whatsappService.sendMessage(to, message);
    
    res.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error
    });
  } catch (error) {
    console.error('Send test message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test message'
    });
  }
});

// WhatsApp analytics
router.get('/analytics', (req, res) => {
  try {
    const conversations = whatsappService.conversations;
    const stats = {
      totalConversations: conversations.size,
      activeConversations: 0,
      stateBreakdown: {}
    };

    for (const [phone, conversation] of conversations.entries()) {
      const timeSinceLastActivity = Date.now() - conversation.lastActivity.getTime();
      if (timeSinceLastActivity < 30 * 60 * 1000) { // 30 minutes
        stats.activeConversations++;
      }

      const state = conversation.state;
      stats.stateBreakdown[state] = (stats.stateBreakdown[state] || 0) + 1;
    }

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('WhatsApp analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics'
    });
  }
});

module.exports = router;