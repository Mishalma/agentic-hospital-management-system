const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAIFunctionality() {
  console.log('🤖 Testing AI Functionality...\n');

  // Test 1: Simple AI suggestions
  console.log('1. Testing AI Suggestions for Chest Pain');
  try {
    const response = await axios.post(`${BASE_URL}/consultations/temp/ai-suggestions`, {
      chiefComplaint: 'Chest pain',
      symptoms: [{ symptom: 'Chest pain', severity: 7, duration: '2 hours' }],
      vitals: { heartRate: 95, bloodPressure: { systolic: 140, diastolic: 90 } },
      patientHistory: 'Hypertension',
      age: '55',
      gender: 'Male'
    });

    if (response.data.success) {
      console.log('✅ AI suggestions received successfully!');
      console.log('Response:', JSON.stringify(response.data.data, null, 2));
    } else {
      console.log('❌ AI suggestions failed:', response.data.message);
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
  }

  console.log('\n' + '='.repeat(50));

  // Test 2: AI Chat
  console.log('2. Testing AI Chat');
  try {
    const chatResponse = await axios.post(`${BASE_URL}/consultations/ai-chat`, {
      message: 'What are the differential diagnoses for chest pain in a 55-year-old male?',
      context: 'emergency_consultation',
      doctorId: 'DOC001'
    });

    if (chatResponse.data.success) {
      console.log('✅ AI chat response received!');
      console.log('Response:', chatResponse.data.response);
      console.log('Confidence:', chatResponse.data.confidence + '%');
    } else {
      console.log('❌ AI chat failed:', chatResponse.data.message);
    }
  } catch (error) {
    console.log('❌ Chat Error:', error.response?.data?.message || error.message);
  }

  console.log('\n' + '='.repeat(50));

  // Test 3: Prescription AI
  console.log('3. Testing Prescription AI');
  try {
    const prescResponse = await axios.post(`${BASE_URL}/consultations/temp/prescription-suggestions`, {
      diagnosis: 'Hypertension',
      patientInfo: {
        age: 'Adult',
        allergies: [],
        currentMedications: []
      }
    });

    if (prescResponse.data.success) {
      console.log('✅ Prescription AI response received!');
      console.log('Response:', JSON.stringify(prescResponse.data.data, null, 2));
    } else {
      console.log('❌ Prescription AI failed:', prescResponse.data.message);
    }
  } catch (error) {
    console.log('❌ Prescription Error:', error.response?.data?.message || error.message);
  }

  console.log('\n🎯 Test Summary:');
  console.log('- AI suggestions should work with fallbacks');
  console.log('- Chat should provide medical guidance');
  console.log('- Prescription AI should suggest medications');
  console.log('\n💡 If you see fallback responses, that\'s normal!');
  console.log('   The system provides clinical guidelines when AI is unavailable.');
}

testAIFunctionality();

module.exports = { testAIFunctionality };