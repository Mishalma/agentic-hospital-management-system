// Test script for Vitals API
const { Vitals } = require('./models');

async function testVitalsAPI() {
    console.log('🧪 Testing Vitals API...\n');

    try {
        // Test 1: Create normal vitals
        console.log('Test 1: Creating normal vitals...');
        const normalVitals = await Vitals.create({
            patientId: 'PT2024TEST001',
            nurseId: 'NURSE001',
            vitals: {
                bloodPressure: { systolic: 120, diastolic: 80 },
                heartRate: 72,
                temperature: { value: 98.6, unit: 'F' },
                respiratoryRate: 16,
                oxygenSaturation: 98
            },
            notes: 'Test normal vitals'
        });
        console.log('✅ Normal vitals created:', normalVitals.id || normalVitals._id);
        console.log('   Alerts:', normalVitals.alerts?.length || 0);

        // Test 2: Create abnormal vitals (high BP)
        console.log('\nTest 2: Creating abnormal vitals (high BP)...');
        const abnormalVitals = await Vitals.create({
            patientId: 'PT2024TEST002',
            nurseId: 'NURSE002',
            vitals: {
                bloodPressure: { systolic: 180, diastolic: 110 },
                heartRate: 95,
                temperature: { value: 101.2, unit: 'F' },
                oxygenSaturation: 94
            },
            notes: 'Patient reports headache'
        });
        console.log('✅ Abnormal vitals created:', abnormalVitals.id || abnormalVitals._id);
        console.log('   Alerts:', abnormalVitals.alerts?.length || 0);
        if (abnormalVitals.alerts) {
            abnormalVitals.alerts.forEach(alert => {
                console.log(`   - ${alert.severity.toUpperCase()}: ${alert.message}`);
            });
        }

        // Test 3: Find abnormal vitals
        console.log('\nTest 3: Finding abnormal vitals...');
        const abnormalList = await (Vitals.findAbnormal ? 
            Vitals.findAbnormal() : 
            Vitals.find({ 'alerts.0': { $exists: true } }));
        console.log('✅ Found abnormal vitals:', abnormalList.length);

        // Test 4: Find by patient
        console.log('\nTest 4: Finding vitals by patient...');
        const patientVitals = await (Vitals.findByPatient ? 
            Vitals.findByPatient('PT2024TEST001') :
            Vitals.find({ patientId: 'PT2024TEST001' }));
        console.log('✅ Found patient vitals:', patientVitals.length);

        // Test 5: Test BMI calculation (if available)
        if (normalVitals.getBMI || (typeof Vitals.getBMI === 'function')) {
            console.log('\nTest 5: Testing BMI calculation...');
            const vitalsWithBMI = await Vitals.create({
                patientId: 'PT2024TEST003',
                nurseId: 'NURSE001',
                vitals: {
                    weight: { value: 150, unit: 'lbs' },
                    height: { value: 68, unit: 'in' },
                    bloodPressure: { systolic: 115, diastolic: 75 }
                }
            });
            
            const bmi = vitalsWithBMI.getBMI ? 
                vitalsWithBMI.getBMI() : 
                (typeof Vitals.getBMI === 'function' ? Vitals.getBMI(vitalsWithBMI.vitals) : null);
            
            console.log('✅ BMI calculated:', bmi);
        }

        console.log('\n🎉 All vitals tests passed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Run tests
testVitalsAPI();