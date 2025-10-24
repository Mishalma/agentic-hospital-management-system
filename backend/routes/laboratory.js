const express = require('express');
const router = express.Router();
const laboratoryService = require('../services/laboratoryService');

// Create a new lab order
router.post('/orders', async (req, res) => {
  try {
    const result = await laboratoryService.createLabOrder(req.body);
    
    if (result.success) {
      // Emit real-time update
      const io = req.app.get('io');
      if (io) {
        io.emit('lab-order-created', result.data);
      }
      
      res.status(201).json({
        success: true,
        message: 'Lab order created successfully',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Error in POST /orders:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get lab orders with filtering
router.get('/orders', async (req, res) => {
  try {
    const filters = {
      patientId: req.query.patientId,
      status: req.query.status,
      priority: req.query.priority,
      doctorId: req.query.doctorId,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const result = await laboratoryService.getLabOrders(filters);
    
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
    console.error('Error in GET /orders:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get a specific lab order
router.get('/orders/:orderId', async (req, res) => {
  try {
    const result = await laboratoryService.getLabOrder(req.params.orderId);
    
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
    console.error('Error in GET /orders/:orderId:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update lab order status
router.put('/orders/:orderId/status', async (req, res) => {
  try {
    const { status, ...updateData } = req.body;
    const result = await laboratoryService.updateLabOrderStatus(
      req.params.orderId,
      status,
      updateData
    );
    
    if (result.success) {
      // Emit real-time update
      const io = req.app.get('io');
      if (io) {
        io.emit('lab-order-updated', result.data);
      }
      
      res.json({
        success: true,
        message: 'Lab order status updated successfully',
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Error in PUT /orders/:orderId/status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update sample collection
router.put('/orders/:orderId/collection', async (req, res) => {
  try {
    const result = await laboratoryService.updateSampleCollection(
      req.params.orderId,
      req.body
    );
    
    if (result.success) {
      // Emit real-time update
      const io = req.app.get('io');
      if (io) {
        io.emit('sample-collected', result.data);
      }
      
      res.json({
        success: true,
        message: 'Sample collection updated successfully',
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Error in PUT /orders/:orderId/collection:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create lab result
router.post('/results', async (req, res) => {
  try {
    const result = await laboratoryService.createLabResult(req.body);
    
    if (result.success) {
      // Emit real-time update
      const io = req.app.get('io');
      if (io) {
        io.emit('lab-result-created', result.data);
      }
      
      res.status(201).json({
        success: true,
        message: 'Lab result created successfully',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Error in POST /results:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get lab results with filtering
router.get('/results', async (req, res) => {
  try {
    const filters = {
      patientId: req.query.patientId,
      orderId: req.query.orderId,
      status: req.query.status,
      category: req.query.category,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const result = await laboratoryService.getLabResults(filters);
    
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
    console.error('Error in GET /results:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify lab result
router.put('/results/:resultId/verify', async (req, res) => {
  try {
    const result = await laboratoryService.verifyLabResult(
      req.params.resultId,
      req.body
    );
    
    if (result.success) {
      // Emit real-time update
      const io = req.app.get('io');
      if (io) {
        io.emit('lab-result-verified', result.data);
      }
      
      res.json({
        success: true,
        message: 'Lab result verified successfully',
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Error in PUT /results/:resultId/verify:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get laboratory statistics
router.get('/statistics', async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const result = await laboratoryService.getLabStatistics(filters);
    
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

// Get pending orders for lab workflow
router.get('/pending', async (req, res) => {
  try {
    const result = await laboratoryService.getPendingOrders();
    
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
    console.error('Error in GET /pending:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Perform quality control check
router.post('/orders/:orderId/qc', async (req, res) => {
  try {
    const result = await laboratoryService.performQCCheck(
      req.params.orderId,
      req.body
    );
    
    if (result.success) {
      res.json({
        success: true,
        message: 'QC check performed successfully',
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Error in POST /orders/:orderId/qc:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get test catalog/menu
router.get('/test-catalog', async (req, res) => {
  try {
    // This would typically come from a database
    const testCatalog = [
      {
        category: 'Hematology',
        tests: [
          {
            testCode: 'CBC',
            testName: 'Complete Blood Count',
            specimen: 'Blood',
            turnaroundTime: '2-4 hours',
            cost: 150.00,
            parameters: ['Hemoglobin', 'Hematocrit', 'WBC', 'RBC', 'Platelets']
          },
          {
            testCode: 'ESR',
            testName: 'Erythrocyte Sedimentation Rate',
            specimen: 'Blood',
            turnaroundTime: '1 hour',
            cost: 75.00,
            parameters: ['ESR']
          }
        ]
      },
      {
        category: 'Biochemistry',
        tests: [
          {
            testCode: 'LIPID',
            testName: 'Lipid Panel',
            specimen: 'Blood',
            turnaroundTime: '4-6 hours',
            cost: 200.00,
            parameters: ['Total Cholesterol', 'HDL', 'LDL', 'Triglycerides']
          },
          {
            testCode: 'BMP',
            testName: 'Basic Metabolic Panel',
            specimen: 'Blood',
            turnaroundTime: '2-4 hours',
            cost: 180.00,
            parameters: ['Glucose', 'BUN', 'Creatinine', 'Electrolytes']
          }
        ]
      },
      {
        category: 'Microbiology',
        tests: [
          {
            testCode: 'URINE_CULTURE',
            testName: 'Urine Culture',
            specimen: 'Urine',
            turnaroundTime: '24-48 hours',
            cost: 120.00,
            parameters: ['Bacterial Growth', 'Sensitivity']
          }
        ]
      }
    ];

    res.json({
      success: true,
      data: testCatalog
    });
  } catch (error) {
    console.error('Error in GET /test-catalog:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;