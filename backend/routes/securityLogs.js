const express = require("express");
const router = express.Router();
const { SecurityLog } = require("../models");

// Get all security logs with filtering and pagination
router.get("/", async (req, res) => {
  try {
    const { entryType, status, location, page = 1, limit = 20, sortBy = "timestamp", sortOrder = "desc" } = req.query;

    let query = {};
    if (entryType) query.entryType = entryType;
    if (status) query.status = status;
    if (location) query.location = location;

    if (req.query.startDate || req.query.endDate) {
      query.timestamp = {};
      if (req.query.startDate) {
        query.timestamp.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.timestamp.$lte = new Date(req.query.endDate);
      }
    }

    const logs = await SecurityLog.find(query);
    const total = logs.length;

    // Simple sorting
    logs.sort((a, b) => {
      let aValue, bValue;
      if (sortBy === "timestamp") {
        aValue = new Date(a.timestamp);
        bValue = new Date(b.timestamp);
        return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
      }
      return 0;
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedLogs = logs.slice(startIndex, startIndex + limit);

    res.json({
      logs: paginatedLogs,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get security log by ID
router.get("/:id", async (req, res) => {
  try {
    const log = await SecurityLog.findOne({ logId: req.params.id });

    if (!log) {
      return res.status(404).json({ error: "Security log not found" });
    }

    res.json({ log });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new security log
router.post("/", async (req, res) => {
  try {
    const logData = {
      ...req.body,
      createdBy: req.user?.username || "system",
      timestamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date(),
    };

    const newLog = await SecurityLog.create(logData);

    res.status(201).json({
      log: newLog,
      message: "Security log created successfully",
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update security log
router.put("/:id", async (req, res) => {
  try {
    const updates = req.body;
    updates.updatedAt = new Date();

    const updatedLog = await SecurityLog.findByIdAndUpdate(req.params.id, updates, { new: true });

    if (!updatedLog) {
      return res.status(404).json({ error: "Security log not found" });
    }

    res.json({ log: updatedLog });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete security log
router.delete("/:id", async (req, res) => {
  try {
    const deletedLog = await SecurityLog.findByIdAndDelete(req.params.id);

    if (!deletedLog) {
      return res.status(404).json({ error: "Security log not found" });
    }

    res.json({
      message: "Security log deleted successfully",
      log: deletedLog,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard statistics
router.get("/dashboard/stats", async (req, res) => {
  try {
    const logs = await SecurityLog.find({});

    const stats = {
      total: logs.length,
      active: logs.filter((l) => l.status === "active").length,
      completed: logs.filter((l) => l.status === "completed").length,
      resolved: logs.filter((l) => l.status === "resolved").length,
      byEntryType: {},
      byLocation: {},
      recentLogs: logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10),
    };

    // Group by entry type
    logs.forEach((log) => {
      const type = log.entryType;
      stats.byEntryType[type] = (stats.byEntryType[type] || 0) + 1;
    });

    // Group by location
    logs.forEach((log) => {
      const location = log.location;
      stats.byLocation[location] = (stats.byLocation[location] || 0) + 1;
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get visitor logs (active check-ins)
router.get("/active/visitors", async (req, res) => {
  try {
    const activeVisitors = await SecurityLog.find({
      entryType: "visitor_checkin",
      status: "active",
    });

    res.json({
      visitors: activeVisitors,
      total: activeVisitors.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process visitor checkout
router.post("/:id/checkout", async (req, res) => {
  try {
    const { checkoutNotes } = req.body;

    const log = await SecurityLog.findOne({ logId: req.params.id });

    if (!log) {
      return res.status(404).json({ error: "Security log not found" });
    }

    if (log.entryType !== "visitor_checkin" || log.status !== "active") {
      return res.status(400).json({ error: "Invalid log for checkout" });
    }

    const duration = Math.round((new Date() - new Date(log.timestamp)) / (1000 * 60)); // in minutes

    const updatedLog = await SecurityLog.findByIdAndUpdate(
      log._id,
      {
        status: "completed",
        checkoutTime: new Date(),
        duration: `${Math.floor(duration / 60)} hours ${duration % 60} minutes`,
        checkoutNotes,
        updatedAt: new Date(),
      },
      { new: true }
    );

    res.json({
      log: updatedLog,
      message: "Checkout processed successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get incident reports
router.get("/incidents/all", async (req, res) => {
  try {
    const incidents = await SecurityLog.find({ entryType: "incident_report" });

    res.json({
      incidents,
      total: incidents.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
