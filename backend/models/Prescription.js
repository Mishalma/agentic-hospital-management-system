const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  consultationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consultation',
    required: true,
    index: true
  },
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
  prescriptionNumber: {
    type: String,
    unique: true,
    required: true
  },
  prescriptionDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  medications: [{
    genericName: {
      type: String,
      required: true
    },
    brandName: String,
    dosage: {
      type: String,
      required: true
    },
    dosageForm: {
      type: String,
      required: true // tablet, capsule, syrup, injection, etc.
    },
    frequency: {
      type: String,
      required: true // BID, TID, QID, PRN, etc.
    },
    route: {
      type: String,
      default: 'oral' // oral, IV, IM, topical, etc.
    },
    duration: {
      value: Number,
      unit: {
        type: String,
        enum: ['days', 'weeks', 'months'],
        default: 'days'
      }
    },
    quantity: {
      type: Number,
      required: true
    },
    refills: {
      type: Number,
      default: 0
    },
    instructions: String,
    indication: String,
    substitutionAllowed: {
      type: Boolean,
      default: true
    },
    brandPreference: {
      preferred: String,
      alternatives: [String]
    },
    cost: {
      generic: Number,
      brand: Number,
      insurance: Number
    },
    status: {
      type: String,
      enum: ['active', 'dispensed', 'completed', 'cancelled', 'expired'],
      default: 'active'
    }
  }],
  diagnosis: {
    primary: String,
    secondary: [String]
  },
  pharmacyInfo: {
    pharmacyId: String,
    pharmacyName: String,
    pharmacyAddress: String,
    pharmacyPhone: String,
    preferredPharmacy: {
      type: Boolean,
      default: false
    }
  },
  insuranceInfo: {
    provider: String,
    policyNumber: String,
    groupNumber: String,
    copay: Number
  },
  drugInteractions: [{
    drug1: String,
    drug2: String,
    severity: {
      type: String,
      enum: ['minor', 'moderate', 'major', 'contraindicated']
    },
    description: String,
    action: String
  }],
  allergies: [{
    allergen: String,
    reaction: String,
    severity: String
  }],
  aiAnalysis: {
    interactionCheck: {
      performed: {
        type: Boolean,
        default: false
      },
      results: [{
        type: String,
        severity: String,
        recommendation: String
      }],
      timestamp: Date
    },
    dosageValidation: {
      performed: {
        type: Boolean,
        default: false
      },
      warnings: [String],
      recommendations: [String],
      timestamp: Date
    }
  },
  electronicSignature: {
    doctorSignature: String,
    signatureDate: Date,
    digitalCertificate: String
  },
  dispensingInfo: [{
    pharmacyId: String,
    dispensedDate: Date,
    dispensedQuantity: Number,
    dispensedBy: String,
    lotNumber: String,
    expiryDate: Date,
    patientCounseled: {
      type: Boolean,
      default: false
    }
  }],
  refillHistory: [{
    refillDate: Date,
    pharmacyId: String,
    quantity: Number,
    refillNumber: Number,
    dispensedBy: String
  }],
  status: {
    type: String,
    enum: ['draft', 'sent', 'received', 'dispensed', 'completed', 'cancelled'],
    default: 'draft'
  },
  transmissionInfo: {
    method: {
      type: String,
      enum: ['electronic', 'fax', 'phone', 'paper'],
      default: 'electronic'
    },
    transmittedDate: Date,
    confirmationNumber: String,
    pharmacyConfirmation: {
      received: Boolean,
      receivedDate: Date,
      pharmacistId: String
    }
  },
  patientInstructions: {
    generalInstructions: String,
    dietaryRestrictions: String,
    activityRestrictions: String,
    followUpInstructions: String
  },
  clinicalNotes: String,
  priority: {
    type: String,
    enum: ['routine', 'urgent', 'stat'],
    default: 'routine'
  }
}, {
  timestamps: true
});

// Generate prescription number
prescriptionSchema.pre('save', async function(next) {
  if (this.isNew && !this.prescriptionNumber) {
    const count = await this.constructor.countDocuments();
    this.prescriptionNumber = `RX${Date.now()}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Indexes for better performance
prescriptionSchema.index({ patientId: 1, prescriptionDate: -1 });
prescriptionSchema.index({ doctorId: 1, prescriptionDate: -1 });
prescriptionSchema.index({ status: 1 });
prescriptionSchema.index({ prescriptionNumber: 1 });

// Virtual for total cost
prescriptionSchema.virtual('totalCost').get(function() {
  return this.medications.reduce((total, med) => {
    return total + (med.cost?.generic || 0) * med.quantity;
  }, 0);
});

// Virtual for medication count
prescriptionSchema.virtual('medicationCount').get(function() {
  return this.medications.length;
});

module.exports = mongoose.model('Prescription', prescriptionSchema);