const mongoose = require('mongoose');

// Triage Schema
const triageSchema = new mongoose.Schema({
    patientId: {
        type: String,
        required: [true, 'Patient ID is required'],
        trim: true
    },
    patientName: {
        type: String,
        required: [true, 'Patient name is required'],
        trim: true
    },
    symptoms: [{
        symptom: {
            type: String,
            required: true
        },
        severity: {
            type: String,
            enum: ['mild', 'moderate', 'severe'],
            required: true
        },
        duration: {
            type: String,
            enum: ['<1h', '1-6h', '6-24h', '>24h'],
            required: true
        }
    }],
    vitals: {
        bloodPressure: {
            systolic: Number,
            diastolic: Number
        },
        heartRate: Number,
        temperature: {
            value: Number,
            unit: {
                type: String,
                enum: ['F', 'C'],
                default: 'F'
            }
        },
        respiratoryRate: Number,
        oxygenSaturation: Number,
        painLevel: {
            type: Number,
            min: 0,
            max: 10
        }
    },
    medicalHistory: [{
        condition: String,
        severity: {
            type: String,
            enum: ['mild', 'moderate', 'severe']
        }
    }],
    riskScore: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true
    },
    triageLevel: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    assignedNurse: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'in-assessment', 'waiting-doctor', 'completed'],
        default: 'pending'
    },
    notes: {
        type: String,
        maxlength: 500
    },
    estimatedWaitTime: {
        type: Number, // minutes
        required: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
triageSchema.index({ patientId: 1 });
triageSchema.index({ priority: 1, createdAt: -1 });
triageSchema.index({ status: 1 });
triageSchema.index({ riskScore: -1 });

// Pre-save middleware for risk scoring
triageSchema.pre('save', function(next) {
    this.riskScore = this.calculateRiskScore();
    this.priority = this.determinePriority();
    this.triageLevel = this.determineTriageLevel();
    this.estimatedWaitTime = this.calculateWaitTime();
    next();
});

// Risk scoring algorithm
triageSchema.methods.calculateRiskScore = function() {
    let score = 0;
    
    // Symptom scoring
    this.symptoms.forEach(symptom => {
        const symptomScores = {
            'chest pain': { mild: 15, moderate: 25, severe: 40 },
            'difficulty breathing': { mild: 20, moderate: 30, severe: 45 },
            'severe bleeding': { mild: 25, moderate: 35, severe: 50 },
            'unconsciousness': { mild: 40, moderate: 50, severe: 60 },
            'severe headache': { mild: 10, moderate: 20, severe: 30 },
            'abdominal pain': { mild: 8, moderate: 15, severe: 25 },
            'fever': { mild: 5, moderate: 10, severe: 20 },
            'nausea': { mild: 3, moderate: 6, severe: 12 },
            'dizziness': { mild: 5, moderate: 10, severe: 18 },
            'back pain': { mild: 4, moderate: 8, severe: 15 }
        };
        
        const symptomKey = symptom.symptom.toLowerCase();
        if (symptomScores[symptomKey]) {
            score += symptomScores[symptomKey][symptom.severity] || 5;
        } else {
            // Default scoring for unlisted symptoms
            score += { mild: 3, moderate: 8, severe: 15 }[symptom.severity] || 5;
        }
        
        // Duration factor
        const durationMultiplier = {
            '<1h': 1.2,
            '1-6h': 1.0,
            '6-24h': 0.8,
            '>24h': 0.6
        };
        score *= durationMultiplier[symptom.duration] || 1.0;
    });
    
    // Vital signs scoring
    if (this.vitals) {
        // Blood pressure
        if (this.vitals.bloodPressure) {
            const sys = this.vitals.bloodPressure.systolic;
            const dia = this.vitals.bloodPressure.diastolic;
            if (sys >= 180 || dia >= 120) score += 20;
            else if (sys >= 160 || dia >= 100) score += 15;
            else if (sys < 90 || dia < 60) score += 12;
        }
        
        // Heart rate
        if (this.vitals.heartRate) {
            if (this.vitals.heartRate > 120 || this.vitals.heartRate < 50) score += 15;
            else if (this.vitals.heartRate > 100 || this.vitals.heartRate < 60) score += 8;
        }
        
        // Temperature
        if (this.vitals.temperature && this.vitals.temperature.value) {
            const temp = this.vitals.temperature.value;
            const unit = this.vitals.temperature.unit;
            const tempF = unit === 'C' ? (temp * 9/5) + 32 : temp;
            
            if (tempF >= 103) score += 15;
            else if (tempF >= 101) score += 10;
            else if (tempF < 95) score += 12;
        }
        
        // Oxygen saturation
        if (this.vitals.oxygenSaturation) {
            if (this.vitals.oxygenSaturation < 90) score += 20;
            else if (this.vitals.oxygenSaturation < 95) score += 10;
        }
        
        // Pain level
        if (this.vitals.painLevel) {
            if (this.vitals.painLevel >= 8) score += 15;
            else if (this.vitals.painLevel >= 6) score += 10;
            else if (this.vitals.painLevel >= 4) score += 5;
        }
    }
    
    // Medical history factor
    this.medicalHistory.forEach(condition => {
        const historyScores = { mild: 2, moderate: 5, severe: 10 };
        score += historyScores[condition.severity] || 3;
    });
    
    return Math.min(Math.round(score), 100);
};

// Determine priority based on risk score
triageSchema.methods.determinePriority = function() {
    if (this.riskScore >= 70) return 'critical';
    if (this.riskScore >= 50) return 'high';
    if (this.riskScore >= 25) return 'medium';
    return 'low';
};

// Determine triage level (1 = most urgent, 5 = least urgent)
triageSchema.methods.determineTriageLevel = function() {
    if (this.riskScore >= 70) return 1; // Immediate
    if (this.riskScore >= 50) return 2; // Urgent
    if (this.riskScore >= 25) return 3; // Less urgent
    if (this.riskScore >= 10) return 4; // Non-urgent
    return 5; // Routine
};

// Calculate estimated wait time
triageSchema.methods.calculateWaitTime = function() {
    const baseWaitTimes = {
        1: 0,    // Immediate
        2: 15,   // Urgent - 15 minutes
        3: 60,   // Less urgent - 1 hour
        4: 120,  // Non-urgent - 2 hours
        5: 240   // Routine - 4 hours
    };
    
    return baseWaitTimes[this.triageLevel] || 60;
};

// Instance methods
triageSchema.methods.toPublic = function() {
    const obj = this.toObject();
    return {
        id: obj._id,
        patientId: obj.patientId,
        patientName: obj.patientName,
        symptoms: obj.symptoms,
        vitals: obj.vitals,
        riskScore: obj.riskScore,
        priority: obj.priority,
        triageLevel: obj.triageLevel,
        status: obj.status,
        estimatedWaitTime: obj.estimatedWaitTime,
        assignedNurse: obj.assignedNurse,
        notes: obj.notes,
        createdAt: obj.createdAt
    };
};

// Static methods
triageSchema.statics.getTriageQueue = function() {
    return this.find({ status: { $ne: 'completed' } })
        .sort({ triageLevel: 1, riskScore: -1, createdAt: 1 });
};

triageSchema.statics.getByPriority = function(priority) {
    return this.find({ priority, status: { $ne: 'completed' } })
        .sort({ riskScore: -1, createdAt: 1 });
};

module.exports = mongoose.model('Triage', triageSchema);