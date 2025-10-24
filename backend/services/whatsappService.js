const axios = require('axios');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const { generateQRCode } = require('../utils/notifications');

class WhatsAppService {
  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || 'demo-token';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || 'demo-phone-id';
    this.baseUrl = 'https://graph.facebook.com/v18.0';
    
    // Conversation state management (in production, use Redis)
    this.conversations = new Map();
  }

  // Send message to WhatsApp user
  async sendMessage(to, message) {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`📱 WhatsApp Message to ${to}:`, message);
        return { success: true, messageId: 'mock-' + Date.now() };
      }

      const response = await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: { body: message }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return { success: true, messageId: response.data.messages[0].id };
    } catch (error) {
      console.error('WhatsApp send error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send interactive message with buttons
  async sendInteractiveMessage(to, text, buttons) {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`📱 WhatsApp Interactive Message to ${to}:`, { text, buttons });
        return { success: true, messageId: 'mock-interactive-' + Date.now() };
      }

      const response = await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: to,
          type: 'interactive',
          interactive: {
            type: 'button',
            body: { text },
            action: {
              buttons: buttons.map((btn, index) => ({
                type: 'reply',
                reply: {
                  id: btn.id || `btn_${index}`,
                  title: btn.title
                }
              }))
            }
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return { success: true, messageId: response.data.messages[0].id };
    } catch (error) {
      console.error('WhatsApp interactive send error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send image (QR code)
  async sendImage(to, imageUrl, caption) {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`📱 WhatsApp Image to ${to}:`, { imageUrl, caption });
        return { success: true, messageId: 'mock-image-' + Date.now() };
      }

      const response = await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: to,
          type: 'image',
          image: {
            link: imageUrl,
            caption: caption
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return { success: true, messageId: response.data.messages[0].id };
    } catch (error) {
      console.error('WhatsApp image send error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get or create conversation state
  getConversationState(phoneNumber) {
    if (!this.conversations.has(phoneNumber)) {
      this.conversations.set(phoneNumber, {
        state: 'INITIAL',
        data: {},
        lastActivity: new Date()
      });
    }
    return this.conversations.get(phoneNumber);
  }

  // Update conversation state
  updateConversationState(phoneNumber, state, data = {}) {
    const conversation = this.getConversationState(phoneNumber);
    conversation.state = state;
    conversation.data = { ...conversation.data, ...data };
    conversation.lastActivity = new Date();
    this.conversations.set(phoneNumber, conversation);
  }

  // Process incoming message
  async processMessage(from, message, messageType = 'text') {
    try {
      const conversation = this.getConversationState(from);
      
      console.log(`📱 Processing WhatsApp message from ${from}:`, {
        message,
        currentState: conversation.state,
        messageType
      });

      switch (conversation.state) {
        case 'INITIAL':
          return await this.handleInitialMessage(from, message);
        
        case 'PATIENT_TYPE_SELECTION':
          return await this.handlePatientTypeSelection(from, message);
        
        case 'COLLECT_NEW_PATIENT_NAME':
          return await this.handleNewPatientName(from, message);
        
        case 'COLLECT_NEW_PATIENT_DOB':
          return await this.handleNewPatientDOB(from, message);
        
        case 'COLLECT_NEW_PATIENT_EMAIL':
          return await this.handleNewPatientEmail(from, message);
        
        case 'COLLECT_EXISTING_PATIENT_ID':
          return await this.handleExistingPatientId(from, message);
        
        case 'COLLECT_SYMPTOMS':
          return await this.handleSymptoms(from, message);
        
        case 'SELECT_DOCTOR':
          return await this.handleDoctorSelection(from, message);
        
        case 'SELECT_SLOT':
          return await this.handleSlotSelection(from, message);
        
        case 'CONFIRM_BOOKING':
          return await this.handleBookingConfirmation(from, message);
        
        default:
          return await this.handleUnknownState(from, message);
      }
    } catch (error) {
      console.error('WhatsApp message processing error:', error);
      await this.sendMessage(from, 'Sorry, something went wrong. Please try again or contact our support team.');
      this.updateConversationState(from, 'INITIAL');
    }
  }

  async handleInitialMessage(from, message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('book') || lowerMessage.includes('appointment') || 
        lowerMessage.includes('appt') || lowerMessage === 'hi' || lowerMessage === 'hello') {
      
      await this.sendInteractiveMessage(from, 
        '🏥 Welcome to HealthTech Scheduler!\n\nAre you a new or existing patient?',
        [
          { id: 'new_patient', title: '👤 New Patient' },
          { id: 'existing_patient', title: '🔍 Existing Patient' }
        ]
      );
      
      this.updateConversationState(from, 'PATIENT_TYPE_SELECTION');
    } else {
      await this.sendMessage(from, 
        '👋 Hello! I can help you book an appointment.\n\nJust type "book appointment" to get started!'
      );
    }
  }

  async handlePatientTypeSelection(from, message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('new') || message === 'new_patient') {
      await this.sendMessage(from, 
        '👤 New Patient Registration\n\nLet\'s collect your information. First, what\'s your full name?'
      );
      this.updateConversationState(from, 'COLLECT_NEW_PATIENT_NAME');
    } else if (lowerMessage.includes('existing') || message === 'existing_patient') {
      await this.sendMessage(from, 
        '🔍 Existing Patient Lookup\n\nPlease provide your Patient ID (format: PT followed by 10 digits, e.g., PT2024123456)'
      );
      this.updateConversationState(from, 'COLLECT_EXISTING_PATIENT_ID');
    } else {
      await this.sendInteractiveMessage(from, 
        'Please select one of the options:',
        [
          { id: 'new_patient', title: '👤 New Patient' },
          { id: 'existing_patient', title: '🔍 Existing Patient' }
        ]
      );
    }
  }

  async handleNewPatientName(from, message) {
    if (message.trim().length < 2) {
      await this.sendMessage(from, 'Please provide a valid name (at least 2 characters).');
      return;
    }

    this.updateConversationState(from, 'COLLECT_NEW_PATIENT_DOB', { name: message.trim() });
    await this.sendMessage(from, 
      `Great! Hi ${message.trim()} 👋\n\nNow, what's your date of birth? (Please use format: YYYY-MM-DD, e.g., 1990-05-15)`
    );
  }

  async handleNewPatientDOB(from, message) {
    const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dobRegex.test(message.trim())) {
      await this.sendMessage(from, 'Please provide date of birth in YYYY-MM-DD format (e.g., 1990-05-15).');
      return;
    }

    const dob = new Date(message.trim());
    if (dob > new Date()) {
      await this.sendMessage(from, 'Date of birth cannot be in the future. Please try again.');
      return;
    }

    this.updateConversationState(from, 'COLLECT_NEW_PATIENT_EMAIL', { dob: message.trim() });
    await this.sendMessage(from, 
      'Perfect! 📅\n\nWhat\'s your email address? (Optional - you can type "skip" if you prefer not to provide it)'
    );
  }

  async handleNewPatientEmail(from, message) {
    let email = null;
    
    if (message.toLowerCase() !== 'skip') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(message.trim())) {
        await this.sendMessage(from, 'Please provide a valid email address or type "skip" to continue without email.');
        return;
      }
      email = message.trim();
    }

    // Create patient record
    try {
      const patientData = {
        name: this.getConversationState(from).data.name,
        dob: this.getConversationState(from).data.dob,
        phone: from,
        email: email,
        channel: 'whatsapp',
        whatsappNumber: from,
        language: 'en'
      };

      const patient = await Patient.create(patientData);
      
      this.updateConversationState(from, 'COLLECT_SYMPTOMS', { 
        patient: patient.toObject(),
        email: email 
      });
      
      await this.sendMessage(from, 
        `✅ Registration complete!\n\nYour Patient ID: ${patient.uniqueId}\n\nNow, please describe your symptoms or reason for visit:`
      );
    } catch (error) {
      console.error('Patient creation error:', error);
      await this.sendMessage(from, 'Sorry, there was an error creating your patient record. Please try again.');
      this.updateConversationState(from, 'INITIAL');
    }
  }

  async handleExistingPatientId(from, message) {
    const patientIdRegex = /^PT\d{10}$/;
    if (!patientIdRegex.test(message.trim().toUpperCase())) {
      await this.sendMessage(from, 
        'Please provide a valid Patient ID format: PT followed by 10 digits (e.g., PT2024123456)'
      );
      return;
    }

    try {
      const patient = await Patient.findByUniqueId(message.trim().toUpperCase());
      if (!patient) {
        await this.sendMessage(from, 
          'Patient ID not found. Please check your ID or register as a new patient.\n\nType "new patient" to register.'
        );
        this.updateConversationState(from, 'INITIAL');
        return;
      }

      this.updateConversationState(from, 'COLLECT_SYMPTOMS', { 
        patient: patient.toObject() 
      });
      
      await this.sendMessage(from, 
        `✅ Welcome back, ${patient.name}!\n\nPlease describe your symptoms or reason for this visit:`
      );
    } catch (error) {
      console.error('Patient lookup error:', error);
      await this.sendMessage(from, 'Sorry, there was an error looking up your patient record. Please try again.');
    }
  }

  async handleSymptoms(from, message) {
    if (message.trim().length < 5) {
      await this.sendMessage(from, 'Please provide more details about your symptoms (at least 5 characters).');
      return;
    }

    this.updateConversationState(from, 'SELECT_DOCTOR', { symptoms: message.trim() });
    
    await this.sendInteractiveMessage(from, 
      '👨‍⚕️ Which doctor would you like to see?',
      [
        { id: 'dr_johnson', title: 'Dr. Sarah Johnson (General)' },
        { id: 'dr_chen', title: 'Dr. Michael Chen (Cardiology)' },
        { id: 'dr_rodriguez', title: 'Dr. Emily Rodriguez (Pediatrics)' }
      ]
    );
  }

  async handleDoctorSelection(from, message) {
    const doctorMap = {
      'dr_johnson': { name: 'Dr. Sarah Johnson', department: 'General Medicine' },
      'dr_chen': { name: 'Dr. Michael Chen', department: 'Cardiology' },
      'dr_rodriguez': { name: 'Dr. Emily Rodriguez', department: 'Pediatrics' }
    };

    let selectedDoctor = null;
    
    // Handle button response or text input
    if (doctorMap[message]) {
      selectedDoctor = doctorMap[message];
    } else {
      // Try to match text input
      const lowerMessage = message.toLowerCase();
      if (lowerMessage.includes('johnson') || lowerMessage.includes('general')) {
        selectedDoctor = doctorMap['dr_johnson'];
      } else if (lowerMessage.includes('chen') || lowerMessage.includes('cardio')) {
        selectedDoctor = doctorMap['dr_chen'];
      } else if (lowerMessage.includes('rodriguez') || lowerMessage.includes('pediatric')) {
        selectedDoctor = doctorMap['dr_rodriguez'];
      }
    }

    if (!selectedDoctor) {
      await this.sendInteractiveMessage(from, 
        'Please select one of the available doctors:',
        [
          { id: 'dr_johnson', title: 'Dr. Sarah Johnson (General)' },
          { id: 'dr_chen', title: 'Dr. Michael Chen (Cardiology)' },
          { id: 'dr_rodriguez', title: 'Dr. Emily Rodriguez (Pediatrics)' }
        ]
      );
      return;
    }

    this.updateConversationState(from, 'SELECT_SLOT', { 
      doctor: selectedDoctor.name,
      department: selectedDoctor.department 
    });

    // Generate available slots (mock for demo)
    const slots = this.generateAvailableSlots();
    const slotButtons = slots.slice(0, 3).map((slot, index) => ({
      id: `slot_${index}`,
      title: slot.display
    }));

    await this.sendInteractiveMessage(from, 
      `📅 Available slots for ${selectedDoctor.name}:`,
      slotButtons
    );
  }

  async handleSlotSelection(from, message) {
    const conversation = this.getConversationState(from);
    const slots = this.generateAvailableSlots();
    
    let selectedSlot = null;
    
    // Handle button response
    if (message.startsWith('slot_')) {
      const index = parseInt(message.split('_')[1]);
      selectedSlot = slots[index];
    } else {
      // Try to match text input with time
      const timeMatch = message.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
      if (timeMatch) {
        selectedSlot = slots.find(slot => 
          slot.display.toLowerCase().includes(message.toLowerCase())
        );
      }
    }

    if (!selectedSlot) {
      await this.sendMessage(from, 'Please select one of the available time slots.');
      return;
    }

    this.updateConversationState(from, 'CONFIRM_BOOKING', { 
      slot: selectedSlot.time,
      slotDisplay: selectedSlot.display 
    });

    const { patient, doctor, department, symptoms } = conversation.data;
    
    await this.sendMessage(from, 
      `📋 Booking Summary:\n\n` +
      `👤 Patient: ${patient.name}\n` +
      `👨‍⚕️ Doctor: ${doctor}\n` +
      `🏥 Department: ${department}\n` +
      `📅 Time: ${selectedSlot.display}\n` +
      `💬 Symptoms: ${symptoms}\n\n` +
      `Type "CONFIRM" to book this appointment or "CANCEL" to start over.`
    );
  }

  async handleBookingConfirmation(from, message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage === 'confirm' || lowerMessage === 'yes') {
      await this.finalizeBooking(from);
    } else if (lowerMessage === 'cancel' || lowerMessage === 'no') {
      await this.sendMessage(from, 
        '❌ Booking cancelled. Type "book appointment" to start over.'
      );
      this.updateConversationState(from, 'INITIAL');
    } else {
      await this.sendMessage(from, 
        'Please type "CONFIRM" to book the appointment or "CANCEL" to start over.'
      );
    }
  }

  async finalizeBooking(from) {
    try {
      const conversation = this.getConversationState(from);
      const { patient, doctor, department, symptoms, slot } = conversation.data;

      // Create appointment
      const appointmentData = {
        patientId: patient.id,
        patientName: patient.name,
        doctor: doctor,
        department: department,
        slot: new Date(slot),
        symptoms: symptoms,
        urgency: 'medium', // Default for WhatsApp bookings
        channel: 'whatsapp'
      };

      const appointment = await Appointment.create(appointmentData);

      // Generate QR code
      const qrCode = await generateQRCode(appointment.token);

      // Send confirmation
      await this.sendMessage(from, 
        `✅ Appointment Confirmed!\n\n` +
        `🎫 Token: ${appointment.token}\n` +
        `📅 Date & Time: ${new Date(slot).toLocaleString()}\n` +
        `👨‍⚕️ Doctor: ${doctor}\n\n` +
        `📱 Your QR code is being sent...`
      );

      // In a real implementation, you'd upload the QR code and send it
      // For demo, we'll send a text representation
      await this.sendMessage(from, 
        `🔲 QR Code: ${appointment.token}\n\n` +
        `Show this token at the hospital reception.\n\n` +
        `Need help? Reply "help" or call (555) 123-4567`
      );

      // Reset conversation
      this.updateConversationState(from, 'INITIAL');

      // Emit real-time update to admin dashboard
      // This would be handled by the main server's socket.io instance
      console.log('📡 WhatsApp booking completed:', appointment.toPublic());

    } catch (error) {
      console.error('Booking finalization error:', error);
      await this.sendMessage(from, 
        'Sorry, there was an error finalizing your booking. Please try again or contact support.'
      );
      this.updateConversationState(from, 'INITIAL');
    }
  }

  async handleUnknownState(from, message) {
    await this.sendMessage(from, 
      '🤔 I didn\'t understand that. Let\'s start over.\n\nType "book appointment" to begin.'
    );
    this.updateConversationState(from, 'INITIAL');
  }

  generateAvailableSlots() {
    const slots = [];
    const now = new Date();
    const startHour = 9;
    const endHour = 17;

    for (let hour = startHour; hour < endHour; hour += 2) {
      const slotTime = new Date(now);
      slotTime.setHours(hour, 0, 0, 0);
      
      if (slotTime > now) {
        slots.push({
          time: slotTime.toISOString(),
          display: slotTime.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          })
        });
      }
    }

    return slots.slice(0, 6); // Return max 6 slots
  }

  // Clean up old conversations (call periodically)
  cleanupOldConversations() {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes
    
    for (const [phoneNumber, conversation] of this.conversations.entries()) {
      if (conversation.lastActivity < cutoff) {
        this.conversations.delete(phoneNumber);
      }
    }
  }
}

module.exports = new WhatsAppService();