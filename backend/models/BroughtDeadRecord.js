const mongoose = require("mongoose");

const broughtDeadRecordSchema = new mongoose.Schema({
  recordId: {
    type: String,
    required: true,
    unique: true,
  },
  patientId: {
    type: String,
    required: true,
  },
  patientInfo: {
    name: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    phone: String,
    address: String,
    identification: String,
  },
  arrivalDetails: {
    arrivalDate: {
      type: Date,
      required: true,
    },
    arrivalTime: {
      type: String,
      required: true,
    },
    arrivedFrom: {
      type: String,
      required: true,
    },
    broughtBy: {
      type: String,
      required: true,
    },
    witnessPresent: {
      type: Boolean,
      default: false,
    },
    witnessInfo: {
      name: String,
      designation: String,
      contact: String,
    },
    notificationTime: Date,
  },
  physicalExamination: {
    bodyCondition: String,
    estimatedTimeOfDeath: String,
    externalInjuries: String,
    clothing: String,
    personalBelongings: String,
  },
  causeOfDeath: {
    primaryCause: {
      type: String,
      required: true,
    },
    secondaryCauses: [String],
    mannerOfDeath: {
      type: String,
      enum: ["Natural", "Accident", "Suicide", "Homicide", "Undetermined"],
      required: true,
    },
    causeCode: String,
    confidence: {
      type: String,
      enum: ["High", "Medium", "Low"],
    },
    evidence: String,
  },
  policeDetails: {
    firNumber: String,
    policeStation: String,
    investigatingOfficer: String,
    contactNumber: String,
    notificationSent: {
      type: Boolean,
      default: false,
    },
  },
  medicalExamination: {
    examinedBy: String,
    examinationDate: Date,
    findings: String,
    autopsyRequired: {
      type: Boolean,
      default: false,
    },
    autopsyScheduled: Date,
  },
  documentation: {
    deathCertificate: {
      issued: {
        type: Boolean,
        default: false,
      },
      issuedDate: Date,
      issuedBy: String,
    },
    policeReport: {
      submitted: {
        type: Boolean,
        default: false,
      },
      submissionDate: Date,
      referenceNumber: String,
    },
    authoritySubmission: {
      submitted: {
        type: Boolean,
        default: false,
      },
      submissionDate: Date,
      authority: String,
    },
  },
  status: {
    type: String,
    enum: ["Under Investigation", "Closed", "Pending"],
    default: "Under Investigation",
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Medium",
  },
  notes: [
    {
      noteId: String,
      type: String,
      content: String,
      author: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  auditLog: [
    {
      action: String,
      performedBy: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
      details: String,
    },
  ],
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
broughtDeadRecordSchema.index({ recordId: 1 });
broughtDeadRecordSchema.index({ status: 1 });
broughtDeadRecordSchema.index({ priority: 1 });
broughtDeadRecordSchema.index({ "arrivalDetails.arrivalDate": 1 });
broughtDeadRecordSchema.index({ "causeOfDeath.mannerOfDeath": 1 });

// Pre-save middleware to update updatedAt
broughtDeadRecordSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Static methods for common queries
broughtDeadRecordSchema.statics.findByStatus = function (status) {
  return this.find({ status });
};

broughtDeadRecordSchema.statics.findByPriority = function (priority) {
  return this.find({ priority });
};

broughtDeadRecordSchema.statics.findByDateRange = function (startDate, endDate) {
  return this.find({
    "arrivalDetails.arrivalDate": {
      $gte: startDate,
      $lte: endDate,
    },
  });
};

broughtDeadRecordSchema.statics.getDashboardStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: {
            $cond: [{ $eq: ["$status", "Under Investigation"] }, 1, 0],
          },
        },
        closed: {
          $sum: {
            $cond: [{ $eq: ["$status", "Closed"] }, 1, 0],
          },
        },
        pending: {
          $sum: {
            $cond: [{ $eq: ["$status", "Pending"] }, 1, 0],
          },
        },
      },
    },
  ]);

  const mannerStats = await this.aggregate([
    {
      $group: {
        _id: "$causeOfDeath.mannerOfDeath",
        count: { $sum: 1 },
      },
    },
  ]);

  const priorityStats = await this.aggregate([
    {
      $group: {
        _id: "$priority",
        count: { $sum: 1 },
      },
    },
  ]);

  return {
    total: stats[0]?.total || 0,
    active: stats[0]?.active || 0,
    closed: stats[0]?.closed || 0,
    pending: stats[0]?.pending || 0,
    byMannerOfDeath: mannerStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {}),
    byPriority: priorityStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {}),
  };
};

module.exports = mongoose.model("BroughtDeadRecord", broughtDeadRecordSchema);
