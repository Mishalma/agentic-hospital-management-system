const mongoose = require('mongoose');

const vitalsSchema = new mongoose.Schema({
  systolicBP: { type: Number, required: true },
  diastolicBP: { type: Number, required: true },
  heartRate: { type: Number, required: true },
  temperature: { type: Number, required: true },
  oxygenSaturation: { type: Number, required: true },
  respiratoryRate: { type: Number, required: true },
  painScale: { type: Number, min: 0, max: 10 },
  timestamp: { type: Date, default: Date.now }
});

const treatmentOrderSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true,
    enum: ['medication', 'lab', 'imaging', 'procedure', 'consultation']
  },
  description: { type: String, required: true },
  urgency: { 
    type: String, 
    required: true,
    enum: ['routine', 'urgent', 'stat']
  },
  orderedBy: { type: String, required: true },
  orderedAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    default: 'pending',
    enum: ['pending', 'in-progress', 'completed', 'cancelled']
  },
  completedBy: String,
  completedAt: Date,
  notes: String
});

const staffAssignmentSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: { type: String, required: true },
  assignedAt: { type: Date, default: Date.now }
});

const preHospitalDataSchema = new mongoose.Schema({
  ambulanceService: String,
  paramedicsReport: String,
  treatmentGiven: String,
  medications: String
});

const emergencyCaseSchema = new mongoose.Schema({
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient',
    required: true 
  },
  chiefComplaint: { type: String, required: true },
  symptoms: [String],
  vitals: vitalsSchema,
  vitalsHistory: [vitalsSchema],
  triageScore: { type: Number, min: 0, max: 20 },
  priority: { 
    type: String, 
    enum: ['Critical', 'High', 'Medium', 'Low'],
    required: true 
  },
  riskFactors: [String],
  recommendedAction: String,
  treatmentOrders: [treatmentOrderSchema],
  assignedStaff: [staffAssignmentSchema],
  arrivalTime: { type: Date, default: Date.now },
  arrivalMode: { 
    type: String, 
    enum: ['Walk-in', 'Ambulance', 'Police', 'Helicopter', 'Transfer'],
    default: 'Walk-in'
  },
  treatmentStartTime: Date,
  dischargeTime: Date,
  status: { 
    type: String, 
    enum: ['active', 'completed', 'transferred'],
    default: 'active'
  },
  disposition: String,
  dischargeNotes: String,
  followUpInstructions: String,
  satisfactionScore: { type: Number, min: 1, max: 5 },
  finalDiagnosis: String,
  preHospitalData: preHospitalDataSchema,
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for better query performance
emergencyCaseSchema.index({ status: 1, priority: 1 });
emergencyCaseSchema.index({ arrivalTime: -1 });
emergencyCaseSchema.index({ patientId: 1 });

// Update lastUpdated on save
emergencyCaseSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

const EmergencyCase = mongoose.model('EmergencyCase', emergencyCaseSchema);

module.exports = EmergencyCase;