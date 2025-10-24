// Test script for Integrated Booking API
const express = require('express');
const request = require('supertest');

// Mock app setup for testing
const app = express();
app.use(express.json());

// Import the appointments router
const appointmentsRouter = require('./routes/appointments');
app.use('/api/appointments', appointmentsRouter);

// Mock io for socket emissions
app.set('io', {
  to: () => ({
    emit: (event, data) => console.log(`Socket emit: ${event}`, data)
  })
});

async function testIntegratedBooking() {
    console.log('🧪 Testing Integrated Booking API...\n');

    const testBookingData = {
        patient: {
            name: 'John Doe',
            phone: '+1234567890',
            email: 'john.doe@example.com',
            dob: '1990-01-15',
            gender: 'male',
            address: '123 Main St, City, State',
            emergencyContact: '+1987654321'
        },
        appointment: {
            department: 'general',
            doctor: 'dr-johnson',
            date: '2024-12-01',
            time: '10:00 AM',
            symptoms: 'Regular checkup and consultation',
            urgency: 'normal'
        }
    };

    try {
        console.log('Sending integrated booking request...');
        console.log('Patient:', testBookingData.patient.name);
        console.log('Doctor:', testBookingData.appointment.doctor);
        console.log('Date/Time:', testBookingData.appointment.date, testBookingData.appointment.time);

        const response = await request(app)
            .post('/api/appointments/book-integrated')
            .send(testBookingData)
            .expect('Content-Type', /json/);

        console.log('\nResponse Status:', response.status);
        console.log('Response Body:', JSON.stringify(response.body, null, 2));

        if (response.body.success) {
            console.log('\n✅ Integrated booking test PASSED!');
            console.log('Patient ID:', response.body.data.patient.uniqueId || response.body.data.patient.id);
            console.log('Appointment Token:', response.body.data.appointment.token || response.body.data.appointment.id);
        } else {
            console.log('\n❌ Integrated booking test FAILED!');
            console.log('Error:', response.body.message);
        }

    } catch (error) {
        console.error('\n❌ Test failed with error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response body:', error.response.body);
        }
    }
}

// Run the test
testIntegratedBooking();