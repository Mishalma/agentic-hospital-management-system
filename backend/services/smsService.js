const twilio = require('twilio');

class SMSService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
    
    if (this.accountSid && this.authToken && this.fromNumber) {
      this.client = twilio(this.accountSid, this.authToken);
      console.log('📱 Twilio SMS service initialized successfully');
    } else {
      console.log('⚠️  Twilio SMS credentials not configured. SMS will be mocked.');
      this.client = null;
    }
  }

  // Format phone number to international format
  formatPhoneNumber(phone) {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If it starts with country code, use as is
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return '+' + cleaned;
    }
    
    // If it's 10 digits, assume Indian number
    if (cleaned.length === 10) {
      return '+91' + cleaned;
    }
    
    // If it already has +, return as is
    if (phone.startsWith('+')) {
      return phone;
    }
    
    // Default: add +91 for Indian numbers
    return '+91' + cleaned;
  }

  // Send SMS message
  async sendSMS(to, message) {
    try {
      const formattedNumber = this.formatPhoneNumber(to);
      
      if (!this.client) {
        console.log(`📱 Mock SMS to ${formattedNumber}:`, message);
        return {
          success: true,
          messageId: 'mock-sms-' + Date.now(),
          status: 'sent'
        };
      }

      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: formattedNumber
      });

      console.log(`✅ SMS sent successfully to ${formattedNumber}:`, result.sid);
      
      return {
        success: true,
        messageId: result.sid,
        status: result.status,
        to: formattedNumber
      };

    } catch (error) {
      console.error('❌ SMS sending error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  // Send appointment confirmation SMS
  async sendAppointmentConfirmation(patient, appointment) {
    const message = `🏥 HealthTech Appointment Confirmed!

Token: ${appointment.token}
Patient: ${patient.name}
Doctor: ${appointment.doctor}
Date: ${new Date(appointment.slot).toLocaleDateString('en-IN')}
Time: ${new Date(appointment.slot).toLocaleTimeString('en-IN', { 
  hour: '2-digit', 
  minute: '2-digit' 
})}

Please arrive 15 minutes early.
Show token at reception.

Need help? Call (555) 123-4567`;

    return await this.sendSMS(patient.phone, message);
  }

  // Send appointment reminder (24 hours before)
  async sendAppointmentReminder(patient, appointment) {
    const appointmentDate = new Date(appointment.slot);
    const message = `🔔 Appointment Reminder

Hi ${patient.name},

Your appointment is tomorrow:
Token: ${appointment.token}
Doctor: ${appointment.doctor}
Time: ${appointmentDate.toLocaleTimeString('en-IN', { 
  hour: '2-digit', 
  minute: '2-digit' 
})}

Please arrive 15 minutes early.
Bring ID and insurance card.

To reschedule: Call (555) 123-4567`;

    return await this.sendSMS(patient.phone, message);
  }

  // Send queue position update
  async sendQueueUpdate(patient, appointment, position, estimatedWaitTime) {
    const message = `⏳ Queue Update

Token: ${appointment.token}
Position: #${position} in queue
Estimated wait: ${estimatedWaitTime} minutes

You'll receive another update when it's almost your turn.

Current status: ${appointment.status.toUpperCase()}`;

    return await this.sendSMS(patient.phone, message);
  }

  // Send "your turn" notification
  async sendYourTurnNotification(patient, appointment, room) {
    const message = `🏥 Your Turn!

Token: ${appointment.token}
Patient: ${patient.name}

Please proceed to ${room || 'Reception'} now.
Doctor: ${appointment.doctor}

Thank you for your patience!`;

    return await this.sendSMS(patient.phone, message);
  }

  // Send appointment status change
  async sendStatusUpdate(patient, appointment, newStatus, notes = '') {
    let statusMessage = '';
    
    switch (newStatus) {
      case 'confirmed':
        statusMessage = '✅ Appointment confirmed';
        break;
      case 'rescheduled':
        statusMessage = '📅 Appointment rescheduled';
        break;
      case 'cancelled':
        statusMessage = '❌ Appointment cancelled';
        break;
      case 'completed':
        statusMessage = '✅ Appointment completed';
        break;
      case 'in-progress':
        statusMessage = '🏥 Appointment in progress';
        break;
      default:
        statusMessage = `📋 Status: ${newStatus}`;
    }

    const message = `${statusMessage}

Token: ${appointment.token}
Patient: ${patient.name}
Doctor: ${appointment.doctor}

${notes ? `Note: ${notes}` : ''}

Questions? Call (555) 123-4567`;

    return await this.sendSMS(patient.phone, message);
  }

  // Send emergency notification
  async sendEmergencyNotification(patient, message) {
    const emergencyMessage = `🚨 URGENT - HealthTech Hospital

${message}

Patient: ${patient.name}
Contact us immediately: (555) 123-4567

This is an automated emergency notification.`;

    return await this.sendSMS(patient.phone, emergencyMessage);
  }

  // Send OTP for verification
  async sendOTP(phoneNumber, otp) {
    const message = `🔐 HealthTech Verification

Your OTP: ${otp}

This code expires in 10 minutes.
Do not share this code with anyone.

If you didn't request this, please ignore.`;

    return await this.sendSMS(phoneNumber, message);
  }

  // Send welcome message for new patients
  async sendWelcomeMessage(patient) {
    const message = `🏥 Welcome to HealthTech!

Hi ${patient.name},

Your Patient ID: ${patient.uniqueId}
Please save this ID for future appointments.

Services:
📱 Book via Telegram: @Srm123bot
🌐 Web: healthtech.com
📞 Call: (555) 123-4567

Thank you for choosing HealthTech!`;

    return await this.sendSMS(patient.phone, message);
  }

  // Bulk SMS for announcements
  async sendBulkSMS(phoneNumbers, message) {
    const results = [];
    
    for (const phoneNumber of phoneNumbers) {
      try {
        const result = await this.sendSMS(phoneNumber, message);
        results.push({
          phoneNumber,
          success: result.success,
          messageId: result.messageId,
          error: result.error
        });
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        results.push({
          phoneNumber,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  // Get message delivery status
  async getMessageStatus(messageId) {
    try {
      if (!this.client) {
        return {
          success: true,
          status: 'delivered',
          mock: true
        };
      }

      const message = await this.client.messages(messageId).fetch();
      
      return {
        success: true,
        status: message.status,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
        dateUpdated: message.dateUpdated
      };

    } catch (error) {
      console.error('Error fetching message status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get account balance (Twilio credits)
  async getAccountBalance() {
    try {
      if (!this.client) {
        return {
          success: true,
          balance: '10.00',
          currency: 'USD',
          mock: true
        };
      }

      const account = await this.client.api.accounts(this.accountSid).fetch();
      
      return {
        success: true,
        balance: account.balance,
        currency: account.currency || 'USD'
      };

    } catch (error) {
      console.error('Error fetching account balance:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Validate phone number
  async validatePhoneNumber(phoneNumber) {
    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      if (!this.client) {
        return {
          success: true,
          valid: true,
          formatted: formattedNumber,
          mock: true
        };
      }

      const lookup = await this.client.lookups.v1.phoneNumbers(formattedNumber).fetch();
      
      return {
        success: true,
        valid: true,
        formatted: lookup.phoneNumber,
        countryCode: lookup.countryCode,
        nationalFormat: lookup.nationalFormat
      };

    } catch (error) {
      console.error('Phone validation error:', error);
      return {
        success: false,
        valid: false,
        error: error.message
      };
    }
  }

  // Get SMS analytics
  getAnalytics() {
    // In a real implementation, you'd track these metrics
    return {
      totalSent: 0,
      delivered: 0,
      failed: 0,
      pending: 0,
      deliveryRate: 0,
      lastSent: null
    };
  }
}

module.exports = new SMSService();