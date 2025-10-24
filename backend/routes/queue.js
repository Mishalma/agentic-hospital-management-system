const express = require('express');
const moment = require('moment');
const { Appointment, Patient } = require('../models');
const router = express.Router();

// Get current queue status with detailed patient information
router.get('/status', async (req, res) => {
  try {
    const queue = await Appointment.getTodaysQueue();
    
    // Enhance appointments with patient details and calculate positions/ETAs
    const enhancedQueue = await Promise.all(queue.map(async (appointment, index) => {
      const position = index + 1;
      const eta = position * 30; // 30 minutes per appointment
      
      // Get patient details if available
      let patientDetails = null;
      try {
        if (appointment.patientId || appointment.patient) {
          const patientId = appointment.patientId || appointment.patient;
          const patient = await (Patient.findByUniqueId ? 
            Patient.findByUniqueId(patientId) :
            Patient.findById ? Patient.findById(patientId) :
            Patient.find ? Patient.find({ uniqueId: patientId })[0] : null);
          
          if (patient) {
            patientDetails = {
              uniqueId: patient.uniqueId || patient.id,
              name: patient.name,
              phone: patient.phone ? patient.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : null,
              age: patient.age || (patient.dob ? moment().diff(moment(patient.dob), 'years') : null),
              gender: patient.gender
            };
          }
        }
      } catch (patientError) {
        console.error('Error fetching patient details:', patientError);
      }
      
      const appointmentData = appointment.toObject ? appointment.toObject() : appointment;
      
      return {
        id: appointmentData.id || appointmentData._id,
        token: appointmentData.token,
        patientName: appointmentData.patientName,
        patientDetails,
        doctor: appointmentData.doctor,
        department: appointmentData.department,
        slot: appointmentData.slot,
        symptoms: appointmentData.symptoms,
        urgency: appointmentData.urgency || 'normal',
        status: appointmentData.status,
        channel: appointmentData.channel || 'web',
        room: appointmentData.room,
        notes: appointmentData.notes,
        position,
        eta: `${Math.floor(eta / 60)}h ${eta % 60}m`,
        etaMinutes: eta,
        estimatedTime: moment().add(eta, 'minutes').format('HH:mm'),
        createdAt: appointmentData.createdAt,
        scheduledTime: moment(appointmentData.slot).format('HH:mm')
      };
    }));
    
    // Group by status for better organization
    const queueByStatus = {
      'in-progress': enhancedQueue.filter(apt => apt.status === 'in-progress'),
      'queued': enhancedQueue.filter(apt => apt.status === 'queued'),
      'booked': enhancedQueue.filter(apt => apt.status === 'booked')
    };
    
    const stats = {
      total: queue.length,
      inProgress: queueByStatus['in-progress'].length,
      waiting: queueByStatus.queued.length + queueByStatus.booked.length,
      averageWaitTime: queue.length > 0 ? Math.round(queue.length * 30 / queue.length) : 30,
      totalWaitingTime: (queueByStatus.queued.length + queueByStatus.booked.length) * 30
    };
    
    res.json({
      success: true,
      queue: queueByStatus,
      stats,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Queue status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get queue position for specific token with detailed information
router.get('/position/:token', async (req, res) => {
  try {
    const appointment = await Appointment.findByToken(req.params.token);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    const queue = await Appointment.getTodaysQueue();
    const position = queue.findIndex(apt => apt.token === req.params.token) + 1;
    
    if (position === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not in today\'s queue'
      });
    }
    
    const eta = position * 30; // 30 minutes per appointment
    const estimatedTime = moment().add(eta, 'minutes');
    
    // Get patient details
    let patientDetails = null;
    try {
      if (appointment.patientId || appointment.patient) {
        const patientId = appointment.patientId || appointment.patient;
        const patient = await (Patient.findByUniqueId ? 
          Patient.findByUniqueId(patientId) :
          Patient.findById ? Patient.findById(patientId) :
          Patient.find ? Patient.find({ uniqueId: patientId })[0] : null);
        
        if (patient) {
          patientDetails = {
            uniqueId: patient.uniqueId || patient.id,
            name: patient.name,
            phone: patient.phone ? patient.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : null
          };
        }
      }
    } catch (patientError) {
      console.error('Error fetching patient details:', patientError);
    }
    
    const appointmentData = appointment.toObject ? appointment.toObject() : appointment;
    
    res.json({
      success: true,
      token: req.params.token,
      position,
      eta: `${Math.floor(eta / 60)}h ${eta % 60}m`,
      estimatedTime: estimatedTime.format('HH:mm'),
      status: appointmentData.status,
      doctor: appointmentData.doctor,
      department: appointmentData.department,
      symptoms: appointmentData.symptoms,
      urgency: appointmentData.urgency,
      room: appointmentData.room,
      patientName: appointmentData.patientName,
      patientDetails,
      scheduledTime: moment(appointmentData.slot).format('HH:mm'),
      channel: appointmentData.channel
    });
    
  } catch (error) {
    console.error('Queue position error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update queue (move appointment up/down)
router.put('/reorder', async (req, res) => {
  try {
    const { appointments } = req.body; // Array of appointment IDs in new order
    
    if (!Array.isArray(appointments)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointments array'
      });
    }
    
    // In a real implementation, you'd update the queue order in the database
    // For demo purposes, we'll just acknowledge the reorder
    
    const io = req.app.get('io');
    io.to('queue-updates').emit('queue-reordered', { appointments });
    io.to('admin-updates').emit('queue-reordered', { appointments });
    
    res.json({
      success: true,
      message: 'Queue reordered successfully'
    });
    
  } catch (error) {
    console.error('Queue reorder error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Call next patient
router.post('/call-next', async (req, res) => {
  try {
    const { doctor, room } = req.body;
    
    const queue = await Appointment.getTodaysQueue();
    const nextAppointment = queue.find(apt => 
      apt.doctor === doctor && 
      (apt.status === 'booked' || apt.status === 'queued')
    );
    
    if (!nextAppointment) {
      return res.status(404).json({
        success: false,
        message: 'No patients waiting for this doctor'
      });
    }
    
    // Update appointment status
    await nextAppointment.updateStatus('in-progress', `Called to ${room}`);
    nextAppointment.room = room;
    await nextAppointment.save();
    
    // Emit real-time updates
    const io = req.app.get('io');
    io.to('queue-updates').emit('patient-called', {
      token: nextAppointment.token,
      doctor,
      room,
      patientName: nextAppointment.patientName
    });
    
    res.json({
      success: true,
      message: 'Patient called successfully',
      appointment: nextAppointment.toPublic()
    });
    
  } catch (error) {
    console.error('Call next patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get queue statistics
router.get('/stats', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? moment(date) : moment();
    
    const appointments = await Appointment.findByDoctor('all', targetDate.toDate());
    
    const stats = {
      totalAppointments: appointments.length,
      completed: appointments.filter(apt => apt.status === 'completed').length,
      canceled: appointments.filter(apt => apt.status === 'canceled').length,
      noShows: appointments.filter(apt => 
        apt.status === 'booked' && 
        moment(apt.slot).isBefore(moment().subtract(30, 'minutes'))
      ).length,
      averageWaitTime: 25, // Mock data
      patientSatisfaction: 4.2, // Mock data
      byUrgency: {
        high: appointments.filter(apt => apt.urgency === 'high').length,
        medium: appointments.filter(apt => apt.urgency === 'medium').length,
        low: appointments.filter(apt => apt.urgency === 'low').length
      },
      byChannel: {
        web: appointments.filter(apt => apt.channel === 'web').length,
        kiosk: appointments.filter(apt => apt.channel === 'kiosk').length,
        whatsapp: appointments.filter(apt => apt.channel === 'whatsapp').length,
        voice: appointments.filter(apt => apt.channel === 'voice').length
      }
    };
    
    res.json({
      success: true,
      date: targetDate.format('YYYY-MM-DD'),
      stats
    });
    
  } catch (error) {
    console.error('Queue stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;