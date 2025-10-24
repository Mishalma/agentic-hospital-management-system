const express = require('express');
const router = express.Router();
const MockConsultation = require('../models/MockConsultation');
const formularyService = require('../services/formularyService');
const geminiService = require('../services/geminiService');

// Get all prescriptions with filters
router.get('/', async (req, res) => {
  try {
    const { patientId, doctorId, consultationId, status, page = 1, limit = 10 } = req.query;
    
    const filters = {};
    if (patientId) filters.patientId = patientId;
    if (doctorId) filters.doctorId = doctorId;
    if (consultationId) filters.consultationId = consultationId;
    if (status) filters.status = status;
    
    const prescriptions = await MockConsultation.findPrescriptions(filters);
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedResults = prescriptions.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedResults,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(prescriptions.length / limit),
        totalItems: prescriptions.length,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prescriptions',
      error: error.message
    });
  }
});

// Create new prescription
router.post('/', async (req, res) => {
  try {
    const prescriptionData = req.body;
    
    // Validate required fields
    if (!prescriptionData.consultationId || !prescriptionData.patientId || 
        !prescriptionData.doctorId || !prescriptionData.medications || 
        prescriptionData.medications.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: consultationId, patientId, doctorId, medications'
      });
    }
    
    // Validate each medication
    const validationErrors = [];
    const validatedMedications = [];
    
    for (let i = 0; i < prescriptionData.medications.length; i++) {
      const med = prescriptionData.medications[i];
      
      if (!med.genericName || !med.dosage || !med.frequency || !med.quantity) {
        validationErrors.push(`Medication ${i + 1}: Missing required fields`);
        continue;
      }
      
      // Validate against formulary
      const validation = formularyService.validatePrescription({
        ...med,
        patientAllergies: prescriptionData.allergies?.map(a => a.allergen) || []
      });
      
      if (!validation.valid) {
        validationErrors.push(`Medication ${i + 1} (${med.genericName}): ${validation.errors.join(', ')}`);
      } else {
        // Add formulary information
        validatedMedications.push({
          ...med,
          formularyInfo: validation.drugInfo,
          warnings: validation.warnings
        });
      }
    }
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Prescription validation failed',
        errors: validationErrors
      });
    }
    
    // Check drug interactions
    const drugNames = validatedMedications.map(med => med.genericName);
    const interactions = formularyService.checkDrugInteractions(drugNames);
    
    // Get AI analysis for complex cases
    let aiAnalysis = null;
    if (validatedMedications.length > 1) {
      const aiResponse = await geminiService.getDrugInteractions(validatedMedications);
      if (aiResponse.success) {
        aiAnalysis = aiResponse.interactions;
      }
    }
    
    // Create prescription with validation results
    const newPrescription = await MockConsultation.createPrescription({
      ...prescriptionData,
      medications: validatedMedications,
      drugInteractions: interactions.map(interaction => ({
        drug1: interaction.drug1,
        drug2: interaction.drug2,
        severity: interaction.severity,
        description: interaction.description,
        action: 'Monitor patient'
      })),
      aiAnalysis: {
        interactionCheck: {
          performed: true,
          results: aiAnalysis ? [aiAnalysis] : [],
          timestamp: new Date()
        }
      }
    });
    
    res.status(201).json({
      success: true,
      data: newPrescription,
      validationResults: {
        interactions: interactions.length,
        warnings: validatedMedications.reduce((acc, med) => acc + (med.warnings?.length || 0), 0)
      },
      message: 'Prescription created successfully'
    });
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create prescription',
      error: error.message
    });
  }
});

// Get prescription by ID
router.get('/:id', async (req, res) => {
  try {
    const prescriptions = await MockConsultation.findPrescriptions();
    const prescription = prescriptions.find(p => p.id === req.params.id);
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }
    
    res.json({
      success: true,
      data: prescription
    });
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prescription',
      error: error.message
    });
  }
});

// Update prescription status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['draft', 'sent', 'received', 'dispensed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: draft, sent, received, dispensed, completed, cancelled'
      });
    }
    
    // In a real implementation, you would update the prescription in the database
    // For now, we'll simulate the update
    const prescriptions = await MockConsultation.findPrescriptions();
    const prescriptionIndex = prescriptions.findIndex(p => p.id === req.params.id);
    
    if (prescriptionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }
    
    prescriptions[prescriptionIndex].status = status;
    
    // Add transmission info if being sent
    if (status === 'sent') {
      prescriptions[prescriptionIndex].transmissionInfo = {
        method: 'electronic',
        transmittedDate: new Date(),
        confirmationNumber: `CONF${Date.now()}`
      };
    }
    
    res.json({
      success: true,
      data: prescriptions[prescriptionIndex],
      message: `Prescription status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating prescription status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update prescription status',
      error: error.message
    });
  }
});

// Send prescription to pharmacy
router.post('/:id/send', async (req, res) => {
  try {
    const { pharmacyId, method = 'electronic', priority = 'routine' } = req.body;
    
    const prescriptions = await MockConsultation.findPrescriptions();
    const prescription = prescriptions.find(p => p.id === req.params.id);
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }
    
    if (prescription.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Prescription has already been sent'
      });
    }
    
    // Simulate sending to pharmacy with enhanced tracking
    prescription.status = 'sent';
    prescription.priority = priority;
    prescription.transmissionInfo = {
      method,
      transmittedDate: new Date(),
      confirmationNumber: `CONF${Date.now()}`,
      pharmacyConfirmation: {
        received: true,
        receivedDate: new Date(),
        pharmacistId: 'PHARM001',
        estimatedReadyTime: new Date(Date.now() + (priority === 'stat' ? 15 : priority === 'urgent' ? 30 : 60) * 60 * 1000)
      }
    };
    
    if (pharmacyId) {
      prescription.pharmacyInfo = {
        pharmacyId,
        pharmacyName: 'Central Pharmacy',
        pharmacyAddress: '123 Main St, City, State',
        pharmacyPhone: '(555) 123-4567'
      };
    }

    // Create transaction record for tracking
    const transactionData = {
      type: 'prescription_received',
      prescriptionId: prescription.id,
      status: 'pending',
      pharmacyId: pharmacyId || 'PHARM001',
      doctorId: prescription.doctorId,
      patientId: prescription.patientId,
      priority: priority,
      items: prescription.medications?.map(med => ({
        medicationId: `MED${Math.floor(Math.random() * 1000)}`,
        genericName: med.genericName,
        brandName: med.brandName,
        quantity: med.quantity,
        status: 'pending_verification'
      })) || [],
      timestamps: {
        received: new Date(),
        created: new Date()
      },
      audit: {
        createdBy: prescription.doctorId,
        receivedBy: 'PHARM001'
      }
    };

    // In a real implementation, this would create a transaction record
    console.log('E-prescription transaction created:', transactionData);
    
    res.json({
      success: true,
      data: prescription,
      transactionId: `TXN${Date.now()}`,
      message: 'Prescription sent to pharmacy successfully'
    });
  } catch (error) {
    console.error('Error sending prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send prescription',
      error: error.message
    });
  }
});

// Get prescription transmission status
router.get('/:id/status', async (req, res) => {
  try {
    const prescriptions = await MockConsultation.findPrescriptions();
    const prescription = prescriptions.find(p => p.id === req.params.id);
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }
    
    // Simulate real-time status updates
    const statusHistory = [
      {
        status: 'draft',
        timestamp: prescription.createdAt,
        description: 'Prescription created by doctor'
      }
    ];
    
    if (prescription.status !== 'draft') {
      statusHistory.push({
        status: 'sent',
        timestamp: prescription.transmissionInfo?.transmittedDate,
        description: 'Prescription transmitted to pharmacy'
      });
      
      statusHistory.push({
        status: 'received',
        timestamp: prescription.transmissionInfo?.pharmacyConfirmation?.receivedDate,
        description: 'Prescription received by pharmacy'
      });
      
      // Simulate processing status
      if (prescription.status === 'processing' || prescription.status === 'ready' || prescription.status === 'dispensed') {
        statusHistory.push({
          status: 'processing',
          timestamp: new Date(prescription.transmissionInfo?.pharmacyConfirmation?.receivedDate?.getTime() + 5 * 60 * 1000),
          description: 'Prescription being processed by pharmacist'
        });
      }
      
      if (prescription.status === 'ready' || prescription.status === 'dispensed') {
        statusHistory.push({
          status: 'ready',
          timestamp: prescription.transmissionInfo?.pharmacyConfirmation?.estimatedReadyTime,
          description: 'Prescription ready for pickup'
        });
      }
      
      if (prescription.status === 'dispensed') {
        statusHistory.push({
          status: 'dispensed',
          timestamp: new Date(),
          description: 'Prescription dispensed to patient'
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        prescriptionId: prescription.id,
        currentStatus: prescription.status,
        priority: prescription.priority,
        estimatedReadyTime: prescription.transmissionInfo?.pharmacyConfirmation?.estimatedReadyTime,
        pharmacyInfo: prescription.pharmacyInfo,
        statusHistory: statusHistory.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      }
    });
  } catch (error) {
    console.error('Error fetching prescription status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prescription status',
      error: error.message
    });
  }
});

// Get brand alternatives for a medication
router.get('/formulary/:genericName/brands', async (req, res) => {
  try {
    const brands = formularyService.getBrandOptions(req.params.genericName);
    
    if (brands.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No brand options found for this medication'
      });
    }
    
    res.json({
      success: true,
      data: {
        genericName: req.params.genericName,
        brands: brands
      }
    });
  } catch (error) {
    console.error('Error fetching brand alternatives:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch brand alternatives',
      error: error.message
    });
  }
});

// Get medication alternatives
router.get('/formulary/:genericName/alternatives', async (req, res) => {
  try {
    const { reason = 'general' } = req.query;
    const alternatives = formularyService.getAlternatives(req.params.genericName, reason);
    
    res.json({
      success: true,
      data: {
        originalMedication: req.params.genericName,
        alternatives: alternatives,
        reason: reason
      }
    });
  } catch (error) {
    console.error('Error fetching medication alternatives:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medication alternatives',
      error: error.message
    });
  }
});

// Validate prescription before sending
router.post('/:id/validate', async (req, res) => {
  try {
    const prescriptions = await MockConsultation.findPrescriptions();
    const prescription = prescriptions.find(p => p.id === req.params.id);
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }
    
    const validationResults = {
      valid: true,
      errors: [],
      warnings: [],
      medications: []
    };
    
    // Validate each medication
    for (const med of prescription.medications) {
      const validation = formularyService.validatePrescription({
        ...med,
        patientAllergies: prescription.allergies?.map(a => a.allergen) || []
      });
      
      validationResults.medications.push({
        medication: med.genericName,
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings
      });
      
      if (!validation.valid) {
        validationResults.valid = false;
        validationResults.errors.push(...validation.errors);
      }
      
      validationResults.warnings.push(...validation.warnings);
    }
    
    // Check drug interactions
    const drugNames = prescription.medications.map(med => med.genericName);
    const interactions = formularyService.checkDrugInteractions(drugNames);
    
    if (interactions.length > 0) {
      validationResults.warnings.push(`${interactions.length} potential drug interactions found`);
    }
    
    res.json({
      success: true,
      data: validationResults
    });
  } catch (error) {
    console.error('Error validating prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate prescription',
      error: error.message
    });
  }
});

module.exports = router;