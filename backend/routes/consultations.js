const express = require("express");
const router = express.Router();
const MockConsultation = require("../models/MockConsultation");
const geminiService = require("../services/geminiService");
const formularyService = require("../services/formularyService");

// Get all consultations with filters
router.get("/", async (req, res) => {
  try {
    const { patientId, doctorId, status, dateFrom, dateTo, page = 1, limit = 10 } = req.query;

    const filters = {};
    if (patientId) filters.patientId = patientId;
    if (doctorId) filters.doctorId = doctorId;
    if (status) filters.status = status;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;

    const consultations = await MockConsultation.findAll(filters);

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedResults = consultations.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedResults,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(consultations.length / limit),
        totalItems: consultations.length,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching consultations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch consultations",
      error: error.message,
    });
  }
});

// Get consultation by ID
router.get("/:id", async (req, res) => {
  try {
    const consultation = await MockConsultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found",
      });
    }

    res.json({
      success: true,
      data: consultation,
    });
  } catch (error) {
    console.error("Error fetching consultation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch consultation",
      error: error.message,
    });
  }
});

// Create new consultation
router.post("/", async (req, res) => {
  try {
    const consultationData = req.body;

    // Validate required fields
    if (!consultationData.patientId || !consultationData.doctorId || !consultationData.chiefComplaint) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: patientId, doctorId, chiefComplaint",
      });
    }

    const newConsultation = await MockConsultation.create(consultationData);

    // Add consultation entry to patient's medical history
    try {
      const Patient = require("../models/Patient");
      let patient = null;

      // Try to find patient using uniqueId (consultationData.patientId)
      try {
        patient = await Patient.findByUniqueId(consultationData.patientId);
      } catch (error) {
        try {
          patient = await Patient.findOne({ uniqueId: consultationData.patientId });
        } catch (altError) {
          console.log("Could not find patient for medical history update:", consultationData.patientId);
        }
      }

      if (patient) {
        // Create medical history entry for this consultation
        const medicalHistoryEntry = {
          condition: consultationData.chiefComplaint || "Medical Consultation",
          diagnosedDate: new Date(),
          status: "active",
          notes: `Consultation on ${new Date().toLocaleDateString()} - ${
            consultationData.symptoms?.map((s) => s.symptom).join(", ") || "General checkup"
          }. Diagnosis: ${
            consultationData.assessment?.primaryDiagnosis || consultationData.diagnosis || "Pending"
          }. Treatment: ${consultationData.treatment || consultationData.assessment?.treatmentPlan || "As advised"}.`,
        };

        if (patient.medicalHistory) {
          patient.medicalHistory.push(medicalHistoryEntry);
        } else {
          patient.medicalHistory = [medicalHistoryEntry];
        }

        await patient.save();
        console.log("Added consultation to patient medical history:", consultationData.patientId);
      }
    } catch (historyError) {
      console.error("Error updating patient medical history:", historyError);
      // Don't fail the consultation creation if medical history update fails
    }

    res.status(201).json({
      success: true,
      data: newConsultation,
      message: "Consultation created successfully",
    });
  } catch (error) {
    console.error("Error creating consultation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create consultation",
      error: error.message,
    });
  }
});

// Update consultation
router.put("/:id", async (req, res) => {
  try {
    const updatedConsultation = await MockConsultation.update(req.params.id, req.body);

    if (!updatedConsultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found",
      });
    }

    res.json({
      success: true,
      data: updatedConsultation,
      message: "Consultation updated successfully",
    });
  } catch (error) {
    console.error("Error updating consultation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update consultation",
      error: error.message,
    });
  }
});
// POST /api/consultations/:id?/ai-suggestions
router.post("/:id?/ai-suggestions", async (req, res) => {
  try {
    const consultationId = req.params.id || "temp";
    let consultation = null;

    // Handle saved consultations
    if (consultationId !== "temp") {
      consultation = await MockConsultation.findById(consultationId);
      if (!consultation) {
        return res.status(404).json({ success: false, message: "Consultation not found" });
      }
    }

    // Build AI input data
    const consultationData = consultation
      ? {
          symptoms: consultation.symptoms
            ?.map((s) => `${s.symptom} (severity: ${s.severity}/10, duration: ${s.duration})`)
            .join(", "),
          vitals: consultation.vitals,
          patientHistory: consultation.pastMedicalHistory,
          chiefComplaint: consultation.chiefComplaint,
          age: consultation.patientAge || "Not specified",
          gender: consultation.patientGender || "Not specified",
        }
      : {
          symptoms: req.body.symptoms || [],
          vitals: req.body.vitals || {},
          patientHistory: req.body.patientHistory || "",
          chiefComplaint: req.body.chiefComplaint || req.body.message || "",
          age: req.body.age || "Not specified",
          gender: req.body.gender || "Not specified",
        };

    // Call Gemini AI service
    const aiResponse = await geminiService.getDoctorSuggestions(consultationData);

    // Update saved consultation if exists
    if (consultation && aiResponse.success) {
      const updateData = {
        aiSuggestions: {
          requested: true,
          response: {
            ...aiResponse.suggestions,
            timestamp: new Date(),
          },
        },
      };
      await MockConsultation.update(consultationId, updateData);
    }

    res.json({
      success: aiResponse.success,
      data: aiResponse.suggestions,
      message: aiResponse.message || "AI suggestions generated successfully",
      rawResponse: aiResponse.rawResponse,
    });
  } catch (error) {
    console.error("Error getting AI suggestions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get AI suggestions",
      error: error.message,
    });
  }
});

// Get drug interaction analysis
router.post("/:id/drug-interactions", async (req, res) => {
  try {
    const consultation = await MockConsultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found",
      });
    }

    const { newMedications = [] } = req.body;
    const currentMedications = consultation.medications || [];
    const allMedications = [...currentMedications, ...newMedications];

    // Check interactions using formulary service
    const formularyInteractions = formularyService.checkDrugInteractions(
      allMedications.map((med) => med.name || med.genericName)
    );

    // Get AI analysis for complex interactions
    const aiInteractions = await geminiService.getDrugInteractions(allMedications);

    res.json({
      success: true,
      data: {
        formularyInteractions,
        aiAnalysis: aiInteractions.success ? aiInteractions.interactions : null,
        totalMedications: allMedications.length,
        interactionCount: formularyInteractions.length,
      },
    });
  } catch (error) {
    console.error("Error analyzing drug interactions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to analyze drug interactions",
      error: error.message,
    });
  }
});

// Get prescription suggestions
router.post("/:id/prescription-suggestions", async (req, res) => {
  try {
    const consultation = await MockConsultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found",
      });
    }

    const { diagnosis } = req.body;
    const patientInfo = {
      age: consultation.patientAge,
      gender: consultation.patientGender,
      allergies: consultation.allergies?.map((a) => a.allergen) || [],
      currentMedications: consultation.medications?.map((m) => m.name) || [],
    };

    const aiSuggestions = await geminiService.getPrescriptionSuggestions(
      diagnosis || consultation.assessment?.primaryDiagnosis,
      patientInfo
    );

    res.json({
      success: aiSuggestions.success,
      data: aiSuggestions.suggestions,
      message: aiSuggestions.message || "Prescription suggestions generated successfully",
    });
  } catch (error) {
    console.error("Error getting prescription suggestions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get prescription suggestions",
      error: error.message,
    });
  }
});

// Get consultation statistics
router.get("/stats/:doctorId", async (req, res) => {
  try {
    const stats = await MockConsultation.getConsultationStats(req.params.doctorId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching consultation stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch consultation statistics",
      error: error.message,
    });
  }
});

// Search formulary
router.get("/formulary/search", async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const results = formularyService.searchFormulary(query);

    res.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error("Error searching formulary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search formulary",
      error: error.message,
    });
  }
});

// Get drug information
router.get("/formulary/drug/:genericName", async (req, res) => {
  try {
    const drugInfo = formularyService.getDrugInfo(req.params.genericName);

    if (!drugInfo) {
      return res.status(404).json({
        success: false,
        message: "Drug not found in formulary",
      });
    }

    res.json({
      success: true,
      data: drugInfo,
    });
  } catch (error) {
    console.error("Error fetching drug info:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch drug information",
      error: error.message,
    });
  }
});

// AI Chat endpoint for doctors
router.post("/ai-chat", async (req, res) => {
  try {
    const { message, context, doctorId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // Create a medical-focused prompt for the AI
    const medicalPrompt = `You are an AI medical assistant helping Dr. ${doctorId || "Doctor"} with clinical questions. 
    
Context: ${context || "general medical consultation"}
Doctor's Question: ${message}

Please provide a helpful, accurate, and professional medical response. Include:
- Evidence-based information when applicable
- Clinical considerations
- Safety warnings if relevant
- Suggestions for further evaluation when appropriate

Remember: This is for clinical decision support only. All medical decisions should be made by the attending physician.

Response:`;

    const aiResponse = await geminiService.getDoctorSuggestions({
      chiefComplaint: message,
      symptoms: [],
      vitals: {},
      patientHistory: context || "Medical consultation chat",
      age: "Adult",
      gender: "Not specified",
    });

    if (aiResponse.success) {
      // Format the AI response for chat
      let chatResponse = "";

      if (aiResponse.suggestions.differentialDiagnosis) {
        chatResponse += "🔍 **Clinical Considerations:**\n";
        if (Array.isArray(aiResponse.suggestions.differentialDiagnosis)) {
          aiResponse.suggestions.differentialDiagnosis.forEach((dx, index) => {
            chatResponse += `${index + 1}. ${dx.diagnosis || dx}\n`;
          });
        } else {
          chatResponse += aiResponse.suggestions.differentialDiagnosis + "\n";
        }
        chatResponse += "\n";
      }

      if (aiResponse.suggestions.treatment) {
        chatResponse += "💊 **Treatment Approach:**\n";
        if (typeof aiResponse.suggestions.treatment === "object") {
          if (aiResponse.suggestions.treatment.immediate) {
            chatResponse += `• Immediate: ${aiResponse.suggestions.treatment.immediate}\n`;
          }
          if (aiResponse.suggestions.treatment.medications) {
            chatResponse += `• Medications: ${aiResponse.suggestions.treatment.medications}\n`;
          }
        } else {
          chatResponse += aiResponse.suggestions.treatment + "\n";
        }
        chatResponse += "\n";
      }

      if (aiResponse.suggestions.investigations) {
        chatResponse += "🧪 **Recommended Studies:**\n";
        if (Array.isArray(aiResponse.suggestions.investigations)) {
          aiResponse.suggestions.investigations.forEach((test, index) => {
            chatResponse += `• ${test.test || test}\n`;
          });
        } else {
          chatResponse += aiResponse.suggestions.investigations + "\n";
        }
        chatResponse += "\n";
      }

      if (aiResponse.suggestions.redFlags) {
        chatResponse += "⚠️ **Red Flags:**\n";
        if (Array.isArray(aiResponse.suggestions.redFlags)) {
          aiResponse.suggestions.redFlags.forEach((flag) => {
            chatResponse += `• ${flag}\n`;
          });
        } else {
          chatResponse += aiResponse.suggestions.redFlags + "\n";
        }
      }

      res.json({
        success: true,
        response:
          chatResponse ||
          "I understand your question. Could you provide more specific details about the clinical scenario?",
        confidence: aiResponse.suggestions.confidence || 75,
        sources: ["Clinical guidelines", "Medical literature", "Evidence-based protocols"],
      });
    } else {
      // Provide intelligent fallback based on message content
      const fallbackResponse = generateChatFallback(message);

      res.json({
        success: true,
        response: fallbackResponse,
        confidence: 60,
        isFallback: true,
      });
    }
  } catch (error) {
    console.error("Error in AI chat:", error);

    // Generate fallback response
    const fallbackResponse = generateChatFallback(req.body.message || "");

    res.json({
      success: true,
      response: fallbackResponse,
      confidence: 50,
      isFallback: true,
    });
  }
});

function generateChatFallback(message) {
  const msg = message.toLowerCase();

  if (msg.includes("drug") || msg.includes("medication") || msg.includes("interaction")) {
    return `🔍 **Drug Information & Interactions:**

For medication queries, I recommend:
• **Check drug interactions** using Lexicomp or Micromedex
• **Verify dosing** based on patient's age, weight, and organ function
• **Review contraindications** and patient allergies
• **Consider therapeutic alternatives** if needed

**Key Safety Points:**
• Always check renal/hepatic dosing adjustments
• Monitor for drug-drug interactions
• Verify pregnancy/lactation safety
• Consider patient's medication adherence

Would you like me to help with a specific medication question?`;
  }

  if (msg.includes("diagnosis") || msg.includes("differential") || msg.includes("symptom")) {
    return `🎯 **Diagnostic Approach:**

**Clinical Assessment Framework:**
1. **History Taking**
   • Chief complaint and HPI
   • Past medical/surgical history
   • Medications and allergies
   • Social and family history

2. **Physical Examination**
   • Vital signs and general appearance
   • System-specific examination
   • Red flag symptoms

3. **Diagnostic Testing**
   • Laboratory studies as indicated
   • Imaging when appropriate
   • Specialist consultation if needed

**Evidence-Based Tools:**
• Clinical decision rules
• Risk stratification scores
• Diagnostic algorithms

What specific clinical scenario would you like to discuss?`;
  }

  if (msg.includes("treatment") || msg.includes("therapy") || msg.includes("management")) {
    return `💊 **Treatment & Management:**

**Treatment Planning:**
• **Evidence-based guidelines** - Follow established protocols
• **Patient-centered care** - Consider individual factors
• **Risk-benefit analysis** - Weigh treatment options
• **Monitoring plan** - Follow-up and assessment

**Key Considerations:**
• Patient comorbidities and contraindications
• Drug allergies and interactions
• Cost-effectiveness and accessibility
• Patient preferences and adherence

**Follow-up Strategy:**
• Response to treatment monitoring
• Adverse effect surveillance
• Dose adjustments as needed
• Long-term management planning

What specific treatment question can I help with?`;
  }

  return `👨‍⚕️ **Medical AI Assistant Ready**

I'm here to help with your clinical questions! I can assist with:

🔍 **Clinical Decision Support:**
• Differential diagnosis considerations
• Treatment protocol guidance
• Drug interaction checking
• Dosage calculations

📚 **Medical Knowledge:**
• Evidence-based guidelines
• Clinical best practices
• Risk assessment tools
• Diagnostic approaches

🩺 **Patient Care:**
• Management strategies
• Follow-up planning
• Monitoring recommendations
• Safety considerations

Please feel free to ask me about any specific medical topic or clinical scenario you're working on.`;
}

// Test Gemini connection endpoint
router.get("/test-gemini", async (req, res) => {
  try {
    console.log("🧪 Testing Gemini connection via API endpoint...");

    const geminiConfig = require("../config/gemini");

    // Basic availability check
    if (!geminiConfig.isAvailable()) {
      return res.json({
        success: false,
        message: "Gemini AI not initialized",
        details: {
          apiKeyPresent: !!process.env.GEMINI_API_KEY,
          apiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
          modelInitialized: false,
        },
      });
    }

    // Connection test
    const connectionTest = await geminiConfig.testConnection();

    res.json({
      success: connectionTest.success,
      message: connectionTest.message,
      details: {
        apiKeyPresent: !!process.env.GEMINI_API_KEY,
        apiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
        modelInitialized: true,
        response: connectionTest.response,
      },
    });
  } catch (error) {
    console.error("❌ Gemini test endpoint error:", error);
    res.json({
      success: false,
      message: error.message,
      details: {
        apiKeyPresent: !!process.env.GEMINI_API_KEY,
        apiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
        error: error.message,
      },
    });
  }
});

module.exports = router;
