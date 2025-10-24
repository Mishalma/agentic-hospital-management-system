const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
  admissionId: {
    type: String,
    required: true,
    unique: true,
    default: () => `ADM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  patientId: {
    type: String,
    required: true,
    ref: 'Patient'
  },
  patientInfo: {
    name: String,
    age: Number,
    gender: String,
    phone: String,
    email: String,
    address: String,
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String
    },
    insuranceInfo: {
      provider: String,
      policyNumber: String,
      coverageType: String
    }
  },
  
  // Admission details
  admissionDate: {
    type: Date,
    default: Date.now
  },
  admissionTime: String,
  admissionType: {
    type: String,
    required: true,
    enum: ['Emergency', 'Planned', 'Transfer', 'Readmission', 'Day Care']
  },
  admissionSource: {
    type: String,
    enum: ['Emergency Department', 'Outpatient', 'Transfer from Other Hospital', 'Direct Admission', 'Referral']
  },
  
  // Patient categorization and tagging
  patientCategory: {
    primary: {
      type: String,
      required: true,
      enum: ['General', 'Pediatric', 'Geriatric', 'Maternity', 'Surgical', 'Medical', 'Critical Care', 'Psychiatric']
    },
    secondary: [String],
    specialNeeds: [String],
    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    isolationRequired: {
      type: Boolean,
      default: false
    },
    isolationType: {
      type: String,
      enum: ['Contact', 'Droplet', 'Airborne', 'Protective', 'None']
    }
  },
  
  // Medical information
  medicalInfo: {
    primaryDiagnosis: String,
    secondaryDiagnoses: [String],
    chiefComplaint: String,
    presentingSymptoms: [String],
    allergies: [String],
    currentMedications: [String],
    medicalHistory: [String],
    vitalSigns: {
      temperature: Number,
      bloodPressure: String,
      heartRate: Number,
      respiratoryRate: Number,
      oxygenSaturation: Number,
      weight: Number,
      height: Number,
      bmi: Number
    }
  },
  
  // Bed assignment
  bedAssignment: {
    bedId: String,
    bedNumber: String,
    ward: {
      wardName: String,
      floor: Number,
      wing: String,
      department: String
    },
    assignedAt: Date,
    assignedBy: String,
    previousBeds: [{
      bedId: String,
      bedNumber: String,
      assignedAt: Date,
      transferredAt: Date,
      reason: String
    }]
  },
  
  // Care team
  careTeam: {
    attendingPhysician: {
      doctorId: String,
      name: String,
      department: String,
      contactNumber: String
    },
    consultingPhysicians: [{
      doctorId: String,
      name: String,
      specialty: String,
      consultationDate: Date,
      notes: String
    }],
    primaryNurse: {
      nurseId: String,
      name: String,
      shift: String,
      contactNumber: String
    },
    assignedNurses: [{
      nurseId: String,
      name: String,
      shift: String,
      assignedDate: Date
    }]
  },
  
  // Treatment and care plan
  carePlan: {
    treatmentPlan: String,
    dietaryRequirements: String,
    activityLevel: {
      type: String,
      enum: ['Bed Rest', 'Limited Activity', 'Ambulatory', 'Full Activity']
    },
    specialInstructions: [String],
    precautions: [String],
    expectedLengthOfStay: Number, // in days
    estimatedDischargeDate: Date
  },
  
  // Admission status and workflow
  status: {
    type: String,
    enum: ['Pending', 'Admitted', 'Under Treatment', 'Ready for Discharge', 'Discharged', 'Transferred', 'Deceased'],
    default: 'Pending'
  },
  
  // Discharge information
  discharge: {
    dischargeDate: Date,
    dischargeTime: String,
    dischargeType: {
      type: String,
      enum: ['Home', 'Transfer to Another Facility', 'Against Medical Advice', 'Deceased', 'Left Without Being Seen']
    },
    dischargeCondition: {
      type: String,
      enum: ['Improved', 'Stable', 'Unchanged', 'Worse', 'Deceased']
    },
    dischargeSummary: String,
    followUpInstructions: String,
    followUpDate: Date,
    dischargedBy: String,
    dischargeNotes: String
  },
  
  // Financial information
  financial: {
    estimatedCost: Number,
    actualCost: Number,
    insuranceCoverage: Number,
    patientResponsibility: Number,
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Partial', 'Paid', 'Insurance Pending'],
      default: 'Pending'
    },
    billingNotes: String
  },
  
  // AI-powered insights and recommendations
  aiInsights: {
    riskAssessment: {
      readmissionRisk: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        confidence: Number
      },
      complicationRisk: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        confidence: Number
      },
      lengthOfStayPrediction: {
        predictedDays: Number,
        confidence: Number
      }
    },
    recommendations: [{
      type: {
        type: String,
        enum: ['Bed Assignment', 'Care Plan', 'Discharge Planning', 'Resource Allocation']
      },
      recommendation: String,
      priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical']
      },
      confidence: Number,
      reasoning: String,
      generatedAt: {
        type: Date,
        default: Date.now
      }
    }],
    optimalBedType: String,
    predictedComplications: [String],
    resourceRequirements: [String]
  },
  
  // Workflow and approvals
  workflow: {
    admissionRequestedBy: String,
    admissionRequestedAt: Date,
    admissionApprovedBy: String,
    admissionApprovedAt: Date,
    bedAssignedBy: String,
    bedAssignedAt: Date,
    admissionCompletedBy: String,
    admissionCompletedAt: Date
  },
  
  // Notes and communications
  notes: [{
    noteId: String,
    type: {
      type: String,
      enum: ['Admission Note', 'Progress Note', 'Nursing Note', 'Discharge Note', 'Transfer Note']
    },
    content: String,
    author: String,
    authorRole: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    isPrivate: {
      type: Boolean,
      default: false
    }
  }],
  
  // Audit trail
  auditLog: [{
    action: String,
    performedBy: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: String,
    oldValue: String,
    newValue: String
  }],
  
  createdBy: String,
  updatedBy: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware
admissionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for better query performance
admissionSchema.index({ patientId: 1, admissionDate: -1 });
admissionSchema.index({ admissionId: 1 });
admissionSchema.index({ status: 1 });
admissionSchema.index({ 'bedAssignment.bedId': 1 });
admissionSchema.index({ admissionDate: -1 });

module.exports = mongoose.model('Admission', admissionSchema);