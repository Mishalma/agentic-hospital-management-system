const mongoose = require('mongoose');

const bedSchema = new mongoose.Schema({
  bedId: {
    type: String,
    required: true,
    unique: true,
    default: () => `BED-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  bedNumber: {
    type: String,
    required: true,
    unique: true
  },
  ward: {
    wardId: String,
    wardName: {
      type: String,
      required: true
    },
    floor: {
      type: Number,
      required: true
    },
    wing: String,
    department: String
  },
  bedType: {
    type: String,
    required: true,
    enum: ['General', 'Private', 'Semi-Private', 'ICU', 'NICU', 'CCU', 'Emergency', 'Isolation', 'Maternity', 'Pediatric']
  },
  category: {
    type: String,
    required: true,
    enum: ['Standard', 'Deluxe', 'Super Deluxe', 'Suite', 'Economy']
  },
  status: {
    type: String,
    enum: ['Available', 'Occupied', 'Reserved', 'Maintenance', 'Cleaning', 'Out of Service'],
    default: 'Available'
  },
  
  // Physical bed details
  specifications: {
    hasOxygen: { type: Boolean, default: false },
    hasVentilator: { type: Boolean, default: false },
    hasMonitor: { type: Boolean, default: false },
    hasPrivateBathroom: { type: Boolean, default: false },
    hasAC: { type: Boolean, default: false },
    hasTV: { type: Boolean, default: false },
    hasWiFi: { type: Boolean, default: false },
    hasRefrigerator: { type: Boolean, default: false },
    maxOccupancy: { type: Number, default: 1 },
    wheelchairAccessible: { type: Boolean, default: true }
  },
  
  // Pricing information
  pricing: {
    baseRate: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    billingUnit: {
      type: String,
      enum: ['per day', 'per hour', 'per stay'],
      default: 'per day'
    },
    additionalCharges: [{
      service: String,
      rate: Number,
      unit: String
    }]
  },
  
  // Current occupancy
  currentOccupancy: {
    patientId: String,
    patientName: String,
    admissionId: String,
    admittedAt: Date,
    expectedDischarge: Date,
    attendingDoctor: String,
    emergencyContact: String,
    specialRequirements: [String]
  },
  
  // Reservation details
  reservation: {
    patientId: String,
    patientName: String,
    reservedBy: String,
    reservedAt: Date,
    reservedUntil: Date,
    purpose: String,
    notes: String
  },
  
  // Maintenance and cleaning
  maintenance: {
    lastCleaned: Date,
    cleanedBy: String,
    lastMaintenance: Date,
    maintenanceBy: String,
    nextScheduledMaintenance: Date,
    maintenanceNotes: String,
    equipmentStatus: [{
      equipment: String,
      status: {
        type: String,
        enum: ['Working', 'Faulty', 'Under Repair', 'Replaced']
      },
      lastChecked: Date,
      notes: String
    }]
  },
  
  // Location coordinates for digital mapping
  location: {
    coordinates: {
      x: Number,
      y: Number,
      z: Number // floor level
    },
    mapSection: String,
    nearbyLandmarks: [String],
    accessInstructions: String
  },
  
  // Bed history and analytics
  analytics: {
    totalOccupancyDays: { type: Number, default: 0 },
    averageStayDuration: { type: Number, default: 0 },
    occupancyRate: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    lastOccupiedDate: Date,
    maintenanceFrequency: { type: Number, default: 0 }
  },
  
  // AI-powered insights
  aiInsights: {
    predictedAvailability: Date,
    recommendedMaintenance: Date,
    utilizationScore: { type: Number, min: 0, max: 100 },
    patientSatisfactionScore: { type: Number, min: 0, max: 5 },
    optimalPricing: Number,
    demandForecast: [{
      date: Date,
      predictedDemand: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical']
      },
      confidence: Number
    }]
  },
  
  isActive: {
    type: Boolean,
    default: true
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
bedSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for better query performance
bedSchema.index({ bedNumber: 1 });
bedSchema.index({ 'ward.wardName': 1, 'ward.floor': 1 });
bedSchema.index({ bedType: 1, status: 1 });
bedSchema.index({ status: 1 });

module.exports = mongoose.model('Bed', bedSchema);