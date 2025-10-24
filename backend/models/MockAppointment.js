// Mock Appointment model for demo mode when MongoDB is not available
const moment = require('moment');

class MockAppointment {
    constructor(data) {
        this.id = data.id || this.generateId();
        this._id = this.id; // For compatibility
        this.patient = data.patient;
        this.patientName = data.patientName;
        this.doctor = data.doctor;
        this.department = data.department;
        this.slot = data.slot;
        this.symptoms = data.symptoms;
        this.urgency = data.urgency || 'low';
        this.status = data.status || 'booked';
        this.token = data.token || this.generateToken();
        this.channel = data.channel || 'web';
        this.room = data.room;
        this.estimatedDuration = data.estimatedDuration || 30;
        this.notes = data.notes || '';
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    generateId() {
        return 'mock_apt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateToken() {
        const date = moment().format('MMDD');
        const random = Math.floor(1000 + Math.random() * 9000);
        return `Q${date}${random}`;
    }

    static storage = new Map();
    static initialized = false;

    static async create(appointmentData) {
        // Initialize with sample data if this is the first appointment
        if (!this.initialized) {
            this.initializeSampleData();
            this.initialized = true;
        }
        
        const appointment = new MockAppointment(appointmentData);
        this.storage.set(appointment.id, appointment);
        console.log(`📝 Mock: Created appointment ${appointment.token} for ${appointment.patientName}`);
        return appointment;
    }

    static initializeSampleData() {
        const sampleAppointments = [
            {
                id: 'sample_1',
                patient: 'PT2024123456',
                patientName: 'John Smith',
                doctor: 'Dr. Sarah Johnson',
                department: 'General Medicine',
                slot: moment().add(1, 'hour').toDate(),
                symptoms: 'Regular checkup and blood pressure monitoring. Patient reports mild headaches.',
                urgency: 'normal',
                status: 'booked',
                channel: 'web',
                token: 'Q1201001'
            },
            {
                id: 'sample_2',
                patient: 'PT2024789012',
                patientName: 'Emily Davis',
                doctor: 'Dr. Michael Chen',
                department: 'Cardiology',
                slot: moment().add(30, 'minutes').toDate(),
                symptoms: 'Chest pain and shortness of breath during exercise. Follow-up consultation.',
                urgency: 'high',
                status: 'queued',
                channel: 'whatsapp',
                token: 'Q1201002'
            },
            {
                id: 'sample_3',
                patient: 'PT2024345678',
                patientName: 'Robert Wilson',
                doctor: 'Dr. Emily Rodriguez',
                department: 'Pediatrics',
                slot: moment().add(2, 'hours').toDate(),
                symptoms: 'Child vaccination and routine health checkup.',
                urgency: 'normal',
                status: 'booked',
                channel: 'kiosk',
                token: 'Q1201003'
            },
            {
                id: 'sample_4',
                patient: 'PT2024567890',
                patientName: 'Maria Garcia',
                doctor: 'Dr. David Kim',
                department: 'Orthopedics',
                slot: moment().add(15, 'minutes').toDate(),
                symptoms: 'Knee pain after sports injury. X-ray results review.',
                urgency: 'medium',
                status: 'in-progress',
                channel: 'web',
                token: 'Q1201004',
                room: 'Room 101'
            }
        ];

        sampleAppointments.forEach(data => {
            const appointment = new MockAppointment(data);
            this.storage.set(appointment.id, appointment);
        });

        console.log('📝 Mock: Initialized with sample appointment data');
    }

    static async findById(id) {
        return this.storage.get(id) || null;
    }

    static async findByToken(token) {
        for (const appointment of this.storage.values()) {
            if (appointment.token === token) {
                return appointment;
            }
        }
        return null;
    }

    static async findByPatient(patientId, status = null) {
        const appointments = [];
        for (const appointment of this.storage.values()) {
            if (appointment.patient === patientId || appointment.patient === patientId) {
                if (!status || appointment.status === status) {
                    appointments.push(appointment);
                }
            }
        }
        return appointments.sort((a, b) => new Date(b.slot) - new Date(a.slot));
    }

    static async findByDoctor(doctor, date = null) {
        const appointments = [];
        for (const appointment of this.storage.values()) {
            if (appointment.doctor === doctor) {
                if (!date || moment(appointment.slot).isSame(date, 'day')) {
                    appointments.push(appointment);
                }
            }
        }
        return appointments.sort((a, b) => new Date(a.slot) - new Date(b.slot));
    }

    static async getTodaysQueue() {
        const today = moment().startOf('day');
        const tomorrow = moment().add(1, 'day').startOf('day');
        
        const appointments = [];
        for (const appointment of this.storage.values()) {
            const appointmentDate = moment(appointment.slot);
            if (appointmentDate.isBetween(today, tomorrow) && 
                ['booked', 'queued', 'in-progress'].includes(appointment.status)) {
                appointments.push(appointment);
            }
        }
        
        return appointments.sort((a, b) => {
            // Sort by urgency first, then by slot time
            const urgencyOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            const urgencyDiff = (urgencyOrder[b.urgency] || 1) - (urgencyOrder[a.urgency] || 1);
            if (urgencyDiff !== 0) return urgencyDiff;
            return new Date(a.slot) - new Date(b.slot);
        });
    }

    async save() {
        this.updatedAt = new Date();
        MockAppointment.storage.set(this.id, this);
        return this;
    }

    async updateStatus(status, notes = '') {
        this.status = status;
        if (notes) this.notes = notes;
        return this.save();
    }

    calculateETA() {
        const avgDuration = 30;
        const queuePosition = this.getQueuePosition();
        return queuePosition * avgDuration;
    }

    getQueuePosition() {
        return Math.floor(Math.random() * 10) + 1;
    }

    toObject() {
        return {
            id: this.id,
            _id: this._id,
            patient: this.patient,
            patientName: this.patientName,
            doctor: this.doctor,
            department: this.department,
            slot: this.slot,
            symptoms: this.symptoms,
            urgency: this.urgency,
            status: this.status,
            token: this.token,
            channel: this.channel,
            room: this.room,
            estimatedDuration: this.estimatedDuration,
            notes: this.notes,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    toPublic() {
        return {
            id: this.id,
            patientId: this.patient,
            patientName: this.patientName,
            doctor: this.doctor,
            department: this.department,
            slot: this.slot,
            symptoms: this.symptoms,
            urgency: this.urgency,
            status: this.status,
            token: this.token,
            channel: this.channel,
            room: this.room,
            notes: this.notes,
            eta: this.calculateETA(),
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = MockAppointment;