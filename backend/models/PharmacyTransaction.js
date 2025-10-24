const mongoose = require('mongoose');

const pharmacyTransactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true,
    required: true
  },
  pharmacyId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['prescription_dispensing', 'otc_sale', 'return', 'adjustment', 'transfer_in', 'transfer_out'],
    required: true
  },
  prescriptionId: {
    type: String,
    index: true
  },
  patientId: {
    type: String,
    index: true
  },
  doctorId: {
    type: String,
    index: true
  },
  items: [{
    medicationId: {
      type: String,
      required: true
    },
    genericName: {
      type: String,
      required: true
    },
    brandName: String,
    batchNumber: {
      type: String,
      required: true
    },
    expiryDate: {
      type: Date,
      required: true
    },
    quantityDispensed: {
      type: Number,
      required: true,
      min: 0
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    gstAmount: {
      type: Number,
      default: 0
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    substituted: {
      type: Boolean,
      default: false
    },
    substitutionReason: String,
    originalMedication: String
  }],
  billing: {
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    totalGST: {
      type: Number,
      default: 0
    },
    totalDiscount: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    amountPaid: {
      type: Number,
      default: 0
    },
    balance: {
      type: Number,
      default: 0
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'insurance', 'credit'],
      default: 'cash'
    },
    paymentReference: String
  },
  insurance: {
    provider: String,
    policyNumber: String,
    claimNumber: String,
    copayAmount: {
      type: Number,
      default: 0
    },
    coverageAmount: {
      type: Number,
      default: 0
    },
    approvalCode: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'processed'],
      default: 'pending'
    }
  },
  customer: {
    name: String,
    phone: String,
    email: String,
    address: String,
    loyaltyCardNumber: String
  },
  pharmacist: {
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    licenseNumber: String
  },
  counseling: {
    provided: {
      type: Boolean,
      default: false
    },
    notes: String,
    duration: Number, // in minutes
    counselorId: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled', 'returned'],
    default: 'pending'
  },
  timestamps: {
    created: {
      type: Date,
      default: Date.now
    },
    processed: Date,
    completed: Date,
    cancelled: Date
  },
  notes: String,
  alerts: [{
    type: String,
    message: String,
    severity: {
      type: String,
      enum: ['info', 'warning', 'error'],
      default: 'info'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  audit: {
    createdBy: {
      type: String,
      required: true
    },
    modifiedBy: String,
    modifiedAt: Date,
    version: {
      type: Number,
      default: 1
    }
  }
}, {
  timestamps: true
});

// Generate transaction ID
pharmacyTransactionSchema.pre('save', function(next) {
  if (this.isNew && !this.transactionId) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.transactionId = `TXN${timestamp}${random}`;
  }
  next();
});

// Indexes for better performance
pharmacyTransactionSchema.index({ pharmacyId: 1, 'timestamps.created': -1 });
pharmacyTransactionSchema.index({ prescriptionId: 1 });
pharmacyTransactionSchema.index({ patientId: 1, 'timestamps.created': -1 });
pharmacyTransactionSchema.index({ status: 1, 'timestamps.created': -1 });

// Virtual for transaction summary
pharmacyTransactionSchema.virtual('summary').get(function() {
  return {
    transactionId: this.transactionId,
    type: this.type,
    totalAmount: this.billing.totalAmount,
    itemCount: this.items.length,
    status: this.status,
    date: this.timestamps.created,
    pharmacist: this.pharmacist.name
  };
});

module.exports = mongoose.model('PharmacyTransaction', pharmacyTransactionSchema);