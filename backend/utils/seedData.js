const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const moment = require('moment');

async function seedDatabase() {
    try {
        console.log('🌱 Seeding MongoDB database with demo data...');

        // Check if data already exists
        const existingPatients = await Patient.countDocuments();
        if (existingPatients > 0) {
            console.log('📊 Database already has data, skipping seed...');
            return;
        }

        // Create demo patients with multilingual support
        const patients = [
            {
                name: 'John Doe',
                dob: new Date('1985-06-15'),
                phone: '+919876543210',
                email: 'john.doe@email.com',
                channel: 'web',
                language: 'en',
                insurance: {
                    provider: 'Health Plus',
                    policyNumber: 'HP123456789',
                    groupNumber: 'GRP001'
                },
                emergencyContact: {
                    name: 'Jane Doe',
                    phone: '+919876543220',
                    relationship: 'Spouse'
                }
            },
            {
                name: 'Jane Smith',
                dob: new Date('1990-03-22'),
                phone: '+919876543211',
                email: 'jane.smith@email.com',
                channel: 'kiosk',
                language: 'en',
                medicalHistory: [
                    {
                        condition: 'Hypertension',
                        diagnosedDate: new Date('2020-01-15'),
                        status: 'chronic'
                    }
                ]
            },
            {
                name: 'राज पटेल',
                dob: new Date('1978-11-08'),
                phone: '+919876543212',
                email: 'raj.patel@email.com',
                channel: 'whatsapp',
                language: 'hi',
                whatsappNumber: '+919876543212'
            },
            {
                name: 'രാജേഷ് കുമാർ',
                dob: new Date('1982-09-14'),
                phone: '+919778393574',
                email: 'rajesh.kumar@email.com',
                channel: 'telegram',
                language: 'ml',
                telegramChatId: '123456789'
            },
            {
                name: 'கமலா சுந்தர்',
                dob: new Date('1975-12-03'),
                phone: '+919876543214',
                email: 'kamala.sundar@email.com',
                channel: 'web',
                language: 'ta'
            },
            {
                name: 'రవి కుమార్',
                dob: new Date('1988-07-20'),
                phone: '+919876543215',
                email: 'ravi.kumar@email.com',
                channel: 'telegram',
                language: 'te'
            }
        ];

        const createdPatients = [];
        for (const patientData of patients) {
            const patient = new Patient(patientData);
            await patient.save();
            createdPatients.push(patient);
            console.log(`✅ Created patient: ${patient.name} (${patient.uniqueId})`);
        }

        // Create demo appointments
        const appointments = [
            {
                patient: createdPatients[0]._id,
                patientName: createdPatients[0].name,
                doctor: 'Dr. Sarah Johnson',
                department: 'General Medicine',
                slot: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
                symptoms: 'Fever and headache for 2 days. Patient reports temperature of 101°F.',
                urgency: 'medium',
                channel: 'web',
                estimatedDuration: 30
            },
            {
                patient: createdPatients[1]._id,
                patientName: createdPatients[1].name,
                doctor: 'Dr. Michael Chen',
                department: 'Cardiology',
                slot: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
                symptoms: 'Chest pain and shortness of breath. History of hypertension.',
                urgency: 'high',
                channel: 'kiosk',
                estimatedDuration: 45
            },
            {
                patient: createdPatients[2]._id,
                patientName: createdPatients[2].name,
                doctor: 'Dr. Emily Rodriguez',
                department: 'Pediatrics',
                slot: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
                symptoms: 'बच्चे को बुखार और खांसी है। 3 दिन से परेशानी।',
                urgency: 'medium',
                channel: 'whatsapp',
                estimatedDuration: 25
            },
            {
                patient: createdPatients[3]._id,
                patientName: createdPatients[3].name,
                doctor: 'Dr. David Kim',
                department: 'Orthopedics',
                slot: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
                symptoms: 'കാൽമുട്ടിൽ വേദന. ഒരാഴ്ചയായി നടക്കാൻ ബുദ്ധിമുട്ട്.',
                urgency: 'low',
                channel: 'telegram',
                estimatedDuration: 40
            },
            {
                patient: createdPatients[4]._id,
                patientName: createdPatients[4].name,
                doctor: 'Dr. Sarah Johnson',
                department: 'General Medicine',
                slot: new Date(Date.now() + 10 * 60 * 60 * 1000), // 10 hours from now
                symptoms: 'வயிற்று வலி மற்றும் குமட்டல். இரண்டு நாட்களாக உணவு சாப்பிட முடியவில்லை.',
                urgency: 'medium',
                channel: 'web',
                estimatedDuration: 30
            },
            {
                patient: createdPatients[5]._id,
                patientName: createdPatients[5].name,
                doctor: 'Dr. Michael Chen',
                department: 'Cardiology',
                slot: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
                symptoms: 'గుండె దడ మరియు ఊపిరి ఆడకపోవడం. రాత్రి నిద్రలేకపోవడం.',
                urgency: 'high',
                channel: 'telegram',
                estimatedDuration: 50
            }
        ];

        for (const appointmentData of appointments) {
            const appointment = new Appointment(appointmentData);
            await appointment.save();
            console.log(`✅ Created appointment: ${appointment.token} for ${appointment.patientName}`);
        }

        console.log('🎉 MongoDB database seeded successfully!');
        console.log(`📊 Created ${createdPatients.length} patients and ${appointments.length} appointments`);
        
        // Display demo patient IDs for testing
        console.log('\n📋 Demo Patient IDs for testing:');
        createdPatients.forEach(patient => {
            console.log(`   ${patient.uniqueId} - ${patient.name} (${patient.language})`);
        });
        
    } catch (error) {
        console.error('❌ Error seeding MongoDB database:', error);
        throw error;
    }
}

async function clearDatabase() {
    try {
        console.log('🧹 Clearing database...');
        
        await Appointment.deleteMany({});
        await Patient.deleteMany({});
        
        console.log('✅ Database cleared successfully!');
    } catch (error) {
        console.error('❌ Error clearing database:', error);
        throw error;
    }
}

module.exports = { seedDatabase, clearDatabase };