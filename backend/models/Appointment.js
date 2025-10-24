const mongoose = require('mongoose');
const moment = require('moment');

// Appointment Schema
const appointmentSchema = new mongoose.Schema({
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
    doctor: {
        type: String,
        required: [true, 'Doctor name is required'],
        trim: true,
        index: true
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        enum: ['General Medicine', 'Cardiology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Neurology', 'Emergency'],
        index: true
    },
    slot: {
        type: Date,
        required: [true, 'Appointment slot is required'],
        index: true,
        validate: {
            validator: function(value) {
                return value > new Date();
            },
            message: 'Appointment slot must be in the future'
        }
    },
    symptoms: {
        type: String,
        required: [true, 'Symptoms description is required'],
        trim: true,
        maxlength: [1000, 'Symptoms description cannot exceed 1000 characters']
    },
    urgency: {
        type: String,
        enum: ['low', 'medium', 'high', 'emergency'],
        default: 'low',
        index: true
    },
    status: {
        type: String,
        enum: ['booked', 'confirmed', 'queued', 'in-progress', 'completed', 'canceled', 'no-show'],
        default: 'booked',
        index: true
    },
    token: {
        type: String,
        unique: true,
        required: true
    },
    channel: {
        type: String,
        enum: ['web', 'kiosk', 'whatsapp', 'telegram', 'sms', 'voice'],
        default: 'web',
        index: true
    },
    room: {
        type: String,
        trim: true
    },
    estimatedDuration: {
        type: Number,
        default: 30,
        min: [15, 'Minimum appointment duration is 15 minutes'],
        max: [180, 'Maximum appointment duration is 180 minutes']
    },
    actualStartTime: Date,
    actualEndTime: Date,
    notes: {
        type: String,
        maxlength: [2000, 'Notes cannot exceed 2000 characters']
    },
    prescription: {
        medications: [{
            name: String,
            dosage: String,
            frequency: String,
            duration: String,
            instructions: String
        }],
        tests: [{
            name: String,
            instructions: String,
            urgent: { type: Boolean, default: false }
        }],
        followUp: {
            required: { type: Boolean, default: false },
            date: Date,
            notes: String
        }
    },
    billing: {
        consultationFee: { type: Number, default: 0 },
        additionalCharges: [{
            description: String,
            amount: Number
        }],
        totalAmount: { type: Number, default: 0 },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'partially-paid', 'refunded'],
            default: 'pending'
        },
        paymentMethod: String,
        transactionId: String
    },
    feedback: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comments: String,
        submittedAt: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Compound indexes for better query performance
appointmentSchema.index({ patient: 1, slot: -1 });
appointmentSchema.index({ doctor: 1, slot: 1 });
appointmentSchema.index({ status: 1, slot: 1 });
appointmentSchema.index({ department: 1, slot: 1 });
appointmentSchema.index({ token: 1 });
appointmentSchema.index({ createdAt: -1 });

// Pre-validate middleware to generate token
appointmentSchema.pre('validate', function(next) {
    if (!this.token) {
        this.token = this.generateToken();
    }
    next();
});

// Instance methods
appointmentSchema.methods.generateToken = function() {
    const date = moment().format('MMDD');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `Q${date}${random}`;
};

appointmentSchema.methods.calculateETA = async function() {
    // Calculate ETA based on queue position and average duration
    const queuePosition = await this.getQueuePosition();
    const avgDuration = this.estimatedDuration || 30;
    return queuePosition * avgDuration;
};

appointmentSchema.methods.getQueuePosition = async function() {
    const count = await this.constructor.countDocuments({
        doctor: this.doctor,
        slot: { $lt: this.slot },
        status: { $in: ['booked', 'confirmed', 'queued'] },
        createdAt: { $lt: this.createdAt }
    });
    return count + 1;
};

appointmentSchema.methods.updateStatus = function(status, notes = '') {
    this.status = status;
    if (notes) this.notes = notes;
    
    // Set actual times based on status
    if (status === 'in-progress' && !this.actualStartTime) {
        this.actualStartTime = new Date();
    } else if (status === 'completed' && !this.actualEndTime) {
        this.actualEndTime = new Date();
    }
    
    return this.save();
};

appointmentSchema.methods.toPublic = function() {
    const obj = this.toObject();
    return {
        id: obj._id,
        patientName: obj.patientName,
        doctor: obj.doctor,
        department: obj.department,
        slot: obj.slot,
        urgency: obj.urgency,
        status: obj.status,
        token: obj.token,
        room: obj.room,
        estimatedDuration: obj.estimatedDuration,
        createdAt: obj.createdAt,
        channel: obj.channel
    };
};

// Static methods
appointmentSchema.statics.findByToken = function(token) {
    return this.findOne({ token: token }).populate('patient', 'name phone uniqueId');
};

appointmentSchema.statics.findByPatient = function(patientId, status = null) {
    let query = { patient: patientId };
    if (status) {
        query.status = status;
    }
    return this.find(query).sort({ slot: -1 }).populate('patient', 'name phone uniqueId');
};

appointmentSchema.statics.findByDoctor = function(doctor, date = null) {
    let query = { doctor: doctor };
    
    if (date) {
        const startOfDay = moment(date).startOf('day').toDate();
        const endOfDay = moment(date).endOf('day').toDate();
        query.slot = { $gte: startOfDay, $lte: endOfDay };
    }
    
    return this.find(query).sort({ slot: 1 }).populate('patient', 'name phone uniqueId');
};

appointmentSchema.statics.getTodaysQueue = function() {
    const today = moment().startOf('day').toDate();
    const tomorrow = moment().add(1, 'day').startOf('day').toDate();
    
    return this.find({
        slot: { $gte: today, $lt: tomorrow },
        status: { $in: ['booked', 'confirmed', 'queued', 'in-progress'] }
    })
    .sort({ urgency: -1, slot: 1 })
    .populate('patient', 'name phone uniqueId');
};

appointmentSchema.statics.getUpcomingAppointments = function(hours = 24) {
    const now = new Date();
    const future = moment().add(hours, 'hours').toDate();
    
    return this.find({
        slot: { $gte: now, $lte: future },
        status: { $in: ['booked', 'confirmed'] }
    })
    .sort({ slot: 1 })
    .populate('patient', 'name phone uniqueId language preferences');
};

// Virtual for duration calculation
appointmentSchema.virtual('actualDuration').get(function() {
    if (this.actualStartTime && this.actualEndTime) {
        return Math.round((this.actualEndTime - this.actualStartTime) / (1000 * 60)); // in minutes
    }
    return null;
});

// Virtual for appointment date formatting
appointmentSchema.virtual('formattedSlot').get(function() {
    return moment(this.slot).format('YYYY-MM-DD HH:mm');
});

module.exports = mongoose.model('Appointment', appointmentSchema);