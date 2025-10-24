const express = require('express');
const telegramService = require('../services/telegramService');
const router = express.Router();

// Webhook endpoint for Telegram
router.post('/webhook', async (req, res) => {
  try {
    const update = req.body;
    
    // Log incoming update for debugging
    console.log('📱 Telegram webhook received:', JSON.stringify(update, null, 2));
    
    // Telegram sends updates in this format
    if (update.message) {
      // Handle regular messages
      await telegramService.processMessage(
        update.message.chat.id,
        update.message.text || '',
        update.message.from
      );
    } else if (update.callback_query) {
      // Handle inline keyboard callbacks
      await telegramService.processCallback(
        update.callback_query.message.chat.id,
        update.callback_query.data,
        update.callback_query.from
      );
    }
    
    res.sendStatus(200);
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.sendStatus(500);
  }
});

// Get bot information
router.get('/bot-info', async (req, res) => {
  try {
    const botInfo = await telegramService.getBotInfo();
    
    if (!botInfo) {
      return res.status(503).json({
        success: false,
        message: 'Bot not configured or not responding'
      });
    }
    
    res.json({
      success: true,
      bot: botInfo
    });
  } catch (error) {
    console.error('Get bot info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bot information'
    });
  }
});

// Send test message (for debugging)
router.post('/send-message', async (req, res) => {
  try {
    const { chatId, message } = req.body;
    
    if (!chatId || !message) {
      return res.status(400).json({
        success: false,
        message: 'chatId and message are required'
      });
    }
    
    const result = await telegramService.sendMessage(chatId, message);
    
    res.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

// Get conversation state (for debugging)
router.get('/conversation/:chatId', (req, res) => {
  try {
    const conversation = telegramService.getConversationState(req.params.chatId);
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

// Get analytics
router.get('/analytics', (req, res) => {
  try {
    const stats = telegramService.getAnalytics();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Telegram analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics'
    });
  }
});

// Set webhook (for production deployment)
router.post('/set-webhook', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Webhook URL is required'
      });
    }
    
    // This would set the webhook URL with Telegram
    // For now, just return instructions
    res.json({
      success: true,
      message: 'Webhook setup instructions',
      instructions: {
        url: `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/setWebhook`,
        method: 'POST',
        body: { url: `${url}/api/telegram/webhook` }
      }
    });
  } catch (error) {
    console.error('Set webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set webhook'
    });
  }
});

module.exports = router;