const mongoose = require('mongoose');

// Complaint Schema for MongoDB
const complaintSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: [true, 'Patient reference is required'],
        index: true
    },
    patientName: {
        type: String,
        required: [true, 'Patient name is required'],
        trim: true
    },
    patientPhone: {
        type: String,
        required: [true, 'Patient phone is required'],
        trim: true
    },
    complaintId: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    title: {
        type: String,
        required: [true, 'Complaint title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Complaint description is required'],
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    category: {
        type: String,
        enum: [
            'appointment_scheduling',
            'doctor_behavior',
            'staff_behavior', 
            'facility_cleanliness',
            'waiting_time',
            'billing_issues',
            'medical_care_quality',
            'prescription_issues',
            'equipment_malfunction',
            'accessibility_issues',
            'privacy_concerns',
            'communication_issues',
            'other'
        ],
        required: true,
        index: true
    },
    subcategory: {
        type: String,
        trim: true
    },
    urgency: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
        index: true
    },
    priority: {
        type: Number,
        min: 1,
        max: 5,
        default: 3,
        index: true
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'pending_patient', 'resolved', 'closed', 'escalated'],
        default: 'open',
        index: true
    },
    channel: {
        type: String,
        enum: ['web', 'telegram', 'whatsapp', 'sms', 'phone', 'email', 'in_person'],
        required: true,
        index: true
    },
    language: {
        type: String,
        enum: ['en', 'hi', 'ml', 'ta', 'te'],
        default: 'en'
    },
    assignedTo: {
        staffId: String,
        staffName: String,
        department: String,
        assignedAt: Date
    },
    attachments: [{
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        url: String,
        uploadedAt: { type: Date, default: Date.now }
    }],
    aiAnalysis: {
        sentiment: {
            type: String,
            enum: ['positive', 'neutral', 'negative', 'very_negative']
        },
        keywords: [String],
        suggestedCategory: String,
        confidenceScore: Number,
        emotionalIntensity: Number,
        urgencyScore: Number,
        similarComplaints: [String]
    },
    timeline: [{
        action: String,
        description: String,
        performedBy: {
            id: String,
            name: String,
            role: String
        },
        timestamp: { type: Date, default: Date.now },
        notes: String
    }],
    resolution: {
        summary: String,
        actionTaken: String,
        resolvedBy: {
            id: String,
            name: String,
            role: String
        },
        resolvedAt: Date,
        patientSatisfaction: {
            rating: { type: Number, min: 1, max: 5 },
            feedback: String,
            submittedAt: Date
        }
    },
    sla: {
        responseTime: Number, // in hours
        resolutionTime: Number, // in hours
        responseDeadline: Date,
        resolutionDeadline: Date,
        breached: { type: Boolean, default: false }
    },
    escalation: {
        level: { type: Number, default: 0 },
        escalatedTo: String,
        escalatedAt: Date,
        reason: String,
        autoEscalated: { type: Boolean, default: false }
    },
    relatedAppointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    },
    tags: [String],
    isAnonymous: { type: Boolean, default: false },
    followUpRequired: { type: Boolean, default: false },
    followUpDate: Date
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
complaintSchema.index({ createdAt: -1 });
complaintSchema.index({ status: 1, urgency: -1 });
complaintSchema.index({ category: 1, status: 1 });
complaintSchema.index({ 'assignedTo.staffId': 1, status: 1 });
complaintSchema.index({ 'sla.responseDeadline': 1 });
complaintSchema.index({ 'sla.resolutionDeadline': 1 });

// Pre-save middleware to generate complaintId
complaintSchema.pre('validate', function(next) {
    if (!this.complaintId) {
        this.complaintId = this.generateComplaintId();
    }
    next();
});

// Instance methods
complaintSchema.methods.generateComplaintId = function() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `CMP${year}${month}${day}${random}`;
};

complaintSchema.methods.addTimelineEntry = function(action, description, performedBy, notes = '') {
    this.timeline.push({
        action,
        description,
        performedBy,
        notes,
        timestamp: new Date()
    });
    return this.save();
};

complaintSchema.methods.assignTo = function(staffId, staffName, department) {
    this.assignedTo = {
        staffId,
        staffName,
        department,
        assignedAt: new Date()
    };
    this.status = 'in_progress';
    
    return this.addTimelineEntry(
        'assigned',
        `Complaint assigned to ${staffName} (${department})`,
        { id: 'system', name: 'System', role: 'system' }
    );
};

complaintSchema.methods.updateStatus = function(newStatus, performedBy, notes = '') {
    const oldStatus = this.status;
    this.status = newStatus;
    
    return this.addTimelineEntry(
        'status_change',
        `Status changed from ${oldStatus} to ${newStatus}`,
        performedBy,
        notes
    );
};

complaintSchema.methods.escalate = function(reason, escalatedTo, performedBy) {
    this.escalation.level += 1;
    this.escalation.escalatedTo = escalatedTo;
    this.escalation.escalatedAt = new Date();
    this.escalation.reason = reason;
    this.status = 'escalated';
    
    return this.addTimelineEntry(
        'escalated',
        `Complaint escalated to ${escalatedTo}. Reason: ${reason}`,
        performedBy
    );
};

complaintSchema.methods.resolve = function(summary, actionTaken, resolvedBy) {
    this.status = 'resolved';
    this.resolution = {
        summary,
        actionTaken,
        resolvedBy,
        resolvedAt: new Date()
    };
    
    return this.addTimelineEntry(
        'resolved',
        `Complaint resolved: ${summary}`,
        resolvedBy
    );
};

// Static methods
complaintSchema.statics.findByComplaintId = function(complaintId) {
    return this.findOne({ complaintId }).populate('patient', 'name phone uniqueId');
};

complaintSchema.statics.findByPatient = function(patientId) {
    return this.find({ patient: patientId })
        .sort({ createdAt: -1 })
        .populate('patient', 'name phone uniqueId');
};

complaintSchema.statics.getOpenComplaints = function() {
    return this.find({ status: { $in: ['open', 'in_progress', 'escalated'] } })
        .sort({ urgency: -1, createdAt: 1 })
        .populate('patient', 'name phone uniqueId');
};

complaintSchema.statics.getOverdueComplaints = function() {
    const now = new Date();
    return this.find({
        $or: [
            { 'sla.responseDeadline': { $lt: now }, status: 'open' },
            { 'sla.resolutionDeadline': { $lt: now }, status: { $in: ['open', 'in_progress'] } }
        ]
    }).populate('patient', 'name phone uniqueId');
};

complaintSchema.statics.getAnalytics = async function(startDate, endDate) {
    const pipeline = [
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: null,
                totalComplaints: { $sum: 1 },
                byCategory: {
                    $push: {
                        category: '$category',
                        urgency: '$urgency',
                        status: '$status'
                    }
                },
                avgResolutionTime: { $avg: '$sla.resolutionTime' },
                satisfactionRatings: { $push: '$resolution.patientSatisfaction.rating' }
            }
        }
    ];
    
    return this.aggregate(pipeline);
};

// Virtual for age of complaint
complaintSchema.virtual('ageInHours').get(function() {
    return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60));
});

// Virtual for SLA status
complaintSchema.virtual('slaStatus').get(function() {
    const now = new Date();
    if (this.sla.resolutionDeadline && now > this.sla.resolutionDeadline) {
        return 'overdue';
    }
    if (this.sla.responseDeadline && now > this.sla.responseDeadline && this.status === 'open') {
        return 'response_overdue';
    }
    return 'on_time';
});

module.exports = mongoose.model('Complaint', complaintSchema);