const mongoose = require('mongoose');

const labResultSchema = new mongoose.Schema({
  resultId: {
    type: String,
    required: true,
    unique: true,
    default: () => `RES-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  orderId: {
    type: String,
    required: true,
    ref: 'LabOrder'
  },
  patientId: {
    type: String,
    required: true,
    ref: 'Patient'
  },
  testCode: {
    type: String,
    required: true
  },
  testName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Hematology', 'Biochemistry', 'Microbiology', 'Immunology', 'Pathology', 'Radiology', 'Other']
  },
  specimen: {
    type: String,
    required: true
  },
  results: [{
    parameter: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    },
    unit: String,
    referenceRange: {
      type: String,
      required: true
    },
    flag: {
      type: String,
      enum: ['Normal', 'High', 'Low', 'Critical', 'Abnormal'],
      default: 'Normal'
    },
    method: String,
    instrument: String
  }],
  overallInterpretation: String,
  technologistComments: String,
  pathologistComments: String,
  performedBy: {
    technologist: String,
    pathologist: String,
    supervisor: String
  },
  performedAt: {
    type: Date,
    default: Date.now
  },
  verifiedBy: String,
  verifiedAt: Date,
  status: {
    type: String,
    enum: ['Draft', 'Preliminary', 'Final', 'Corrected', 'Cancelled'],
    default: 'Draft'
  },
  qcStatus: {
    type: String,
    enum: ['Pending', 'Pass', 'Fail', 'Review'],
    default: 'Pending'
  },
  criticalValues: [{
    parameter: String,
    value: String,
    threshold: String,
    notified: Boolean,
    notifiedTo: String,
    notifiedAt: Date
  }],
  deltaChecks: [{
    parameter: String,
    currentValue: String,
    previousValue: String,
    percentChange: Number,
    flagged: Boolean
  }],
  instrumentData: {
    instrumentId: String,
    runId: String,
    calibrationStatus: String,
    qcResults: String
  },
  reportGenerated: {
    type: Boolean,
    default: false
  },
  reportUrl: String,
  deliveryStatus: {
    type: String,
    enum: ['Pending', 'Sent', 'Delivered', 'Failed'],
    default: 'Pending'
  },
  deliveryMethod: {
    type: String,
    enum: ['EMR', 'Email', 'Print', 'Portal', 'Fax'],
    default: 'EMR'
  },
  deliveredAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
labResultSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for better query performance
labResultSchema.index({ patientId: 1, performedAt: -1 });
labResultSchema.index({ orderId: 1 });
labResultSchema.index({ resultId: 1 });
labResultSchema.index({ status: 1 });

module.exports = mongoose.model('LabResult', labResultSchema);