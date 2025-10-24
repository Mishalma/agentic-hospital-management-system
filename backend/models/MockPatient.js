// Mock Patient model for demo mode when MongoDB is not available
class MockPatient {
    constructor(data) {
        this.id = data.id || this.generateId();
        this._id = this.id; // For compatibility
        this.name = data.name;
        this.dob = data.dob;
        this.phone = data.phone;
        this.email = data.email;
        this.gender = data.gender;
        this.uniqueId = data.uniqueId || this.generateUniqueId();
        this.insurance = data.insurance;
        this.emergencyContact = data.emergencyContact;
        this.medicalHistory = data.medicalHistory || [];
        this.channel = data.channel || 'web';
        this.language = data.language || 'en';
        this.whatsappNumber = data.whatsappNumber;
        this.telegramChatId = data.telegramChatId;
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    get age() {
        if (!this.dob) return null;
        const today = new Date();
        const birthDate = new Date(this.dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    }

    generateId() {
        return 'mock_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateUniqueId() {
        const year = new Date().getFullYear();
        const random = Math.floor(100000 + Math.random() * 900000);
        return `PT${year}${random}`;
    }

    static storage = new Map();
    static initialized = false;

    static async create(patientData) {
        // Initialize with sample data if this is the first patient
        if (!this.initialized) {
            this.initializeSampleData();
            this.initialized = true;
        }
        
        const patient = new MockPatient(patientData);
        this.storage.set(patient.id, patient);
        console.log(`📝 Mock: Created patient ${patient.name} (${patient.uniqueId})`);
        return patient;
    }

    static initializeSampleData() {
        const samplePatients = [
            {
                id: 'sample_patient_1',
                uniqueId: 'PT2024123456',
                name: 'John Smith',
                dob: '1985-03-15',
                phone: '+1234567890',
                email: 'john.smith@email.com',
                gender: 'male',
                channel: 'web'
            },
            {
                id: 'sample_patient_2',
                uniqueId: 'PT2024789012',
                name: 'Emily Davis',
                dob: '1990-07-22',
                phone: '+1987654321',
                email: 'emily.davis@email.com',
                gender: 'female',
                channel: 'whatsapp'
            },
            {
                id: 'sample_patient_3',
                uniqueId: 'PT2024345678',
                name: 'Robert Wilson',
                dob: '2018-11-08',
                phone: '+1555123456',
                email: 'robert.wilson@email.com',
                gender: 'male',
                channel: 'kiosk'
            },
            {
                id: 'sample_patient_4',
                uniqueId: 'PT2024567890',
                name: 'Maria Garcia',
                dob: '1988-12-03',
                phone: '+1444987654',
                email: 'maria.garcia@email.com',
                gender: 'female',
                channel: 'web'
            }
        ];

        samplePatients.forEach(data => {
            const patient = new MockPatient(data);
            this.storage.set(patient.id, patient);
        });

        console.log('📝 Mock: Initialized with sample patient data');
    }

    static async findById(id) {
        return this.storage.get(id) || null;
    }

    static async findByUniqueId(uniqueId) {
        // Initialize sample data if not already done
        if (!this.initialized) {
            this.initializeSampleData();
            this.initialized = true;
        }
        
        console.log(`[MOCK PATIENT] Looking for uniqueId: ${uniqueId}`);
        console.log(`[MOCK PATIENT] Available patients:`, Array.from(this.storage.values()).map(p => `${p.name} (${p.uniqueId})`));
        
        for (const patient of this.storage.values()) {
            if (patient.uniqueId === uniqueId) {
                console.log(`[MOCK PATIENT] Found patient: ${patient.name}`);
                return patient;
            }
        }
        console.log(`[MOCK PATIENT] Patient not found with uniqueId: ${uniqueId}`);
        return null;
    }

    static async findByPhone(phone) {
        for (const patient of this.storage.values()) {
            if (patient.phone === phone) {
                return patient;
            }
        }
        return null;
    }

    static async findByPhoneFlexible(phone) {
        // Try exact match first
        let patient = await this.findByPhone(phone);
        if (patient) return patient;

        // Generate alternative formats
        const phoneFormats = [
            phone.replace(/[^\d+]/g, ''), // Remove all non-digits except +
            phone.replace(/[^\d]/g, ''), // Remove all non-digits
            '+91' + phone.replace(/^\+?91?/, ''), // Add +91 prefix
            phone.replace(/^\+91/, ''), // Remove +91 prefix
            phone.replace(/^\+/, ''), // Remove + prefix
        ];

        // Try each format
        for (const format of phoneFormats) {
            if (format && format !== phone) {
                patient = await this.findByPhone(format);
                if (patient) return patient;
            }
        }

        return null;
    }

    async save() {
        this.updatedAt = new Date();
        MockPatient.storage.set(this.id, this);
        return this;
    }

    async update(data) {
        Object.assign(this, data);
        return this.save();
    }

    toObject() {
        return {
            id: this.id,
            _id: this._id,
            name: this.name,
            dob: this.dob,
            phone: this.phone,
            email: this.email,
            uniqueId: this.uniqueId,
            insurance: this.insurance,
            emergencyContact: this.emergencyContact,
            medicalHistory: this.medicalHistory,
            channel: this.channel,
            language: this.language,
            whatsappNumber: this.whatsappNumber,
            telegramChatId: this.telegramChatId,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    toPublic() {
        return {
            id: this.id,
            name: this.name,
            uniqueId: this.uniqueId,
            phone: this.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'), // Mask phone
            createdAt: this.createdAt
        };
    }
}

module.exports = MockPatient;