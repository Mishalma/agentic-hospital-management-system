const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  billId: {
    type: String,
    required: true,
    unique: true,
    default: () => `BILL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  patientId: {
    type: String,
    required: true,
    ref: 'Patient'
  },
  patientInfo: {
    name: String,
    phone: String,
    email: String,
    address: String,
    insuranceProvider: String,
    policyNumber: String
  },
  visitId: {
    type: String,
    ref: 'Appointment'
  },
  billDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  },
  status: {
    type: String,
    enum: ['Draft', 'Generated', 'Sent', 'Paid', 'Partially Paid', 'Overdue', 'Cancelled'],
    default: 'Draft'
  },
  priority: {
    type: String,
    enum: ['Normal', 'Urgent', 'Emergency'],
    default: 'Normal'
  },
  
  // Consolidated charges from different departments
  charges: {
    consultation: [{
      consultationId: String,
      doctorId: String,
      doctorName: String,
      department: String,
      serviceCode: String,
      serviceName: String,
      quantity: { type: Number, default: 1 },
      unitPrice: Number,
      discount: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      totalAmount: Number,
      date: Date,
      notes: String
    }],
    
    laboratory: [{
      orderId: String,
      testCode: String,
      testName: String,
      category: String,
      quantity: { type: Number, default: 1 },
      unitPrice: Number,
      discount: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      totalAmount: Number,
      date: Date,
      urgency: String,
      notes: String
    }],
    
    pharmacy: [{
      prescriptionId: String,
      medicationCode: String,
      medicationName: String,
      strength: String,
      quantity: Number,
      unitPrice: Number,
      discount: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      totalAmount: Number,
      date: Date,
      pharmacistId: String,
      notes: String
    }],
    
    procedures: [{
      procedureId: String,
      procedureCode: String,
      procedureName: String,
      department: String,
      performedBy: String,
      quantity: { type: Number, default: 1 },
      unitPrice: Number,
      discount: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      totalAmount: Number,
      date: Date,
      duration: String,
      notes: String
    }],
    
    accommodation: [{
      roomType: String,
      roomNumber: String,
      admissionDate: Date,
      dischargeDate: Date,
      numberOfDays: Number,
      dailyRate: Number,
      discount: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      totalAmount: Number,
      notes: String
    }],
    
    miscellaneous: [{
      itemCode: String,
      itemName: String,
      category: String,
      quantity: { type: Number, default: 1 },
      unitPrice: Number,
      discount: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      totalAmount: Number,
      date: Date,
      department: String,
      notes: String
    }]
  },
  
  // Financial summary
  summary: {
    subtotal: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    balanceAmount: { type: Number, default: 0 },
    advanceAmount: { type: Number, default: 0 }
  },
  
  // Insurance information
  insurance: {
    provider: String,
    policyNumber: String,
    coveragePercentage: { type: Number, default: 0 },
    coveredAmount: { type: Number, default: 0 },
    deductible: { type: Number, default: 0 },
    copayAmount: { type: Number, default: 0 },
    claimNumber: String,
    claimStatus: {
      type: String,
      enum: ['Not Submitted', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Partially Approved'],
      default: 'Not Submitted'
    },
    preAuthorizationNumber: String
  },
  
  // Payment tracking
  payments: [{
    paymentId: String,
    paymentDate: Date,
    amount: Number,
    method: {
      type: String,
      enum: ['Cash', 'Card', 'UPI', 'Net Banking', 'Cheque', 'Insurance', 'Corporate']
    },
    transactionId: String,
    reference: String,
    receivedBy: String,
    notes: String,
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
      default: 'Completed'
    }
  }],
  
  // Billing workflow
  workflow: {
    generatedBy: String,
    generatedAt: Date,
    reviewedBy: String,
    reviewedAt: Date,
    approvedBy: String,
    approvedAt: Date,
    sentBy: String,
    sentAt: Date,
    paidAt: Date
  },
  
  // Additional information
  notes: String,
  internalNotes: String,
  tags: [String],
  
  // Audit trail
  auditLog: [{
    action: String,
    performedBy: String,
    timestamp: { type: Date, default: Date.now },
    details: String,
    oldValue: String,
    newValue: String
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

// Pre-save middleware to calculate totals
billSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate subtotal from all charges
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;
  
  // Calculate consultation charges
  this.charges.consultation.forEach(charge => {
    subtotal += charge.totalAmount || 0;
    totalDiscount += charge.discount || 0;
    totalTax += charge.tax || 0;
  });
  
  // Calculate laboratory charges
  this.charges.laboratory.forEach(charge => {
    subtotal += charge.totalAmount || 0;
    totalDiscount += charge.discount || 0;
    totalTax += charge.tax || 0;
  });
  
  // Calculate pharmacy charges
  this.charges.pharmacy.forEach(charge => {
    subtotal += charge.totalAmount || 0;
    totalDiscount += charge.discount || 0;
    totalTax += charge.tax || 0;
  });
  
  // Calculate procedure charges
  this.charges.procedures.forEach(charge => {
    subtotal += charge.totalAmount || 0;
    totalDiscount += charge.discount || 0;
    totalTax += charge.tax || 0;
  });
  
  // Calculate accommodation charges
  this.charges.accommodation.forEach(charge => {
    subtotal += charge.totalAmount || 0;
    totalDiscount += charge.discount || 0;
    totalTax += charge.tax || 0;
  });
  
  // Calculate miscellaneous charges
  this.charges.miscellaneous.forEach(charge => {
    subtotal += charge.totalAmount || 0;
    totalDiscount += charge.discount || 0;
    totalTax += charge.tax || 0;
  });
  
  // Update summary
  this.summary.subtotal = subtotal;
  this.summary.totalDiscount = totalDiscount;
  this.summary.totalTax = totalTax;
  this.summary.totalAmount = subtotal;
  
  // Calculate balance
  this.summary.balanceAmount = this.summary.totalAmount - this.summary.paidAmount;
  
  // Update status based on payment
  if (this.summary.paidAmount === 0) {
    if (this.status === 'Paid' || this.status === 'Partially Paid') {
      this.status = 'Generated';
    }
  } else if (this.summary.paidAmount >= this.summary.totalAmount) {
    this.status = 'Paid';
  } else {
    this.status = 'Partially Paid';
  }
  
  next();
});

// Indexes for better query performance
billSchema.index({ patientId: 1, billDate: -1 });
billSchema.index({ billId: 1 });
billSchema.index({ status: 1 });
billSchema.index({ 'insurance.provider': 1 });
billSchema.index({ billDate: -1 });

module.exports = mongoose.model('Bill', billSchema);