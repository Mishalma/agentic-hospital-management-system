const express = require('express');
const moment = require('moment');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const router = express.Router();

// Get dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    const today = moment().startOf('day').toDate();
    const tomorrow = moment().add(1, 'day').startOf('day').toDate();
    
    // Get today's appointments
    const todaysAppointments = await Appointment.getTodaysQueue();
    
    // Calculate metrics
    const metrics = {
      todayStats: {
        totalAppointments: todaysAppointments.length,
        completed: todaysAppointments.filter(apt => apt.status === 'completed').length,
        inProgress: todaysAppointments.filter(apt => apt.status === 'in-progress').length,
        waiting: todaysAppointments.filter(apt => ['booked', 'queued'].includes(apt.status)).length,
        canceled: todaysAppointments.filter(apt => apt.status === 'canceled').length
      },
      channelBreakdown: {
        web: todaysAppointments.filter(apt => apt.channel === 'web').length,
        kiosk: todaysAppointments.filter(apt => apt.channel === 'kiosk').length,
        whatsapp: todaysAppointments.filter(apt => apt.channel === 'whatsapp').length,
        voice: todaysAppointments.filter(apt => apt.channel === 'voice').length
      },
      urgencyBreakdown: {
        high: todaysAppointments.filter(apt => apt.urgency === 'high').length,
        medium: todaysAppointments.filter(apt => apt.urgency === 'medium').length,
        low: todaysAppointments.filter(apt => apt.urgency === 'low').length
      },
      averageWaitTime: todaysAppointments.length > 0 ? 
        Math.round(todaysAppointments.length * 25) : 0, // Mock calculation
      patientSatisfaction: 4.2, // Mock data
      noShowRate: 15 // Mock percentage
    };
    
    // Recent appointments (last 10)
    const recentAppointments = todaysAppointments
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map(apt => apt.toPublic());
    
    res.json({
      success: true,
      metrics,
      recentAppointments,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all appointments for a specific date
router.get('/appointments', async (req, res) => {
  try {
    const { date, doctor, status } = req.query;
    const targetDate = date ? moment(date) : moment();
    
    let appointments;
    
    if (doctor && doctor !== 'all') {
      appointments = await Appointment.findByDoctor(doctor, targetDate.toDate());
    } else {
      // Get all appointments for the date
      const startOfDay = moment(targetDate).startOf('day').toDate();
      const endOfDay = moment(targetDate).endOf('day').toDate();
      
      // This would be a more complex query in a real implementation
      appointments = await Appointment.getTodaysQueue();
    }
    
    // Filter by status if provided
    if (status && status !== 'all') {
      appointments = appointments.filter(apt => apt.status === status);
    }
    
    // Sort by slot time
    appointments.sort((a, b) => new Date(a.slot) - new Date(b.slot));
    
    res.json({
      success: true,
      appointments: appointments.map(apt => apt.toPublic()),
      filters: { date: targetDate.format('YYYY-MM-DD'), doctor, status }
    });
    
  } catch (error) {
    console.error('Appointments fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Reschedule appointment
router.put('/appointments/:id/reschedule', async (req, res) => {
  try {
    const { newSlot, reason } = req.body;
    
    if (!newSlot) {
      return res.status(400).json({
        success: false,
        message: 'New slot time is required'
      });
    }
    
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if new slot is available
    const newSlotTime = moment(newSlot);
    const existingAppointments = await Appointment.findByDoctor(appointment.doctor, newSlotTime.toDate());
    const isSlotTaken = existingAppointments.some(apt => 
      moment(apt.slot).format() === newSlotTime.format() && 
      apt.status !== 'canceled' &&
      apt.id !== appointment.id
    );
    
    if (isSlotTaken) {
      return res.status(409).json({
        success: false,
        message: 'New slot is not available'
      });
    }
    
    // Update appointment
    appointment.slot = newSlot;
    appointment.notes = `${appointment.notes}\nRescheduled: ${reason || 'Admin rescheduled'}`;
    await appointment.save();
    
    // Emit real-time update
    const io = req.app.get('io');
    io.to('queue-updates').emit('appointment-rescheduled', appointment.toPublic());
    io.to('admin-updates').emit('appointment-rescheduled', appointment.toPublic());
    
    res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      appointment: appointment.toPublic()
    });
    
  } catch (error) {
    console.error('Reschedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get system analytics
router.get('/analytics', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    // Mock analytics data for demo
    const analytics = {
      period,
      appointmentTrends: [
        { date: '2024-01-15', total: 45, completed: 38, canceled: 4, noShow: 3 },
        { date: '2024-01-16', total: 52, completed: 44, canceled: 5, noShow: 3 },
        { date: '2024-01-17', total: 48, completed: 41, canceled: 3, noShow: 4 },
        { date: '2024-01-18', total: 55, completed: 47, canceled: 4, noShow: 4 },
        { date: '2024-01-19', total: 49, completed: 42, canceled: 3, noShow: 4 },
        { date: '2024-01-20', total: 38, completed: 32, canceled: 3, noShow: 3 },
        { date: '2024-01-21', total: 41, completed: 35, canceled: 3, noShow: 3 }
      ],
      channelPerformance: {
        web: { total: 180, satisfaction: 4.3, avgBookingTime: 3.2 },
        kiosk: { total: 95, satisfaction: 4.1, avgBookingTime: 2.8 },
        whatsapp: { total: 45, satisfaction: 4.5, avgBookingTime: 1.9 },
        voice: { total: 8, satisfaction: 4.0, avgBookingTime: 4.1 }
      },
      peakHours: [
        { hour: 9, appointments: 25 },
        { hour: 10, appointments: 32 },
        { hour: 11, appointments: 28 },
        { hour: 14, appointments: 30 },
        { hour: 15, appointments: 26 },
        { hour: 16, appointments: 22 }
      ],
      departmentStats: [
        { name: 'General Medicine', appointments: 120, avgWait: 22 },
        { name: 'Cardiology', appointments: 85, avgWait: 28 },
        { name: 'Orthopedics', appointments: 65, avgWait: 25 },
        { name: 'Pediatrics', appointments: 58, avgWait: 18 }
      ]
    };
    
    res.json({
      success: true,
      analytics,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Export data (CSV format)
router.get('/export', async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;
    
    // Get appointments in date range
    const appointments = await Appointment.getTodaysQueue(); // Simplified for demo
    
    if (format === 'csv') {
      const csvHeader = 'Token,Patient Name,Doctor,Department,Slot,Status,Urgency,Channel,Created At\n';
      const csvData = appointments.map(apt => 
        `${apt.token},${apt.patientName},${apt.doctor},${apt.department},${apt.slot},${apt.status},${apt.urgency},${apt.channel},${apt.createdAt}`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=appointments.csv');
      res.send(csvHeader + csvData);
    } else {
      res.json({
        success: true,
        data: appointments.map(apt => apt.toPublic()),
        exportedAt: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;