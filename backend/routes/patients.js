const express = require("express");
const Joi = require("joi");
const Patient = require("../models/Patient");
const router = express.Router();

// Validation schemas
const newPatientSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  dob: Joi.date().required().max("now"),
  phone: Joi.string()
    .required()
    .pattern(/^\+?[\d\s\-\(\)]{10,15}$/),
  email: Joi.string().email().optional(),
  insurance: Joi.object({
    provider: Joi.string().required(),
    policyNumber: Joi.string().required(),
    groupNumber: Joi.string().optional(),
  }).optional(),
  emergencyContact: Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().required(),
    relationship: Joi.string().required(),
  }).optional(),
});

const existingPatientSchema = Joi.object({
  uniqueId: Joi.string()
    .required()
    .pattern(/^PT\d{10}$/),
});

// Register new patient
router.post("/register", async (req, res) => {
  try {
    const { error, value } = newPatientSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((d) => d.message),
      });
    }

    // Check if patient already exists by phone
    const existingPatient = await Patient.findByPhone(value.phone);
    if (existingPatient) {
      return res.status(409).json({
        success: false,
        message: "Patient already exists with this phone number",
        patient: existingPatient.toPublic(),
      });
    }

    const patient = await Patient.create(value);

    // Send welcome SMS to new patient
    try {
      const smsService = require("../services/smsService");
      await smsService.sendWelcomeMessage(patient);
    } catch (smsError) {
      console.error("Welcome SMS error:", smsError);
      // Don't fail registration if SMS fails
    }

    res.status(201).json({
      success: true,
      message: "Patient registered successfully",
      patient: patient.toPublic(),
    });
  } catch (error) {
    console.error("Patient registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Find existing patient
router.post("/find", async (req, res) => {
  try {
    const { error, value } = existingPatientSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID format",
      });
    }

    const patient = await Patient.findByUniqueId(value.uniqueId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.json({
      success: true,
      patient: patient.toPublic(),
    });
  } catch (error) {
    console.error("Patient lookup error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get patient details (for admin)
router.get("/:id", async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.json({
      success: true,
      patient: patient.toObject(),
    });
  } catch (error) {
    console.error("Patient fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get patient basic info for frontend display
router.get("/:patientId/basic", async (req, res) => {
  try {
    console.log(`[PATIENT BASIC] Looking for patient with uniqueId: ${req.params.patientId}`);

    const patient = await Patient.findOne({ uniqueId: req.params.patientId });

    console.log(`[PATIENT BASIC] MongoDB result:`, patient ? `Found ${patient.name}` : "Not found");

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.json({
      success: true,
      name: patient.name,
    });
  } catch (error) {
    console.error("Error fetching patient basic info:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient info",
    });
  }
});

// Get patient history (consultations, vitals, prescriptions, triage)
router.get("/:patientId/history", async (req, res) => {
  console.log(`[PATIENT HISTORY] Fetching history for patientId: ${req.params.patientId}`);

  try {
    const { patientId } = req.params;

    // Get recent consultations (last 5)
    console.log(`[PATIENT HISTORY] Fetching consultations for patientId: ${patientId}`);
    const Consultation = require("../models/Consultation");
    const consultations = await Consultation.find({ patientId }).sort({ consultationDate: -1 }).limit(5);
    console.log(`[PATIENT HISTORY] Found ${consultations.length} consultations`);

    // Get recent vitals (last 10)
    console.log(`[PATIENT HISTORY] Fetching vitals for patientId: ${patientId}`);
    const Vitals = require("../models/Vitals");
    const vitals = await Vitals.find({ patientId }).sort({ createdAt: -1 }).limit(10);
    console.log(`[PATIENT HISTORY] Found ${vitals.length} vitals records`);

    // Get recent triage records (last 5)
    console.log(`[PATIENT HISTORY] Fetching triage records for patientId: ${patientId}`);
    const Triage = require("../models/Triage");
    const triageRecords = await Triage.find({ patientId }).sort({ createdAt: -1 }).limit(5);
    console.log(`[PATIENT HISTORY] Found ${triageRecords.length} triage records`);

    // Get prescriptions
    console.log(`[PATIENT HISTORY] Fetching prescriptions for patientId: ${patientId}`);
    const Prescription = require("../models/Prescription");
    const prescriptions = await Prescription.find({
      patientId,
      status: { $in: ["active", "pending"] },
    }).sort({ createdAt: -1 });
    console.log(`[PATIENT HISTORY] Found ${prescriptions.length} prescriptions`);

    // Get patient basic info
    console.log(`[PATIENT HISTORY] Fetching patient info for uniqueId: ${patientId}`);
    const patient = await Patient.findOne({ uniqueId: patientId });
    if (!patient) {
      console.log(`[PATIENT HISTORY] Patient not found with uniqueId: ${patientId}`);
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }
    console.log(`[PATIENT HISTORY] Found patient: ${patient.name} (${patient.uniqueId})`);

    const responseData = {
      success: true,
      data: {
        patient: patient.toPublic(),
        recentConsultations: consultations,
        recentVitals: vitals,
        recentTriage: triageRecords,
        currentMedications: prescriptions.flatMap((p) => p.medications || []),
        activePrescriptions: prescriptions.length,
        medicalHistory: patient.medicalHistory || [],
      },
    };

    console.log(`[PATIENT HISTORY] Sending response with:`, {
      consultations: consultations.length,
      vitals: vitals.length,
      triage: triageRecords.length,
      prescriptions: prescriptions.length,
      medicalHistory: (patient.medicalHistory || []).length,
    });

    res.json(responseData);
  } catch (error) {
    console.error("[PATIENT HISTORY] Error:", error);
    console.error("[PATIENT HISTORY] Stack trace:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient history",
      error: error.message,
    });
  }
});

// Search patients by name (Admin only - no auth check here, handled by frontend)
router.get("/search", async (req, res) => {
  try {
    const { name, limit = 20 } = req.query;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters long",
      });
    }

    const patients = await Patient.searchByName(name.trim(), parseInt(limit));

    res.json({
      success: true,
      count: patients.length,
      patients: patients.map((patient) => ({
        id: patient._id,
        name: patient.name,
        uniqueId: patient.uniqueId,
        phone: patient.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2"), // Mask phone
        email: patient.email ? patient.email.replace(/(.{2})(.*)(@.*)/, "$1***$3") : null, // Mask email
        createdAt: patient.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error searching patients by name:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search patients",
      error: error.message,
    });
  }
});

// Debug endpoint to list all patients (for testing)
router.get("/debug/list", async (req, res) => {
  try {
    console.log("[PATIENT DEBUG] Listing all patients...");

    // Force initialization if using MockPatient
    if (typeof Patient.findByUniqueId === "function") {
      // Try to trigger initialization by calling findByUniqueId
      await Patient.findByUniqueId("dummy");
    }

    // Get all patients
    let patients = [];
    if (typeof Patient.find === "function") {
      patients = await Patient.find({});
    } else if (Patient.storage) {
      patients = Array.from(Patient.storage.values());
    }

    console.log(`[PATIENT DEBUG] Found ${patients.length} patients`);

    res.json({
      success: true,
      count: patients.length,
      patients: patients.map((p) => ({
        id: p.id || p._id,
        uniqueId: p.uniqueId,
        name: p.name,
        phone: p.phone,
      })),
    });
  } catch (error) {
    console.error("Error in debug list:", error);
    res.status(500).json({
      success: false,
      message: "Debug list failed",
      error: error.message,
    });
  }
});

// Update patient information
router.put("/:id", async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const allowedUpdates = ["name", "phone", "email", "insurance", "emergencyContact"];
    const updates = {};

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    await patient.update(updates);

    res.json({
      success: true,
      message: "Patient updated successfully",
      patient: patient.toPublic(),
    });
  } catch (error) {
    console.error("Patient update error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Medical History Management
router.get("/:patientId/medical-history", async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.json({
      success: true,
      medicalHistory: patient.medicalHistory || [],
    });
  } catch (error) {
    console.error("Error fetching medical history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch medical history",
    });
  }
});

router.post("/:patientId/medical-history", async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const newHistory = {
      condition: req.body.condition,
      diagnosedDate: req.body.diagnosedDate,
      status: req.body.status || "active",
      notes: req.body.notes,
    };

    patient.medicalHistory.push(newHistory);
    await patient.save();

    res.status(201).json({
      success: true,
      message: "Medical history added successfully",
      medicalHistory: patient.medicalHistory,
    });
  } catch (error) {
    console.error("Error adding medical history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add medical history",
    });
  }
});

router.put("/:patientId/medical-history/:index", async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const index = parseInt(req.params.index);
    if (index < 0 || index >= patient.medicalHistory.length) {
      return res.status(404).json({
        success: false,
        message: "Medical history entry not found",
      });
    }

    patient.medicalHistory[index] = {
      ...patient.medicalHistory[index],
      condition: req.body.condition || patient.medicalHistory[index].condition,
      diagnosedDate: req.body.diagnosedDate || patient.medicalHistory[index].diagnosedDate,
      status: req.body.status || patient.medicalHistory[index].status,
      notes: req.body.notes || patient.medicalHistory[index].notes,
    };

    await patient.save();

    res.json({
      success: true,
      message: "Medical history updated successfully",
      medicalHistory: patient.medicalHistory,
    });
  } catch (error) {
    console.error("Error updating medical history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update medical history",
    });
  }
});

router.delete("/:patientId/medical-history/:index", async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const index = parseInt(req.params.index);
    if (index < 0 || index >= patient.medicalHistory.length) {
      return res.status(404).json({
        success: false,
        message: "Medical history entry not found",
      });
    }

    patient.medicalHistory.splice(index, 1);
    await patient.save();

    res.json({
      success: true,
      message: "Medical history entry deleted successfully",
      medicalHistory: patient.medicalHistory,
    });
  } catch (error) {
    console.error("Error deleting medical history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete medical history",
    });
  }
});

module.exports = router;
module.exports = router;
