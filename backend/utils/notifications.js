const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const smsService = require('../services/smsService');

// Mock email transporter for demo
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  
  // Mock transporter for demo
  return {
    sendMail: async (options) => {
      console.log('📧 Mock Email Sent:', {
        to: options.to,
        subject: options.subject,
        text: options.text?.substring(0, 100) + '...'
      });
      return { messageId: 'mock-' + Date.now() };
    }
  };
};

// Generate QR code for appointment token
const generateQRCode = async (token) => {
  try {
    const qrData = JSON.stringify({
      token,
      type: 'appointment',
      timestamp: new Date().toISOString()
    });
    
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return qrCodeDataURL;
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw error;
  }
};

// Send appointment confirmation
const sendConfirmation = async (patient, appointment, qrCode) => {
  try {
    const transporter = createTransporter();
    
    const emailContent = `
Dear ${patient.name},

Your appointment has been confirmed!

Appointment Details:
- Token: ${appointment.token}
- Doctor: ${appointment.doctor}
- Department: ${appointment.department}
- Date & Time: ${new Date(appointment.slot).toLocaleString()}
- Symptoms: ${appointment.symptoms}

Please arrive 15 minutes before your scheduled time.
Show your QR code or mention your token number: ${appointment.token}

Thank you for choosing our healthcare services.

Best regards,
HealthTech Scheduler Team
    `;
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@healthtech.com',
      to: patient.email || patient.phone + '@sms.gateway.com', // SMS gateway for demo
      subject: `Appointment Confirmed - Token ${appointment.token}`,
      text: emailContent,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5aa0;">Appointment Confirmed</h2>
          <p>Dear ${patient.name},</p>
          <p>Your appointment has been confirmed!</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Appointment Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Token:</strong> ${appointment.token}</li>
              <li><strong>Doctor:</strong> ${appointment.doctor}</li>
              <li><strong>Department:</strong> ${appointment.department}</li>
              <li><strong>Date & Time:</strong> ${new Date(appointment.slot).toLocaleString()}</li>
              <li><strong>Symptoms:</strong> ${appointment.symptoms}</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <p><strong>Your QR Code:</strong></p>
            <img src="${qrCode}" alt="Appointment QR Code" style="border: 1px solid #ddd; padding: 10px;">
          </div>
          
          <p style="color: #666;">
            Please arrive 15 minutes before your scheduled time.<br>
            Show your QR code or mention your token number: <strong>${appointment.token}</strong>
          </p>
          
          <p>Thank you for choosing our healthcare services.</p>
          <p>Best regards,<br>HealthTech Scheduler Team</p>
        </div>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent:', result.messageId);
    
    // Send real SMS confirmation
    await smsService.sendAppointmentConfirmation(patient, appointment);
    
    return result;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

// Send SMS notification (real Twilio)
const sendSMS = async (phone, message) => {
  try {
    const result = await smsService.sendSMS(phone, message);
    
    if (result.success) {
      console.log('📱 SMS sent successfully:', result.messageId);
      return { messageId: result.messageId, status: result.status };
    } else {
      console.error('📱 SMS sending failed:', result.error);
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('SMS sending error:', error);
    throw error;
  }
};

// Send reminder notification
const sendReminder = async (patient, appointment) => {
  try {
    // Send email reminder
    await sendConfirmation(patient, appointment, await generateQRCode(appointment.token));
    
    // Send SMS reminder
    await smsService.sendAppointmentReminder(patient, appointment);
    
    console.log('Reminder sent for appointment:', appointment.token);
  } catch (error) {
    console.error('Reminder sending error:', error);
    throw error;
  }
};

// Send queue update notification
const sendQueueUpdate = async (patient, appointment, position, eta) => {
  try {
    await smsService.sendQueueUpdate(patient, appointment, position, eta);
    console.log('Queue update sent for appointment:', appointment.token);
  } catch (error) {
    console.error('Queue update sending error:', error);
    throw error;
  }
};

module.exports = {
  generateQRCode,
  sendConfirmation,
  sendSMS,
  sendReminder,
  sendQueueUpdate
};