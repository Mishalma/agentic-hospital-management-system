const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    index: true
  },
  doctorId: {
    type: String,
    required: true,
    index: true
  },
  appointmentId: {
    type: String,
    index: true
  },
  consultationDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  chiefComplaint: {
    type: String,
    required: true
  },
  historyOfPresentIllness: {
    type: String
  },
  pastMedicalHistory: {
    type: String
  },
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    startDate: Date,
    endDate: Date,
    status: {
      type: String,
      enum: ['active', 'discontinued', 'completed'],
      default: 'active'
    }
  }],
  allergies: [{
    allergen: String,
    reaction: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe']
    }
  }],
  vitals: {
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    heartRate: Number,
    temperature: Number,
    respiratoryRate: Number,
    oxygenSaturation: Number,
    weight: Number,
    height: Number,
    bmi: Number
  },
  physicalExamination: {
    general: String,
    systems: [{
      system: String,
      findings: String
    }]
  },
  symptoms: [{
    symptom: String,
    severity: {
      type: Number,
      min: 1,
      max: 10
    },
    duration: String,
    onset: String,
    character: String
  }],
  assessment: {
    primaryDiagnosis: String,
    differentialDiagnosis: [String],
    clinicalNotes: String
  },
  aiSuggestions: {
    requested: {
      type: Boolean,
      default: false
    },
    response: {
      differentialDiagnosis: [String],
      investigations: [String],
      treatment: String,
      redFlags: [String],
      followUp: String,
      confidence: Number,
      timestamp: Date
    }
  },
  investigations: [{
    test: String,
    status: {
      type: String,
      enum: ['ordered', 'pending', 'completed', 'cancelled'],
      default: 'ordered'
    },
    orderDate: {
      type: Date,
      default: Date.now
    },
    results: String,
    resultDate: Date
  }],
  prescriptions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  }],
  referrals: [{
    specialty: String,
    doctor: String,
    reason: String,
    urgency: {
      type: String,
      enum: ['routine', 'urgent', 'emergent'],
      default: 'routine'
    },
    status: {
      type: String,
      enum: ['pending', 'scheduled', 'completed', 'cancelled'],
      default: 'pending'
    },
    referralDate: {
      type: Date,
      default: Date.now
    }
  }],
  followUp: {
    required: {
      type: Boolean,
      default: false
    },
    timeframe: String,
    instructions: String,
    scheduledDate: Date
  },
  consultationStatus: {
    type: String,
    enum: ['in-progress', 'completed', 'cancelled'],
    default: 'in-progress'
  },
  consultationType: {
    type: String,
    enum: ['initial', 'follow-up', 'emergency', 'telemedicine'],
    default: 'initial'
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  notes: {
    type: String
  },
  attachments: [{
    filename: String,
    url: String,
    type: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
consultationSchema.index({ patientId: 1, consultationDate: -1 });
consultationSchema.index({ doctorId: 1, consultationDate: -1 });
consultationSchema.index({ consultationStatus: 1 });

// Virtual for consultation summary
consultationSchema.virtual('summary').get(function() {
  return {
    id: this._id,
    patientId: this.patientId,
    doctorId: this.doctorId,
    date: this.consultationDate,
    chiefComplaint: this.chiefComplaint,
    primaryDiagnosis: this.assessment?.primaryDiagnosis,
    status: this.consultationStatus,
    prescriptionCount: this.prescriptions?.length || 0,
    investigationCount: this.investigations?.length || 0
  };
});

module.exports = mongoose.model('Consultation', consultationSchema);