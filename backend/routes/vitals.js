const express = require("express");
const router = express.Router();
const { Vitals, Patient } = require("../models");

// Record new vitals
router.post("/", async (req, res) => {
  console.log("[VITALS RECORD] Starting vitals recording");
  console.log("[VITALS RECORD] Request body:", JSON.stringify(req.body, null, 2));

  try {
    const { patientId, nurseId, vitals, notes, deviceInfo } = req.body;

    // Validate required fields
    if (!patientId || !nurseId || !vitals) {
      console.log("[VITALS RECORD] Validation failed - missing required fields");
      return res.status(400).json({
        success: false,
        message: "Patient ID, Nurse ID, and vitals data are required",
      });
    }

    console.log(`[VITALS RECORD] Validating patient exists for patientId: ${patientId}`);

    // Verify patient exists and get patient object for reference
    let patient = null;
    let vitalsData = {};

    try {
      console.log(`[VITALS RECORD] Using MongoDB Patient.findOne for uniqueId: ${patientId}`);
      patient = await Patient.findOne({ uniqueId: patientId });
      console.log(
        `[VITALS RECORD] MongoDB patient lookup result:`,
        patient ? `Found ${patient.name} (${patient.uniqueId})` : "Not found"
      );

      // Add additional debugging
      if (patient) {
        console.log(`[VITALS RECORD] Patient details:`, {
          id: patient.id || patient._id,
          uniqueId: patient.uniqueId,
          name: patient.name,
        });
      }
    } catch (error) {
      console.log(`[VITALS RECORD] Error during patient lookup:`, error.message);
    }

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    console.log("[VITALS RECORD] Creating vitals record with MongoDB patient reference");
    vitalsData = {
      patient: patient._id,
      nurseId,
      vitals,
      notes: notes || "",
      deviceInfo: deviceInfo || {},
    };

    console.log(
      "[VITALS RECORD] Attempting to save vitals with method:",
      Vitals.create ? "create()" : "new Vitals().save()"
    );

    // Log vitals data being saved
    console.log("[VITALS RECORD] Saving vitals data:", {
      patientId,
      nurseId,
      vitals: JSON.stringify(vitals, null, 2),
      notes: notes || "No notes",
      deviceInfo: deviceInfo || "No device info",
      timestamp: new Date().toISOString(),
    });

    const newVitals = await Vitals.create(vitalsData);

    console.log("[VITALS RECORD] Vitals saved successfully, ID:", newVitals._id || newVitals.id);
    console.log(
      "[VITALS RECORD] Full saved vitals record:",
      JSON.stringify(newVitals.toPublic ? newVitals.toPublic() : newVitals, null, 2)
    );
    console.log("[VITALS RECORD] Alerts generated:", newVitals.alerts?.length || 0);

    // Log security/audit information
    console.log("[VITALS RECORD] Audit log - Vitals recorded:", {
      vitalsId: newVitals._id || newVitals.id,
      patientId,
      nurseId,
      recordedAt: new Date().toISOString(),
      alertsCount: newVitals.alerts?.length || 0,
      deviceInfo: deviceInfo || "Unknown",
    });

    // Emit real-time update for alerts
    const io = req.app.get("io");
    if (newVitals.alerts && newVitals.alerts.length > 0) {
      console.log("[VITALS RECORD] Emitting alerts to admin-updates room");
      io.to("admin-updates").emit("vitals-alert", {
        patientId,
        patientName: patient ? patient.name : null,
        alerts: newVitals.alerts,
        timestamp: new Date(),
      });
    }

    console.log("[VITALS RECORD] Sending success response");
    res.status(201).json({
      success: true,
      message: "Vitals recorded successfully",
      data: newVitals.toPublic ? newVitals.toPublic() : newVitals,
      alerts: newVitals.alerts || [],
    });
  } catch (error) {
    console.error("[VITALS RECORD] Error recording vitals:", error);
    console.error("[VITALS RECORD] Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to record vitals",
      error: error.message,
    });
  }
});

// Get vitals by patient ID
router.get("/patient/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const patient = await Patient.findOne({ uniqueId: patientId });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const vitals = await Vitals.find({ patient: patient._id }).sort({ createdAt: -1 }).limit(limit);

    res.json({
      success: true,
      data: vitals.map((v) => (v.toPublic ? v.toPublic() : v)),
    });
  } catch (error) {
    console.error("Error fetching patient vitals:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient vitals",
      error: error.message,
    });
  }
});
// Get latest vitals by patient ID
router.get("/latest/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await Patient.findOne({ uniqueId: patientId });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const latestVitals = await Vitals.findOne({ patient: patient._id }).sort({ createdAt: -1 });

    if (!latestVitals) {
      return res.status(404).json({
        success: false,
        message: "No vitals found for this patient",
      });
    }

    res.json({
      success: true,
      data: latestVitals.toPublic ? latestVitals.toPublic() : latestVitals,
    });
  } catch (error) {
    console.error("Error fetching latest vitals:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch latest vitals",
      error: error.message,
    });
  }
});

// Get vitals by nurse ID
router.get("/nurse/:nurseId", async (req, res) => {
  try {
    const { nurseId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const vitals = await (Vitals.findByNurse
      ? Vitals.findByNurse(nurseId, limit)
      : Vitals.find({ nurseId }).sort({ createdAt: -1 }).limit(limit));

    res.json({
      success: true,
      data: vitals.map((v) => (v.toPublic ? v.toPublic() : v)),
    });
  } catch (error) {
    console.error("Error fetching nurse vitals:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch nurse vitals",
      error: error.message,
    });
  }
});

// Get all abnormal vitals (with alerts)
router.get("/abnormal", async (req, res) => {
  try {
    const abnormalVitals = await Vitals.find({ "alerts.0": { $exists: true }, status: { $ne: "reviewed" } }).populate(
      "patient"
    );

    res.json({
      success: true,
      data: abnormalVitals.map((v) => {
        const public = v.toPublic ? v.toPublic() : v;
        return {
          ...public,
          patientId: v.patient ? v.patient.uniqueId || public.patientId : public.patientId,
        };
      }),
    });
  } catch (error) {
    console.error("Error fetching abnormal vitals:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch abnormal vitals",
      error: error.message,
    });
  }
});

// Get unsynced vitals (not synced to EMR)
router.get("/unsynced", async (req, res) => {
  try {
    const unsyncedVitals = await Vitals.find({ syncedToEMR: false }).populate("patient");

    res.json({
      success: true,
      data: unsyncedVitals.map((v) => {
        const public = v.toPublic ? v.toPublic() : v;
        return {
          ...public,
          patientId: v.patient ? v.patient.uniqueId || public.patientId : public.patientId,
        };
      }),
      count: unsyncedVitals.length,
    });
  } catch (error) {
    console.error("Error fetching unsynced vitals:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch unsynced vitals",
      error: error.message,
    });
  }
});

// Update vitals status (e.g., mark as reviewed)
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["recorded", "reviewed", "flagged"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be: recorded, reviewed, or flagged",
      });
    }

    const updatedVitals = await Vitals.findByIdAndUpdate(id, { status }, { new: true });

    if (!updatedVitals) {
      return res.status(404).json({
        success: false,
        message: "Vitals record not found",
      });
    }

    res.json({
      success: true,
      message: "Status updated successfully",
      data: updatedVitals.toPublic ? updatedVitals.toPublic() : updatedVitals,
    });
  } catch (error) {
    console.error("Error updating vitals status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update vitals status",
      error: error.message,
    });
  }
});

// Sync vitals to EMR (simulate EMR sync)
router.post("/:id/sync-emr", async (req, res) => {
  try {
    const { id } = req.params;

    // Simulate EMR sync delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const updatedVitals = await Vitals.findByIdAndUpdate(
      id,
      {
        syncedToEMR: true,
        emrSyncTimestamp: new Date(),
      },
      { new: true }
    );

    if (!updatedVitals) {
      return res.status(404).json({
        success: false,
        message: "Vitals record not found",
      });
    }

    res.json({
      success: true,
      message: "Successfully synced to EMR",
      data: updatedVitals.toPublic ? updatedVitals.toPublic() : updatedVitals,
    });
  } catch (error) {
    console.error("Error syncing to EMR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to sync to EMR",
      error: error.message,
    });
  }
});

// Bulk sync all unsynced vitals to EMR
router.post("/sync-all-emr", async (req, res) => {
  try {
    const unsyncedVitals = await Vitals.find({ syncedToEMR: false });

    // Simulate bulk EMR sync
    const syncPromises = unsyncedVitals.map(async (vital) => {
      await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay per record

      return Vitals.findByIdAndUpdate(vital.id || vital._id, {
        syncedToEMR: true,
        emrSyncTimestamp: new Date(),
      });
    });

    await Promise.all(syncPromises);

    res.json({
      success: true,
      message: `Successfully synced ${unsyncedVitals.length} vitals records to EMR`,
      syncedCount: unsyncedVitals.length,
    });
  } catch (error) {
    console.error("Error bulk syncing to EMR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to bulk sync to EMR",
      error: error.message,
    });
  }
});

// Get vitals dashboard data
router.get("/dashboard", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's vitals
    const todayVitals = await Vitals.find({
      createdAt: { $gte: today },
    });

    // Get abnormal vitals
    const abnormalVitals = await (Vitals.findAbnormal
      ? Vitals.findAbnormal().populate("patient")
      : Vitals.find({ "alerts.0": { $exists: true }, status: { $ne: "reviewed" } }).populate("patient"));

    // Get unsynced count
    const unsyncedCount = (await Vitals.find({ syncedToEMR: false })).length;

    // Calculate alert severity distribution
    const alertSeverity = { low: 0, medium: 0, high: 0, critical: 0 };
    abnormalVitals.forEach((vital) => {
      if (vital.alerts) {
        vital.alerts.forEach((alert) => {
          alertSeverity[alert.severity] = (alertSeverity[alert.severity] || 0) + 1;
        });
      }
    });

    res.json({
      success: true,
      data: {
        todayCount: todayVitals.length,
        abnormalCount: abnormalVitals.length,
        unsyncedCount,
        alertSeverity,
        recentAbnormal: abnormalVitals.slice(0, 5).map((v) => {
          const public = v.toPublic ? v.toPublic() : v;
          return {
            ...public,
            patientId: v.patient ? v.patient.uniqueId || public.patientId : public.patientId,
          };
        }),
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      error: error.message,
    });
  }
});

module.exports = router;
