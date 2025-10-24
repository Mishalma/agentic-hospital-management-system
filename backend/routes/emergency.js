const express = require('express');
const router = express.Router();
const EmergencyCase = require('../models/EmergencyCase');
const emergencyService = require('../services/emergencyService');

// Get all emergency cases with filtering and pagination
router.get('/cases', async (req, res) => {
  try {
    const { 
      status, 
      priority, 
      page = 1, 
      limit = 20,
      sortBy = 'arrivalTime',
      sortOrder = 'desc'
    } = req.query;

    let query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const cases = await EmergencyCase.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('patientId', 'name age gender')
      .populate('assignedStaff', 'name role');

    const total = await EmergencyCase.countDocuments(query);

    res.json({
      cases,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get emergency case by ID
router.get('/cases/:id', async (req, res) => {
  try {
    const case_ = await EmergencyCase.findById(req.params.id)
      .populate('patientId')
      .populate('assignedStaff');
    
    if (!case_) {
      return res.status(404).json({ error: 'Emergency case not found' });
    }

    // Calculate deterioration prediction if case is active
    let deteriorationPrediction = null;
    if (case_.status === 'active' && case_.vitalsHistory.length > 1) {
      deteriorationPrediction = emergencyService.predictDeterioration(case_);
    }

    res.json({
      case: case_,
      deteriorationPrediction
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new emergency case
router.post('/cases', async (req, res) => {
  try {
    const {
      patientId,
      chiefComplaint,
      symptoms,
      vitals,
      preHospitalData,
      arrivalMode
    } = req.body;

    // Calculate initial triage score
    const demographics = { age: req.body.age || 30 }; // Should come from patient data
    const triageAssessment = emergencyService.calculateTriageScore(
      vitals,
      symptoms,
      demographics
    );

    const newCase = new EmergencyCase({
      patientId,
      chiefComplaint,
      symptoms,
      vitals,
      preHospitalData,
      arrivalMode,
      triageScore: triageAssessment.score,
      priority: triageAssessment.priority,
      riskFactors: triageAssessment.riskFactors,
      recommendedAction: triageAssessment.recommendedAction,
      vitalsHistory: [{ ...vitals, timestamp: new Date() }],
      arrivalTime: new Date(),
      status: 'active'
    });

    await newCase.save();
    await newCase.populate('patientId', 'name age gender');

    res.status(201).json({
      case: newCase,
      triageAssessment
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update emergency case
router.put('/cases/:id', async (req, res) => {
  try {
    const updates = req.body;
    const case_ = await EmergencyCase.findById(req.params.id);

    if (!case_) {
      return res.status(404).json({ error: 'Emergency case not found' });
    }

    // If vitals are being updated, add to history and recalculate triage
    if (updates.vitals) {
      case_.vitalsHistory.push({
        ...updates.vitals,
        timestamp: new Date()
      });

      // Recalculate triage score with new vitals
      const demographics = { age: 30 }; // Should come from patient data
      const triageAssessment = emergencyService.calculateTriageScore(
        updates.vitals,
        case_.symptoms,
        demographics
      );

      case_.triageScore = triageAssessment.score;
      case_.priority = triageAssessment.priority;
      case_.riskFactors = triageAssessment.riskFactors;
      case_.recommendedAction = triageAssessment.recommendedAction;
    }

    // Update other fields
    Object.keys(updates).forEach(key => {
      if (key !== 'vitals') {
        case_[key] = updates[key];
      }
    });

    case_.lastUpdated = new Date();
    await case_.save();
    await case_.populate('patientId', 'name age gender');

    res.json({ case: case_ });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get priority queue
router.get('/queue', async (req, res) => {
  try {
    const activeCases = await EmergencyCase.find({ status: 'active' })
      .populate('patientId', 'name age gender')
      .populate('assignedStaff', 'name role')
      .sort({ 
        priority: { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 },
        arrivalTime: 1 
      });

    // Group by priority
    const queue = {
      critical: activeCases.filter(c => c.priority === 'Critical'),
      high: activeCases.filter(c => c.priority === 'High'),
      medium: activeCases.filter(c => c.priority === 'Medium'),
      low: activeCases.filter(c => c.priority === 'Low')
    };

    // Calculate wait times
    const now = new Date();
    Object.keys(queue).forEach(priority => {
      queue[priority] = queue[priority].map(case_ => ({
        ...case_.toObject(),
        waitTime: Math.floor((now - new Date(case_.arrivalTime)) / (1000 * 60)) // minutes
      }));
    });

    res.json(queue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign staff to case
router.post('/cases/:id/assign', async (req, res) => {
  try {
    const { staffId, role } = req.body;
    const case_ = await EmergencyCase.findById(req.params.id);

    if (!case_) {
      return res.status(404).json({ error: 'Emergency case not found' });
    }

    case_.assignedStaff.push({ staffId, role, assignedAt: new Date() });
    
    if (!case_.treatmentStartTime) {
      case_.treatmentStartTime = new Date();
    }

    await case_.save();
    await case_.populate('assignedStaff.staffId', 'name role');

    res.json({ case: case_ });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add treatment order
router.post('/cases/:id/orders', async (req, res) => {
  try {
    const { type, description, urgency, orderedBy } = req.body;
    const case_ = await EmergencyCase.findById(req.params.id);

    if (!case_) {
      return res.status(404).json({ error: 'Emergency case not found' });
    }

    const order = {
      type,
      description,
      urgency,
      orderedBy,
      orderedAt: new Date(),
      status: 'pending'
    };

    case_.treatmentOrders.push(order);
    await case_.save();

    res.json({ case: case_, order });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update treatment order status
router.put('/cases/:caseId/orders/:orderId', async (req, res) => {
  try {
    const { status, completedBy, notes } = req.body;
    const case_ = await EmergencyCase.findById(req.params.caseId);

    if (!case_) {
      return res.status(404).json({ error: 'Emergency case not found' });
    }

    const order = case_.treatmentOrders.id(req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: 'Treatment order not found' });
    }

    order.status = status;
    if (completedBy) order.completedBy = completedBy;
    if (notes) order.notes = notes;
    if (status === 'completed') order.completedAt = new Date();

    await case_.save();
    res.json({ case: case_, order });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Today's statistics
    const todayCases = await EmergencyCase.find({
      arrivalTime: { $gte: today }
    });

    const activeCases = await EmergencyCase.find({ status: 'active' });
    
    const stats = {
      today: {
        total: todayCases.length,
        critical: todayCases.filter(c => c.priority === 'Critical').length,
        high: todayCases.filter(c => c.priority === 'High').length,
        medium: todayCases.filter(c => c.priority === 'Medium').length,
        low: todayCases.filter(c => c.priority === 'Low').length,
        completed: todayCases.filter(c => c.status === 'completed').length
      },
      active: {
        total: activeCases.length,
        critical: activeCases.filter(c => c.priority === 'Critical').length,
        high: activeCases.filter(c => c.priority === 'High').length,
        medium: activeCases.filter(c => c.priority === 'Medium').length,
        low: activeCases.filter(c => c.priority === 'Low').length
      },
      averageWaitTime: 0,
      bedOccupancy: 85 // Mock data - would be calculated from actual bed management
    };

    // Calculate average wait time for completed cases today
    const completedToday = todayCases.filter(c => 
      c.status === 'completed' && c.treatmentStartTime
    );
    
    if (completedToday.length > 0) {
      const totalWaitTime = completedToday.reduce((sum, case_) => {
        return sum + (new Date(case_.treatmentStartTime) - new Date(case_.arrivalTime));
      }, 0);
      stats.averageWaitTime = Math.floor(totalWaitTime / (completedToday.length * 1000 * 60)); // minutes
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get quality metrics
router.get('/metrics/quality', async (req, res) => {
  try {
    const { timeframe = 24 } = req.query;
    const allCases = await EmergencyCase.find({});
    
    const metrics = emergencyService.calculateQualityMetrics(allCases, timeframe);
    
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Discharge patient
router.post('/cases/:id/discharge', async (req, res) => {
  try {
    const { disposition, dischargeNotes, followUpInstructions } = req.body;
    const case_ = await EmergencyCase.findById(req.params.id);

    if (!case_) {
      return res.status(404).json({ error: 'Emergency case not found' });
    }

    case_.status = 'completed';
    case_.disposition = disposition;
    case_.dischargeTime = new Date();
    case_.dischargeNotes = dischargeNotes;
    case_.followUpInstructions = followUpInstructions;

    await case_.save();
    res.json({ case: case_ });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;