const express = require("express");
const router = express.Router();
const { BroughtDeadRecord } = require("../models");

// Get all brought-dead records with filtering and pagination
router.get("/", async (req, res) => {
  try {
    const {
      status,
      priority,
      page = 1,
      limit = 20,
      sortBy = "arrivalDetails.arrivalDate",
      sortOrder = "desc",
    } = req.query;

    let query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    if (req.query.arrivalDateFrom || req.query.arrivalDateTo) {
      query["arrivalDetails.arrivalDate"] = {};
      if (req.query.arrivalDateFrom) {
        query["arrivalDetails.arrivalDate"].$gte = new Date(req.query.arrivalDateFrom);
      }
      if (req.query.arrivalDateTo) {
        query["arrivalDetails.arrivalDate"].$lte = new Date(req.query.arrivalDateTo);
      }
    }

    const records = await BroughtDeadRecord.find(query);
    const total = records.length;

    // Simple sorting
    records.sort((a, b) => {
      let aValue, bValue;
      if (sortBy.includes(".")) {
        const [prop, subProp] = sortBy.split(".");
        aValue = a[prop]?.[subProp];
        bValue = b[prop]?.[subProp];
      } else {
        aValue = a[sortBy];
        bValue = b[sortBy];
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "desc" ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
      }

      return 0;
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedRecords = records.slice(startIndex, startIndex + limit);

    res.json({
      records: paginatedRecords,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get brought-dead record by ID
router.get("/:id", async (req, res) => {
  try {
    const record = await BroughtDeadRecord.findOne({ recordId: req.params.id });

    if (!record) {
      return res.status(404).json({ error: "Brought-dead record not found" });
    }

    res.json({ record });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new brought-dead record
router.post("/", async (req, res) => {
  try {
    const recordData = {
      ...req.body,
      createdBy: req.user?.username || "system",
      auditLog: [
        {
          action: "Record Created",
          performedBy: req.user?.username || "system",
          timestamp: new Date(),
          details: "Brought-dead record created",
        },
      ],
    };

    const newRecord = await BroughtDeadRecord.create(recordData);

    res.status(201).json({
      record: newRecord,
      message: "Brought-dead record created successfully",
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update brought-dead record
router.put("/:id", async (req, res) => {
  try {
    const updates = req.body;

    // Add audit log entry
    if (!updates.auditLog) updates.auditLog = [];
    updates.auditLog.push({
      action: "Record Updated",
      performedBy: req.user?.username || "system",
      timestamp: new Date(),
      details: "Brought-dead record updated",
    });

    updates.updatedAt = new Date();

    const updatedRecord = await BroughtDeadRecord.findByIdAndUpdate(req.params.id, updates, { new: true });

    if (!updatedRecord) {
      return res.status(404).json({ error: "Brought-dead record not found" });
    }

    res.json({ record: updatedRecord });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete brought-dead record
router.delete("/:id", async (req, res) => {
  try {
    const deletedRecord = await BroughtDeadRecord.findByIdAndDelete(req.params.id);

    if (!deletedRecord) {
      return res.status(404).json({ error: "Brought-dead record not found" });
    }

    res.json({
      message: "Brought-dead record deleted successfully",
      record: deletedRecord,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard statistics
router.get("/dashboard/stats", async (req, res) => {
  try {
    const records = await BroughtDeadRecord.find({});

    const stats = {
      total: records.length,
      active: records.filter((r) => r.status === "Under Investigation").length,
      closed: records.filter((r) => r.status === "Closed").length,
      pending: records.filter((r) => r.status !== "Under Investigation" && r.status !== "Closed").length,
      byMannerOfDeath: {},
      byPriority: {},
      recentRecords: records
        .sort((a, b) => new Date(b.arrivalDetails.arrivalDate) - new Date(a.arrivalDetails.arrivalDate))
        .slice(0, 5),
    };

    // Group by manner of death
    records.forEach((record) => {
      const manner = record.causeOfDeath.mannerOfDeath;
      stats.byMannerOfDeath[manner] = (stats.byMannerOfDeath[manner] || 0) + 1;
    });

    // Group by priority
    records.forEach((record) => {
      const priority = record.priority;
      stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get records by date range for reporting
router.get("/reports/date-range", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Start date and end date are required" });
    }

    const records = await BroughtDeadRecord.find({
      "arrivalDetails.arrivalDate": {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    });

    const report = {
      period: { startDate, endDate },
      totalRecords: records.length,
      records: records.map((r) => ({
        recordId: r.recordId,
        arrivalDate: r.arrivalDetails.arrivalDate,
        patientName: r.patientInfo.name,
        causeOfDeath: r.causeOfDeath.primaryCause,
        mannerOfDeath: r.causeOfDeath.mannerOfDeath,
        status: r.status,
        priority: r.priority,
      })),
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
