const express = require("express");
const router = express.Router();
const EmergencyCase = require("../models/EmergencyCase");
const MockEmergencyCase = require("../models/MockEmergencyCase");
const emergencyService = require("../services/emergencyService");

// Get all emergency cases with filtering and pagination
router.get("/cases", async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 20, sortBy = "arrivalTime", sortOrder = "desc" } = req.query;

    let query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const mockEmergencyCases = new MockEmergencyCase();
    const cases = await mockEmergencyCases.find(query);

    // Simple sorting and pagination
    cases.sort((a, b) => {
      const aValue = new Date(a[sortBy]);
      const bValue = new Date(b[sortBy]);
      return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
    });

    const startIndex = (page - 1) * limit;
    const paginatedCases = cases.slice(startIndex, startIndex + limit);
    const total = cases.length;

    res.json({
      cases: paginatedCases,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get emergency case by ID
router.get("/cases/:id", async (req, res) => {
  try {
    const mockEmergencyCases = new MockEmergencyCase();
    const case_ = await mockEmergencyCases.findById(req.params.id);

    if (!case_) {
      return res.status(404).json({ error: "Emergency case not found" });
    }

    res.json({
      case: case_,
      deteriorationPrediction: null, // Mock - would be calculated in real implementation
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new emergency case
router.post("/cases", async (req, res) => {
  try {
    const { patientId, chiefComplaint, symptoms, vitals, preHospitalData, arrivalMode } = req.body;

    // Mock triage assessment
    const priority =
      vitals?.painScale > 7 || vitals?.oxygenSaturation < 90
        ? "High"
        : vitals?.heartRate > 120 || vitals?.temperature > 101
        ? "Medium"
        : "Low";

    const triageScore = priority === "High" ? 8 : priority === "Medium" ? 5 : 3;

    const mockEmergencyCases = new MockEmergencyCase();
    const newCase = await mockEmergencyCases.create({
      patientId,
      patientInfo: {
        name: "New Patient",
        age: 35,
        gender: "Unknown",
        phone: "",
        emergencyContact: { name: "", relationship: "", phone: "" },
      },
      arrivalTime: new Date(),
      arrivalMode: arrivalMode || "Walk-in",
      chiefComplaint,
      symptoms,
      vitals,
      triageScore,
      priority,
      status: "active",
      assignedStaff: [],
      vitalsHistory: [{ ...vitals, timestamp: new Date() }],
      treatmentOrders: [],
      preHospitalData,
      aiInsights: {
        deteriorationRisk: "Low",
        recommendedAction: "Standard assessment",
        predictedOutcome: "Stable",
      },
    });

    res.status(201).json({
      case: newCase,
      triageAssessment: {
        score: triageScore,
        priority,
        riskFactors: [],
        recommendedAction: "Standard ER protocol",
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update emergency case
router.put("/cases/:id", async (req, res) => {
  try {
    const updates = req.body;
    const case_ = await EmergencyCase.findById(req.params.id);

    if (!case_) {
      return res.status(404).json({ error: "Emergency case not found" });
    }

    // If vitals are being updated, add to history and recalculate triage
    if (updates.vitals) {
      case_.vitalsHistory.push({
        ...updates.vitals,
        timestamp: new Date(),
      });

      // Recalculate triage score with new vitals
      const demographics = { age: 30 }; // Should come from patient data
      const triageAssessment = emergencyService.calculateTriageScore(updates.vitals, case_.symptoms, demographics);

      case_.triageScore = triageAssessment.score;
      case_.priority = triageAssessment.priority;
      case_.riskFactors = triageAssessment.riskFactors;
      case_.recommendedAction = triageAssessment.recommendedAction;
    }

    // Update other fields
    Object.keys(updates).forEach((key) => {
      if (key !== "vitals") {
        case_[key] = updates[key];
      }
    });

    case_.lastUpdated = new Date();
    await case_.save();
    await case_.populate("patientId", "name age gender");

    res.json({ case: case_ });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get priority queue
router.get("/queue", async (req, res) => {
  try {
    const mockEmergencyCases = new MockEmergencyCase();
    const queue = mockEmergencyCases.getPriorityQueue();
    res.json(queue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign staff to case
router.post("/cases/:id/assign", async (req, res) => {
  try {
    const { staffId, role } = req.body;
    const case_ = await EmergencyCase.findById(req.params.id);

    if (!case_) {
      return res.status(404).json({ error: "Emergency case not found" });
    }

    case_.assignedStaff.push({ staffId, role, assignedAt: new Date() });

    if (!case_.treatmentStartTime) {
      case_.treatmentStartTime = new Date();
    }

    await case_.save();
    await case_.populate("assignedStaff.staffId", "name role");

    res.json({ case: case_ });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add treatment order
router.post("/cases/:id/orders", async (req, res) => {
  try {
    const { type, description, urgency, orderedBy } = req.body;
    const case_ = await EmergencyCase.findById(req.params.id);

    if (!case_) {
      return res.status(404).json({ error: "Emergency case not found" });
    }

    const order = {
      type,
      description,
      urgency,
      orderedBy,
      orderedAt: new Date(),
      status: "pending",
    };

    case_.treatmentOrders.push(order);
    await case_.save();

    res.json({ case: case_, order });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update treatment order status
router.put("/cases/:caseId/orders/:orderId", async (req, res) => {
  try {
    const { status, completedBy, notes } = req.body;
    const case_ = await EmergencyCase.findById(req.params.caseId);

    if (!case_) {
      return res.status(404).json({ error: "Emergency case not found" });
    }

    const order = case_.treatmentOrders.id(req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: "Treatment order not found" });
    }

    order.status = status;
    if (completedBy) order.completedBy = completedBy;
    if (notes) order.notes = notes;
    if (status === "completed") order.completedAt = new Date();

    await case_.save();
    res.json({ case: case_, order });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get dashboard statistics
router.get("/dashboard/stats", async (req, res) => {
  try {
    const mockEmergencyCases = new MockEmergencyCase();
    const stats = mockEmergencyCases.getDashboardStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get quality metrics
router.get("/metrics/quality", async (req, res) => {
  try {
    const { timeframe = 24 } = req.query;
    const allCases = await EmergencyCase.find({});

    const metrics = emergencyService.calculateQualityMetrics(allCases, timeframe);

    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get MLC cases
router.get("/mlc-cases", async (req, res) => {
  try {
    const mockEmergencyCases = new MockEmergencyCase();
    const allCases = await mockEmergencyCases.find({});
    const mlcCases = allCases.filter((case_) => case_.mlcData?.isMLC);

    const stats = {
      total: mlcCases.length,
      active: mlcCases.filter((c) => c.status === "active").length,
      completed: mlcCases.filter((c) => c.status === "completed").length,
      pending: mlcCases.filter((c) => c.status === "pending" || !c.status).length,
    };

    res.json({
      cases: mlcCases,
      stats,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create MLC case
router.post("/mlc-cases", async (req, res) => {
  try {
    const { patientId, chiefComplaint, injuryType, evidence, firNumber, policeStation, forensicOpinion } = req.body;

    const mockEmergencyCases = new MockEmergencyCase();
    const newCase = await mockEmergencyCases.create({
      patientId,
      patientInfo: {
        name: "MLC Patient",
        age: 35,
        gender: "Unknown",
        phone: "",
        emergencyContact: { name: "", relationship: "", phone: "" },
      },
      arrivalTime: new Date(),
      arrivalMode: "Emergency Services",
      chiefComplaint,
      symptoms: [injuryType],
      vitals: {},
      triageScore: 10,
      priority: "Critical",
      status: "active",
      assignedStaff: [],
      vitalsHistory: [],
      treatmentOrders: [],
      mlcData: {
        isMLC: true,
        injuryType,
        evidence: evidence ? evidence.split(",").map((e) => e.trim()) : [],
        firData: firNumber
          ? {
              firNumber,
              policeStation: policeStation || "Local Police Station",
              reportedAt: new Date(),
            }
          : null,
        forensicOpinion: forensicOpinion || "Pending forensic evaluation",
        authorityNotifications: ["Police notified", "Medical officer informed"],
        digitalSignature: "System Generated",
        auditLog: [`MLC case registered - ${new Date().toISOString()}`],
      },
      aiInsights: {
        deteriorationRisk: "High",
        recommendedAction: "Immediate legal documentation and authority notification",
        predictedOutcome: "Legal case management required",
      },
    });

    res.status(201).json({
      case: newCase,
      message: "MLC case created successfully",
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Discharge patient
router.post("/cases/:id/discharge", async (req, res) => {
  try {
    const { disposition, dischargeNotes, followUpInstructions } = req.body;
    const case_ = await EmergencyCase.findById(req.params.id);

    if (!case_) {
      return res.status(404).json({ error: "Emergency case not found" });
    }

    case_.status = "completed";
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
