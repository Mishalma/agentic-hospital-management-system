const mongoose = require('mongoose');

const billingRateSchema = new mongoose.Schema({
  rateId: {
    type: String,
    required: true,
    unique: true,
    default: () => `RATE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  category: {
    type: String,
    required: true,
    enum: ['Consultation', 'Laboratory', 'Pharmacy', 'Procedure', 'Accommodation', 'Miscellaneous']
  },
  serviceCode: {
    type: String,
    required: true,
    unique: true
  },
  serviceName: {
    type: String,
    required: true
  },
  description: String,
  department: String,
  
  // Pricing structure
  pricing: {
    basePrice: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    unit: {
      type: String,
      default: 'per service'
    },
    
    // Tiered pricing based on patient type
    patientTypeRates: [{
      patientType: {
        type: String,
        enum: ['General', 'Senior Citizen', 'Child', 'Emergency', 'Corporate', 'Insurance']
      },
      rate: Number,
      discountPercentage: { type: Number, default: 0 }
    }],
    
    // Insurance rates
    insuranceRates: [{
      insuranceProvider: String,
      rate: Number,
      coveragePercentage: { type: Number, default: 0 },
      copayAmount: { type: Number, default: 0 }
    }],
    
    // Volume-based pricing
    volumeDiscounts: [{
      minQuantity: Number,
      maxQuantity: Number,
      discountPercentage: Number
    }]
  },
  
  // Tax configuration
  tax: {
    taxable: { type: Boolean, default: true },
    taxPercentage: { type: Number, default: 18 }, // GST
    taxCode: String,
    exemptionReason: String
  },
  
  // Validity and scheduling
  validity: {
    effectiveFrom: {
      type: Date,
      default: Date.now
    },
    effectiveTo: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  },
  
  // Additional configurations
  configuration: {
    allowPartialPayment: { type: Boolean, default: true },
    requirePreAuthorization: { type: Boolean, default: false },
    maxCreditLimit: Number,
    billingFrequency: {
      type: String,
      enum: ['Immediate', 'Daily', 'Weekly', 'Monthly'],
      default: 'Immediate'
    }
  },
  
  // Approval workflow
  approval: {
    status: {
      type: String,
      enum: ['Draft', 'Pending Approval', 'Approved', 'Rejected'],
      default: 'Draft'
    },
    submittedBy: String,
    submittedAt: Date,
    reviewedBy: String,
    reviewedAt: Date,
    approvedBy: String,
    approvedAt: Date,
    rejectionReason: String
  },
  
  // Usage statistics
  statistics: {
    totalUsage: { type: Number, default: 0 },
    monthlyUsage: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageDiscount: { type: Number, default: 0 },
    lastUsed: Date
  },
  
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
billingRateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes
billingRateSchema.index({ serviceCode: 1 });
billingRateSchema.index({ category: 1, department: 1 });
billingRateSchema.index({ 'validity.isActive': 1 });

module.exports = mongoose.model('BillingRate', billingRateSchema);