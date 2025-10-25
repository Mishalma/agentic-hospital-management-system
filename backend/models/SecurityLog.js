const mongoose = require("mongoose");

const securityLogSchema = new mongoose.Schema({
  logId: {
    type: String,
    required: true,
    unique: true,
  },
  entryType: {
    type: String,
    enum: ["visitor_checkin", "visitor_checkout", "staff_entry", "incident_report", "emergency_access"],
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
  location: {
    type: String,
    required: true,
  },
  personDetails: {
    type: {
      type: String,
      enum: ["visitor", "staff", "emergency", "unknown"],
    },
    name: String,
    employeeId: String,
    contactNumber: String,
    purpose: String,
    visitingPatient: String,
    visitingDoctor: String,
    relationship: String,
    designation: String,
    department: String,
    description: String, // for unknown/emergency cases
  },
  accessControl: {
    badgeIssued: {
      type: Boolean,
      default: false,
    },
    badgeNumber: String,
    authorizedBy: String,
    accessLevel: String,
    areasAllowed: [String],
    emergencyAccess: {
      type: Boolean,
      default: false,
    },
    badgeReturned: {
      type: Boolean,
      default: false,
    },
    checkoutProcessedBy: String,
  },
  securityCheck: {
    idVerified: {
      type: Boolean,
      default: false,
    },
    itemsChecked: {
      type: Boolean,
      default: false,
    },
    prohibitedItems: [String],
    notes: String,
    bypassed: {
      type: Boolean,
      default: false,
    },
    reason: String,
    investigationRequired: {
      type: Boolean,
      default: false,
    },
    policeInvolved: {
      type: Boolean,
      default: false,
    },
    reportFiled: {
      type: Boolean,
      default: false,
    },
  },
  incidentDetails: {
    incidentType: String,
    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
    },
    description: String,
    reportedBy: String,
    witnesses: [String],
    actionsTaken: [String],
    resolution: String,
    followUpRequired: {
      type: Boolean,
      default: false,
    },
  },
  status: {
    type: String,
    enum: ["active", "completed", "resolved", "pending"],
    default: "active",
  },
  checkoutTime: Date,
  duration: String,
  checkoutNotes: String,
  createdBy: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for better query performance
securityLogSchema.index({ logId: 1 });
securityLogSchema.index({ entryType: 1 });
securityLogSchema.index({ status: 1 });
securityLogSchema.index({ location: 1 });
securityLogSchema.index({ timestamp: 1 });
securityLogSchema.index({ "personDetails.type": 1 });

// Pre-save middleware to update updatedAt
securityLogSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Static methods for common queries
securityLogSchema.statics.findByEntryType = function (entryType) {
  return this.find({ entryType });
};

securityLogSchema.statics.findActiveVisitors = function () {
  return this.find({
    entryType: "visitor_checkin",
    status: "active",
  });
};

securityLogSchema.statics.findIncidents = function () {
  return this.find({ entryType: "incident_report" });
};

securityLogSchema.statics.findByDateRange = function (startDate, endDate) {
  return this.find({
    timestamp: {
      $gte: startDate,
      $lte: endDate,
    },
  });
};

securityLogSchema.statics.getDashboardStats = async function () {
  const logs = await this.find({});

  const stats = {
    total: logs.length,
    active: logs.filter((l) => l.status === "active").length,
    completed: logs.filter((l) => l.status === "completed").length,
    resolved: logs.filter((l) => l.status === "resolved").length,
    byEntryType: {},
    byLocation: {},
    recentLogs: logs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10),
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

  return stats;
};

// Instance methods
securityLogSchema.methods.checkout = function (checkoutData = {}) {
  this.status = "completed";
  this.checkoutTime = new Date();
  this.checkoutNotes = checkoutData.notes;
  if (this.accessControl) {
    this.accessControl.badgeReturned = checkoutData.badgeReturned || false;
    this.checkoutProcessedBy = checkoutData.processedBy;
  }

  // Calculate duration
  if (this.timestamp) {
    const durationMs = this.checkoutTime - this.timestamp;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    this.duration = `${hours} hours ${minutes} minutes`;
  }

  this.updatedAt = new Date();
  return this.save();
};

module.exports = mongoose.model("SecurityLog", securityLogSchema);
