const { Patient } = require('./models');

async function testPatientLookup() {
  console.log('🔍 Testing Patient Lookup...\n');

  try {
    // Test patient IDs from MockPatient
    const testPatientIds = [
      'PT2024123456',
      'PT2024789012', 
      'PT2024345678',
      'PT2024567890'
    ];

    console.log('Available test patient IDs:', testPatientIds);

    for (const patientId of testPatientIds) {
      console.log(`\n--- Testing Patient ID: ${patientId} ---`);
      
      try {
        const patient = await Patient.findByUniqueId(patientId);
        
        if (patient) {
          console.log(`✅ Found patient: ${patient.name}`);
          console.log(`   - Phone: ${patient.phone}`);
          console.log(`   - Email: ${patient.email}`);
        } else {
          console.log(`❌ Patient not found: ${patientId}`);
        }
      } catch (error) {
        console.log(`❌ Error looking up ${patientId}:`, error.message);
      }
    }

    // Test the API endpoint
    console.log('\n🌐 Testing API endpoint...');
    
    const testPatientId = 'PT2024123456';
    try {
      const response = await fetch(`http://localhost:5000/api/patients/${testPatientId}/basic`);
      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ API test successful: ${data.name}`);
      } else {
        console.log(`❌ API test failed: ${data.message}`);
      }
    } catch (error) {
      console.log(`❌ API test error: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testPatientLookup();
}

module.exports = testPatientLookup;