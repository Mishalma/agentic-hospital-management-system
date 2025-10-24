const express = require('express');
const smsService = require('../services/smsService');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const router = express.Router();

// Send test SMS
router.post('/send-test', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and message are required'
      });
    }
    
    const result = await smsService.sendSMS(phoneNumber, message);
    
    res.json({
      success: result.success,
      messageId: result.messageId,
      status: result.status,
      error: result.error
    });
  } catch (error) {
    console.error('Test SMS error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test SMS'
    });
  }
});

// Send appointment confirmation SMS
router.post('/send-confirmation', async (req, res) => {
  try {
    const { patientId, appointmentId } = req.body;
    
    const patient = await Patient.findById(patientId);
    const appointment = await Appointment.findById(appointmentId);
    
    if (!patient || !appointment) {
      return res.status(404).json({
        success: false,
        message: 'Patient or appointment not found'
      });
    }
    
    const result = await smsService.sendAppointmentConfirmation(patient, appointment);
    
    res.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error
    });
  } catch (error) {
    console.error('Confirmation SMS error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send confirmation SMS'
    });
  }
});

// Send appointment reminder
router.post('/send-reminder', async (req, res) => {
  try {
    const { patientId, appointmentId } = req.body;
    
    const patient = await Patient.findById(patientId);
    const appointment = await Appointment.findById(appointmentId);
    
    if (!patient || !appointment) {
      return res.status(404).json({
        success: false,
        message: 'Patient or appointment not found'
      });
    }
    
    const result = await smsService.sendAppointmentReminder(patient, appointment);
    
    res.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error
    });
  } catch (error) {
    console.error('Reminder SMS error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reminder SMS'
    });
  }
});

// Send queue update
router.post('/send-queue-update', async (req, res) => {
  try {
    const { patientId, appointmentId, position, estimatedWaitTime } = req.body;
    
    const patient = await Patient.findById(patientId);
    const appointment = await Appointment.findById(appointmentId);
    
    if (!patient || !appointment) {
      return res.status(404).json({
        success: false,
        message: 'Patient or appointment not found'
      });
    }
    
    const result = await smsService.sendQueueUpdate(
      patient, 
      appointment, 
      position, 
      estimatedWaitTime
    );
    
    res.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error
    });
  } catch (error) {
    console.error('Queue update SMS error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send queue update SMS'
    });
  }
});

// Send "your turn" notification
router.post('/send-your-turn', async (req, res) => {
  try {
    const { patientId, appointmentId, room } = req.body;
    
    const patient = await Patient.findById(patientId);
    const appointment = await Appointment.findById(appointmentId);
    
    if (!patient || !appointment) {
      return res.status(404).json({
        success: false,
        message: 'Patient or appointment not found'
      });
    }
    
    const result = await smsService.sendYourTurnNotification(patient, appointment, room);
    
    res.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error
    });
  } catch (error) {
    console.error('Your turn SMS error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send your turn SMS'
    });
  }
});

// Send status update
router.post('/send-status-update', async (req, res) => {
  try {
    const { patientId, appointmentId, newStatus, notes } = req.body;
    
    const patient = await Patient.findById(patientId);
    const appointment = await Appointment.findById(appointmentId);
    
    if (!patient || !appointment) {
      return res.status(404).json({
        success: false,
        message: 'Patient or appointment not found'
      });
    }
    
    const result = await smsService.sendStatusUpdate(patient, appointment, newStatus, notes);
    
    res.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error
    });
  } catch (error) {
    console.error('Status update SMS error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send status update SMS'
    });
  }
});

// Send welcome message to new patient
router.post('/send-welcome', async (req, res) => {
  try {
    const { patientId } = req.body;
    
    const patient = await Patient.findById(patientId);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    const result = await smsService.sendWelcomeMessage(patient);
    
    res.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error
    });
  } catch (error) {
    console.error('Welcome SMS error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send welcome SMS'
    });
  }
});

// Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    const result = await smsService.sendOTP(phoneNumber, otp);
    
    res.json({
      success: result.success,
      messageId: result.messageId,
      otp: result.success ? otp : undefined, // Only return OTP if SMS was sent successfully
      error: result.error
    });
  } catch (error) {
    console.error('OTP SMS error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP SMS'
    });
  }
});

// Bulk SMS
router.post('/send-bulk', async (req, res) => {
  try {
    const { phoneNumbers, message } = req.body;
    
    if (!phoneNumbers || !Array.isArray(phoneNumbers) || !message) {
      return res.status(400).json({
        success: false,
        message: 'Phone numbers array and message are required'
      });
    }
    
    const results = await smsService.sendBulkSMS(phoneNumbers, message);
    
    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };
    
    res.json({
      success: true,
      summary,
      results
    });
  } catch (error) {
    console.error('Bulk SMS error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk SMS'
    });
  }
});

// Get message status
router.get('/status/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const status = await smsService.getMessageStatus(messageId);
    
    res.json(status);
  } catch (error) {
    console.error('Message status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get message status'
    });
  }
});

// Validate phone number
router.post('/validate-phone', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }
    
    const validation = await smsService.validatePhoneNumber(phoneNumber);
    
    res.json(validation);
  } catch (error) {
    console.error('Phone validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate phone number'
    });
  }
});

// Get account balance
router.get('/balance', async (req, res) => {
  try {
    const balance = await smsService.getAccountBalance();
    res.json(balance);
  } catch (error) {
    console.error('Balance check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get account balance'
    });
  }
});

// Get SMS analytics
router.get('/analytics', (req, res) => {
  try {
    const analytics = smsService.getAnalytics();
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('SMS analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get SMS analytics'
    });
  }
});

module.exports = router;