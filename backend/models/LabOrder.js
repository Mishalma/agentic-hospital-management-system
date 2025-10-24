const mongoose = require('mongoose');

const labOrderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    default: () => `LAB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  patientId: {
    type: String,
    required: true,
    ref: 'Patient'
  },
  doctorId: {
    type: String,
    required: true,
    ref: 'User'
  },
  consultationId: {
    type: String,
    ref: 'Consultation'
  },
  tests: [{
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
    priority: {
      type: String,
      enum: ['Routine', 'Urgent', 'STAT'],
      default: 'Routine'
    },
    specimen: {
      type: String,
      required: true,
      enum: ['Blood', 'Urine', 'Stool', 'Sputum', 'CSF', 'Tissue', 'Swab', 'Other']
    },
    instructions: String,
    status: {
      type: String,
      enum: ['Ordered', 'Collected', 'Processing', 'Completed', 'Cancelled'],
      default: 'Ordered'
    },
    result: {
      value: String,
      unit: String,
      referenceRange: String,
      flag: {
        type: String,
        enum: ['Normal', 'High', 'Low', 'Critical', 'Abnormal']
      },
      comments: String,
      verifiedBy: String,
      verifiedAt: Date
    },
    collectedAt: Date,
    processedAt: Date,
    completedAt: Date
  }],
  orderDate: {
    type: Date,
    default: Date.now
  },
  clinicalInfo: {
    diagnosis: String,
    symptoms: String,
    medications: String,
    allergies: String
  },
  sampleCollection: {
    collectedBy: String,
    collectionDate: Date,
    collectionTime: String,
    collectionNotes: String,
    barcodeId: String
  },
  status: {
    type: String,
    enum: ['Pending', 'Collected', 'Processing', 'Completed', 'Cancelled', 'Partial'],
    default: 'Pending'
  },
  priority: {
    type: String,
    enum: ['Routine', 'Urgent', 'STAT'],
    default: 'Routine'
  },
  reportGenerated: {
    type: Boolean,
    default: false
  },
  reportUrl: String,
  billingCode: String,
  cost: Number,
  insurance: {
    provider: String,
    policyNumber: String,
    covered: Boolean,
    copay: Number
  },
  alerts: [{
    type: {
      type: String,
      enum: ['Critical', 'Abnormal', 'Panic', 'Delta']
    },
    message: String,
    acknowledged: Boolean,
    acknowledgedBy: String,
    acknowledgedAt: Date,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  qcChecks: [{
    parameter: String,
    expected: String,
    actual: String,
    status: {
      type: String,
      enum: ['Pass', 'Fail', 'Warning']
    },
    checkedBy: String,
    checkedAt: {
      type: Date,
      default: Date.now
    }
  }],
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
labOrderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for better query performance
labOrderSchema.index({ patientId: 1, orderDate: -1 });
labOrderSchema.index({ orderId: 1 });
labOrderSchema.index({ status: 1 });
labOrderSchema.index({ 'tests.status': 1 });

module.exports = mongoose.model('LabOrder', labOrderSchema);