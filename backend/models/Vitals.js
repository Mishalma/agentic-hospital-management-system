const mongoose = require('mongoose');

// Vitals Schema
const vitalsSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    nurseId: {
        type: String,
        required: [true, 'Nurse ID is required'],
        trim: true
    },
    vitals: {
        bloodPressure: {
            systolic: {
                type: Number,
                min: [60, 'Systolic BP must be at least 60'],
                max: [300, 'Systolic BP cannot exceed 300']
            },
            diastolic: {
                type: Number,
                min: [30, 'Diastolic BP must be at least 30'],
                max: [200, 'Diastolic BP cannot exceed 200']
            }
        },
        heartRate: {
            type: Number,
            min: [30, 'Heart rate must be at least 30 bpm'],
            max: [250, 'Heart rate cannot exceed 250 bpm']
        },
        temperature: {
            value: {
                type: Number,
                min: [90, 'Temperature must be at least 90°F'],
                max: [110, 'Temperature cannot exceed 110°F']
            },
            unit: {
                type: String,
                enum: ['F', 'C'],
                default: 'F'
            }
        },
        respiratoryRate: {
            type: Number,
            min: [8, 'Respiratory rate must be at least 8'],
            max: [60, 'Respiratory rate cannot exceed 60']
        },
        oxygenSaturation: {
            type: Number,
            min: [70, 'Oxygen saturation must be at least 70%'],
            max: [100, 'Oxygen saturation cannot exceed 100%']
        },
        weight: {
            value: Number,
            unit: {
                type: String,
                enum: ['lbs', 'kg'],
                default: 'lbs'
            }
        },
        height: {
            value: Number,
            unit: {
                type: String,
                enum: ['in', 'cm'],
                default: 'in'
            }
        }
    },
    notes: {
        type: String,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    alerts: [{
        type: {
            type: String,
            enum: ['high_bp', 'low_bp', 'high_hr', 'low_hr', 'fever', 'low_temp', 'low_oxygen', 'critical'],
            required: true
        },
        message: String,
        severity: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium'
        }
    }],
    status: {
        type: String,
        enum: ['recorded', 'reviewed', 'flagged'],
        default: 'recorded'
    },
    syncedToEMR: {
        type: Boolean,
        default: false
    },
    emrSyncTimestamp: Date,
    deviceInfo: {
        deviceId: String,
        deviceType: {
            type: String,
            enum: ['tablet', 'mobile', 'desktop'],
            default: 'tablet'
        },
        location: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
vitalsSchema.index({ patient: 1, createdAt: -1 });
vitalsSchema.index({ nurseId: 1, createdAt: -1 });
vitalsSchema.index({ status: 1 });
vitalsSchema.index({ syncedToEMR: 1 });

// Pre-save middleware for anomaly detection
vitalsSchema.pre('save', function(next) {
    this.alerts = [];
    
    const vitals = this.vitals;
    
    // Blood pressure alerts
    if (vitals.bloodPressure && vitals.bloodPressure.systolic && vitals.bloodPressure.diastolic) {
        const sys = vitals.bloodPressure.systolic;
        const dia = vitals.bloodPressure.diastolic;
        
        if (sys >= 180 || dia >= 120) {
            this.alerts.push({
                type: 'high_bp',
                message: `Critical hypertension: ${sys}/${dia}`,
                severity: 'critical'
            });
        } else if (sys >= 140 || dia >= 90) {
            this.alerts.push({
                type: 'high_bp',
                message: `High blood pressure: ${sys}/${dia}`,
                severity: 'high'
            });
        } else if (sys < 90 || dia < 60) {
            this.alerts.push({
                type: 'low_bp',
                message: `Low blood pressure: ${sys}/${dia}`,
                severity: 'medium'
            });
        }
    }
    
    // Heart rate alerts
    if (vitals.heartRate) {
        if (vitals.heartRate > 100) {
            this.alerts.push({
                type: 'high_hr',
                message: `Tachycardia: ${vitals.heartRate} bpm`,
                severity: vitals.heartRate > 120 ? 'high' : 'medium'
            });
        } else if (vitals.heartRate < 60) {
            this.alerts.push({
                type: 'low_hr',
                message: `Bradycardia: ${vitals.heartRate} bpm`,
                severity: vitals.heartRate < 50 ? 'high' : 'medium'
            });
        }
    }
    
    // Temperature alerts
    if (vitals.temperature && vitals.temperature.value) {
        const temp = vitals.temperature.value;
        const unit = vitals.temperature.unit;
        
        // Convert to Fahrenheit for comparison
        const tempF = unit === 'C' ? (temp * 9/5) + 32 : temp;
        
        if (tempF >= 103) {
            this.alerts.push({
                type: 'fever',
                message: `High fever: ${temp}°${unit}`,
                severity: 'high'
            });
        } else if (tempF >= 100.4) {
            this.alerts.push({
                type: 'fever',
                message: `Fever: ${temp}°${unit}`,
                severity: 'medium'
            });
        } else if (tempF < 95) {
            this.alerts.push({
                type: 'low_temp',
                message: `Hypothermia: ${temp}°${unit}`,
                severity: 'high'
            });
        }
    }
    
    // Oxygen saturation alerts
    if (vitals.oxygenSaturation) {
        if (vitals.oxygenSaturation < 90) {
            this.alerts.push({
                type: 'low_oxygen',
                message: `Low oxygen saturation: ${vitals.oxygenSaturation}%`,
                severity: vitals.oxygenSaturation < 85 ? 'critical' : 'high'
            });
        }
    }
    
    next();
});

// Instance methods
vitalsSchema.methods.toPublic = function() {
    const obj = this.toObject();
    return {
        id: obj._id,
        patientId: obj.patient ? (obj.patient.uniqueId || obj.patient) : null,
        vitals: obj.vitals,
        notes: obj.notes,
        alerts: obj.alerts,
        status: obj.status,
        recordedBy: obj.nurseId,
        recordedAt: obj.createdAt,
        syncedToEMR: obj.syncedToEMR
    };
};

vitalsSchema.methods.getBMI = function() {
    const weight = this.vitals.weight;
    const height = this.vitals.height;
    
    if (!weight || !height || !weight.value || !height.value) {
        return null;
    }
    
    // Convert to metric for calculation
    let weightKg = weight.unit === 'lbs' ? weight.value * 0.453592 : weight.value;
    let heightM = height.unit === 'in' ? height.value * 0.0254 : height.value / 100;
    
    const bmi = weightKg / (heightM * heightM);
    return Math.round(bmi * 10) / 10;
};

// Static methods
vitalsSchema.statics.findByPatient = function(patientId, limit = 10) {
    // Can be either ObjectId or uniqueId string
    if (patientId && patientId.length === 24 && /^[0-9a-fA-F]{24}$/.test(patientId)) {
        // It's likely an ObjectId
        return this.find({ patient: patientId })
            .populate('patient')
            .sort({ createdAt: -1 })
            .limit(limit);
    } else {
        // It's a uniqueId, find patient first
        const Patient = require('./Patient');
        return Patient.findOne({ uniqueId: patientId })
            .then(patient => {
                if (!patient) return [];
                return this.find({ patient: patient._id })
                    .populate('patient')
                    .sort({ createdAt: -1 })
                    .limit(limit);
            });
    }
};

vitalsSchema.statics.findByNurse = function(nurseId, limit = 50) {
    return this.find({ nurseId })
        .sort({ createdAt: -1 })
        .limit(limit);
};

vitalsSchema.statics.findAbnormal = function() {
    return this.find({ 
        'alerts.0': { $exists: true },
        status: { $ne: 'reviewed' }
    }).sort({ createdAt: -1 });
};

vitalsSchema.statics.findUnsyncedToEMR = function() {
    return this.find({ syncedToEMR: false });
};

// Virtual for BMI
vitalsSchema.virtual('bmi').get(function() {
    return this.getBMI();
});

module.exports = mongoose.model('Vitals', vitalsSchema);