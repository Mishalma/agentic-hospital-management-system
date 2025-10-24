const express = require('express');
const router = express.Router();
const billingService = require('../services/billingService');

// Create a new bill
router.post('/bills', async (req, res) => {
  try {
    const result = await billingService.createBill(req.body);
    
    if (result.success) {
      // Emit real-time update
      const io = req.app.get('io');
      if (io) {
        io.emit('bill-created', result.data);
      }
      
      res.status(201).json({
        success: true,
        message: 'Bill created successfully',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Error in POST /bills:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get bills with filtering
router.get('/bills', async (req, res) => {
  try {
    const filters = {
      patientId: req.query.patientId,
      status: req.query.status,
      priority: req.query.priority,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const result = await billingService.getBills(filters);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        count: result.data.length
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Error in GET /bills:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get a specific bill
router.get('/bills/:billId', async (req, res) => {
  try {
    const result = await billingService.getBill(req.params.billId);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Error in GET /bills/:billId:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update bill status
router.put('/bills/:billId/status', async (req, res) => {
  try {
    const { status, ...updateData } = req.body;
    const result = await billingService.updateBillStatus(
      req.params.billId,
      status,
      updateData
    );
    
    if (result.success) {
      // Emit real-time update
      const io = req.app.get('io');
      if (io) {
        io.emit('bill-updated', result.data);
      }
      
      res.json({
        success: true,
        message: 'Bill status updated successfully',
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Error in PUT /bills/:billId/status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add payment to bill
router.post('/bills/:billId/payments', async (req, res) => {
  try {
    const result = await billingService.addPayment(req.params.billId, req.body);
    
    if (result.success) {
      // Emit real-time update
      const io = req.app.get('io');
      if (io) {
        io.emit('payment-added', { billId: req.params.billId, payment: result.data });
      }
      
      res.status(201).json({
        success: true,
        message: 'Payment added successfully',
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Error in POST /bills/:billId/payments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Generate bill from services
router.post('/bills/generate', async (req, res) => {
  try {
    const { patientId, services } = req.body;
    
    if (!patientId || !services) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID and services are required'
      });
    }

    const result = await billingService.generateBillFromServices(patientId, services);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        message: 'Bill generated successfully from services',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Error in POST /bills/generate:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get billing statistics
router.get('/statistics', async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const result = await billingService.getBillingStatistics(filters);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Error in GET /statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get outstanding bills
router.get('/outstanding', async (req, res) => {
  try {
    const result = await billingService.getOutstandingBills();
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        count: result.data.length
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Error in GET /outstanding:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Billing Rates Management

// Create billing rate
router.post('/rates', async (req, res) => {
  try {
    const result = await billingService.createBillingRate(req.body);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        message: 'Billing rate created successfully',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Error in POST /rates:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get billing rates
router.get('/rates', async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      department: req.query.department,
      isActive: req.query.isActive === 'true'
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const result = await billingService.getBillingRates(filters);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        count: result.data.length
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Error in GET /rates:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get service categories for billing
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      {
        name: 'Consultation',
        description: 'Doctor consultations and medical advice',
        icon: '👨‍⚕️',
        departments: ['General Medicine', 'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics']
      },
      {
        name: 'Laboratory',
        description: 'Laboratory tests and diagnostics',
        icon: '🧪',
        departments: ['Laboratory', 'Pathology', 'Microbiology']
      },
      {
        name: 'Pharmacy',
        description: 'Medications and pharmaceutical products',
        icon: '💊',
        departments: ['Pharmacy', 'Clinical Pharmacy']
      },
      {
        name: 'Procedure',
        description: 'Medical procedures and treatments',
        icon: '🏥',
        departments: ['Surgery', 'Radiology', 'Cardiology', 'Emergency']
      },
      {
        name: 'Accommodation',
        description: 'Room charges and accommodation',
        icon: '🛏️',
        departments: ['Administration', 'Nursing']
      },
      {
        name: 'Miscellaneous',
        description: 'Other charges and services',
        icon: '📋',
        departments: ['Administration', 'Support Services']
      }
    ];

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error in GET /categories:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get payment methods
router.get('/payment-methods', async (req, res) => {
  try {
    const paymentMethods = [
      { code: 'Cash', name: 'Cash Payment', icon: '💵', description: 'Direct cash payment' },
      { code: 'Card', name: 'Credit/Debit Card', icon: '💳', description: 'Card payment via POS' },
      { code: 'UPI', name: 'UPI Payment', icon: '📱', description: 'Digital UPI payment' },
      { code: 'Net Banking', name: 'Net Banking', icon: '🏦', description: 'Online banking transfer' },
      { code: 'Cheque', name: 'Cheque Payment', icon: '📝', description: 'Bank cheque payment' },
      { code: 'Insurance', name: 'Insurance Claim', icon: '🛡️', description: 'Insurance settlement' },
      { code: 'Corporate', name: 'Corporate Payment', icon: '🏢', description: 'Corporate account settlement' }
    ];

    res.json({
      success: true,
      data: paymentMethods
    });
  } catch (error) {
    console.error('Error in GET /payment-methods:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;