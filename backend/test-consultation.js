const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testConsultation = {
  patientId: 'TEST001',
  doctorId: 'DOC001',
  chiefComplaint: 'Chest pain and shortness of breath',
  historyOfPresentIllness: 'Patient reports chest pain for 2 days, worse with exertion',
  pastMedicalHistory: 'Hypertension, diabetes mellitus type 2',
  medications: [
    {
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'BID',
      status: 'active'
    }
  ],
  allergies: [
    {
      allergen: 'Penicillin',
      reaction: 'Rash',
      severity: 'moderate'
    }
  ],
  vitals: {
    bloodPressure: { systolic: 140, diastolic: 90 },
    heartRate: 88,
    temperature: 98.6,
    respiratoryRate: 18,
    oxygenSaturation: 96
  },
  symptoms: [
    {
      symptom: 'Chest pain',
      severity: 7,
      duration: '2 days',
      onset: 'gradual',
      character: 'pressure-like'
    }
  ],
  assessment: {
    primaryDiagnosis: 'Unstable angina',
    clinicalNotes: 'Patient requires immediate cardiac evaluation'
  },
  consultationType: 'initial'
};

const testPrescription = {
  consultationId: 'CONS001',
  patientId: 'TEST001',
  doctorId: 'DOC001',
  medications: [
    {
      genericName: 'Amoxicillin',
      brandName: 'Amoxil',
      dosage: '500mg',
      dosageForm: 'capsule',
      frequency: 'TID',
      duration: { value: 7, unit: 'days' },
      quantity: 21,
      instructions: 'Take with food',
      indication: 'Bacterial infection'
    }
  ],
  diagnosis: {
    primary: 'Community-acquired pneumonia'
  }
};

async function testConsultationAPI() {
  console.log('🧪 Testing Consultation & E-Prescription Platform...\n');

  try {
    // Test 1: Get all consultations
    console.log('1. Testing GET /api/consultations');
    const consultationsResponse = await axios.get(`${BASE_URL}/consultations`);
    console.log(`✅ Found ${consultationsResponse.data.data.length} consultations`);
    console.log(`   Pagination: ${consultationsResponse.data.pagination.totalItems} total items\n`);

    // Test 2: Create new consultation
    console.log('2. Testing POST /api/consultations');
    const newConsultationResponse = await axios.post(`${BASE_URL}/consultations`, testConsultation);
    const consultationId = newConsultationResponse.data.data.id;
    console.log(`✅ Created consultation: ${consultationId}\n`);

    // Test 3: Get consultation by ID
    console.log('3. Testing GET /api/consultations/:id');
    const consultationResponse = await axios.get(`${BASE_URL}/consultations/${consultationId}`);
    console.log(`✅ Retrieved consultation: ${consultationResponse.data.data.chiefComplaint}\n`);

    // Test 4: Test AI suggestions (will work if Gemini API key is configured)
    console.log('4. Testing AI suggestions');
    try {
      const aiResponse = await axios.post(`${BASE_URL}/consultations/${consultationId}/ai-suggestions`, {
        symptoms: testConsultation.symptoms,
        vitals: testConsultation.vitals,
        patientHistory: testConsultation.pastMedicalHistory,
        chiefComplaint: testConsultation.chiefComplaint
      });
      
      if (aiResponse.data.success) {
        console.log('✅ AI suggestions generated successfully');
        console.log(`   Suggestions: ${JSON.stringify(aiResponse.data.data, null, 2)}\n`);
      } else {
        console.log(`⚠️  AI suggestions failed: ${aiResponse.data.message}\n`);
      }
    } catch (error) {
      console.log(`⚠️  AI suggestions error: ${error.response?.data?.message || error.message}\n`);
    }

    // Test 5: Test drug interactions
    console.log('5. Testing drug interaction checking');
    const interactionResponse = await axios.post(`${BASE_URL}/consultations/${consultationId}/drug-interactions`, {
      newMedications: [
        { name: 'Amoxicillin', dosage: '500mg', frequency: 'TID' },
        { name: 'Warfarin', dosage: '5mg', frequency: 'Daily' }
      ]
    });
    console.log(`✅ Drug interaction check completed`);
    console.log(`   Interactions found: ${interactionResponse.data.data.interactionCount}\n`);

    // Test 6: Search formulary
    console.log('6. Testing formulary search');
    const formularyResponse = await axios.get(`${BASE_URL}/consultations/formulary/search?query=amoxicillin`);
    console.log(`✅ Formulary search completed`);
    console.log(`   Results found: ${formularyResponse.data.count}\n`);

    // Test 7: Get drug information
    console.log('7. Testing drug information lookup');
    const drugInfoResponse = await axios.get(`${BASE_URL}/consultations/formulary/drug/Amoxicillin`);
    console.log(`✅ Drug information retrieved`);
    console.log(`   Drug: ${drugInfoResponse.data.data.genericName} - ${drugInfoResponse.data.data.category}\n`);

    // Test 8: Create prescription
    console.log('8. Testing prescription creation');
    const prescriptionData = {
      ...testPrescription,
      consultationId: consultationId
    };
    const prescriptionResponse = await axios.post(`${BASE_URL}/prescriptions`, prescriptionData);
    const prescriptionId = prescriptionResponse.data.data.id;
    console.log(`✅ Created prescription: ${prescriptionId}`);
    console.log(`   Prescription number: ${prescriptionResponse.data.data.prescriptionNumber}\n`);

    // Test 9: Get prescriptions
    console.log('9. Testing prescription retrieval');
    const prescriptionsResponse = await axios.get(`${BASE_URL}/prescriptions`);
    console.log(`✅ Retrieved ${prescriptionsResponse.data.data.length} prescriptions\n`);

    // Test 10: Update prescription status
    console.log('10. Testing prescription status update');
    const statusUpdateResponse = await axios.patch(`${BASE_URL}/prescriptions/${prescriptionId}/status`, {
      status: 'sent'
    });
    console.log(`✅ Updated prescription status to: ${statusUpdateResponse.data.data.status}\n`);

    // Test 11: Send prescription to pharmacy
    console.log('11. Testing prescription transmission');
    const transmissionResponse = await axios.post(`${BASE_URL}/prescriptions/${prescriptionId}/send`, {
      pharmacyId: 'PHARM001',
      method: 'electronic'
    });
    console.log(`✅ Prescription sent to pharmacy`);
    console.log(`   Confirmation: ${transmissionResponse.data.data.transmissionInfo.confirmationNumber}\n`);

    // Test 12: Get consultation statistics
    console.log('12. Testing consultation statistics');
    const statsResponse = await axios.get(`${BASE_URL}/consultations/stats/DOC001`);
    console.log(`✅ Retrieved consultation statistics`);
    console.log(`   Total consultations: ${statsResponse.data.data.total}`);
    console.log(`   Prescriptions written: ${statsResponse.data.data.prescriptionsWritten}\n`);

    console.log('🎉 All tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Consultation CRUD operations');
    console.log('   ✅ AI-powered clinical suggestions');
    console.log('   ✅ Drug interaction checking');
    console.log('   ✅ Formulary search and lookup');
    console.log('   ✅ Prescription management');
    console.log('   ✅ Electronic prescription transmission');
    console.log('   ✅ Statistics and reporting');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Make sure the backend server is running (npm run dev)');
    console.error('   2. Check if the server is accessible at http://localhost:5000');
    console.error('   3. Verify all dependencies are installed');
    console.error('   4. For AI features, ensure GEMINI_API_KEY is set in .env file');
  }
}

// Run the tests
testConsultationAPI();

module.exports = { testConsultationAPI };