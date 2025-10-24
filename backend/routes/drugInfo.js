const express = require('express');
const router = express.Router();
const DrugInformationService = require('../services/drugInformationService');
const ADR = require('../models/ADR');

// Get drug information
router.get('/drugs/:drugName', (req, res) => {
  try {
    const { drugName } = req.params;
    const result = DrugInformationService.getDrugInfo(drugName);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error getting drug info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get drug information',
      error: error.message
    });
  }
});

// Search drugs
router.get('/drugs/search/:query', (req, res) => {
  try {
    const { query } = req.params;
    const result = DrugInformationService.searchDrugs(query);
    res.json(result);
  } catch (error) {
    console.error('Error searching drugs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search drugs',
      error: error.message
    });
  }
});

// Get drug categories
router.get('/categories', (req, res) => {
  try {
    const result = DrugInformationService.getCategories();
    res.json(result);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get categories',
      error: error.message
    });
  }
});

// Get drugs by category
router.get('/categories/:category', (req, res) => {
  try {
    const { category } = req.params;
    const result = DrugInformationService.getDrugsByCategory(category);
    res.json(result);
  } catch (error) {
    console.error('Error getting drugs by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get drugs by category',
      error: error.message
    });
  }
});

// Check drug-drug interactions
router.post('/interactions/drug-drug', (req, res) => {
  try {
    const { medications } = req.body;
    
    if (!medications || !Array.isArray(medications) || medications.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 medications required for interaction check'
      });
    }
    
    const result = DrugInformationService.checkDrugInteractions(medications);
    res.json(result);
  } catch (error) {
    console.error('Error checking drug interactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check drug interactions',
      error: error.message
    });
  }
});

// Check food-drug interactions
router.post('/interactions/food-drug', (req, res) => {
  try {
    const { drugName, foods = [] } = req.body;
    
    if (!drugName) {
      return res.status(400).json({
        success: false,
        message: 'Drug name is required'
      });
    }
    
    const result = DrugInformationService.checkFoodInteractions(drugName, foods);
    res.json(result);
  } catch (error) {
    console.error('Error checking food interactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check food interactions',
      error: error.message
    });
  }
});

// Check drug incompatibilities
router.post('/interactions/incompatibility', (req, res) => {
  try {
    const { drug1, drug2 } = req.body;
    
    if (!drug1 || !drug2) {
      return res.status(400).json({
        success: false,
        message: 'Both drug names are required'
      });
    }
    
    const result = DrugInformationService.checkIncompatibilities(drug1, drug2);
    res.json(result);
  } catch (error) {
    console.error('Error checking incompatibilities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check incompatibilities',
      error: error.message
    });
  }
});

// Comprehensive prescription analysis
router.post('/analyze', (req, res) => {
  try {
    const { medications, patientAllergies = [], patientConditions = [] } = req.body;
    
    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Medications list is required'
      });
    }
    
    const result = DrugInformationService.analyzePrescription(
      medications, 
      patientAllergies, 
      patientConditions
    );
    res.json(result);
  } catch (error) {
    console.error('Error analyzing prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze prescription',
      error: error.message
    });
  }
});

// ADR Reporting Routes

// Create new ADR report
router.post('/adr', (req, res) => {
  try {
    const adrData = req.body;
    
    // Validate required fields
    if (!adrData.patient || !adrData.suspectedDrug || !adrData.reaction || !adrData.reporter) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: patient, suspectedDrug, reaction, reporter'
      });
    }
    
    const adr = ADR.create(adrData);
    
    res.status(201).json({
      success: true,
      data: adr,
      message: 'ADR report created successfully'
    });
  } catch (error) {
    console.error('Error creating ADR report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create ADR report',
      error: error.message
    });
  }
});

// Get all ADR reports with filters
router.get('/adr', (req, res) => {
  try {
    const filters = req.query;
    const adrs = ADR.findAll(filters);
    
    res.json({
      success: true,
      data: adrs,
      count: adrs.length
    });
  } catch (error) {
    console.error('Error getting ADR reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ADR reports',
      error: error.message
    });
  }
});

// Get ADR report by ID
router.get('/adr/:id', (req, res) => {
  try {
    const { id } = req.params;
    const adr = ADR.findById(id);
    
    if (!adr) {
      return res.status(404).json({
        success: false,
        message: 'ADR report not found'
      });
    }
    
    res.json({
      success: true,
      data: adr
    });
  } catch (error) {
    console.error('Error getting ADR report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ADR report',
      error: error.message
    });
  }
});

// Update ADR status
router.patch('/adr/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    const validStatuses = ['submitted', 'under_review', 'reviewed', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }
    
    const adr = ADR.updateStatus(id, status, notes);
    
    if (!adr) {
      return res.status(404).json({
        success: false,
        message: 'ADR report not found'
      });
    }
    
    res.json({
      success: true,
      data: adr,
      message: 'ADR status updated successfully'
    });
  } catch (error) {
    console.error('Error updating ADR status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ADR status',
      error: error.message
    });
  }
});

// Get ADR statistics
router.get('/adr/stats/summary', (req, res) => {
  try {
    const stats = ADR.getStatistics();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting ADR statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ADR statistics',
      error: error.message
    });
  }
});

module.exports = router;