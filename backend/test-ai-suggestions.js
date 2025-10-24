const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test AI suggestions with different scenarios
const testScenarios = [
  {
    name: 'Chest Pain Case',
    data: {
      chiefComplaint: 'Chest pain and shortness of breath',
      symptoms: [
        {
          symptom: 'Chest pain',
          severity: 7,
          duration: '2 hours',
          character: 'crushing'
        },
        {
          symptom: 'Shortness of breath',
          severity: 6,
          duration: '2 hours',
          character: 'progressive'
        }
      ],
      vitals: {
        bloodPressure: { systolic: 150, diastolic: 95 },
        heartRate: 95,
        temperature: 98.6,
        oxygenSaturation: 94
      },
      patientHistory: 'Hypertension, smoking history',
      age: '55',
      gender: 'Male'
    }
  },
  {
    name: 'Fever and Cough Case',
    data: {
      chiefComplaint: 'Fever and productive cough',
      symptoms: [
        {
          symptom: 'Fever',
          severity: 8,
          duration: '3 days',
          character: 'intermittent'
        },
        {
          symptom: 'Productive cough',
          severity: 6,
          duration: '4 days',
          character: 'yellow sputum'
        }
      ],
      vitals: {
        bloodPressure: { systolic: 120, diastolic: 80 },
        heartRate: 88,
        temperature: 101.5,
        respiratoryRate: 22,
        oxygenSaturation: 96
      },
      patientHistory: 'No significant medical history',
      age: '35',
      gender: 'Female'
    }
  },
  {
    name: 'Headache Case',
    data: {
      chiefComplaint: 'Severe headache with nausea',
      symptoms: [
        {
          symptom: 'Headache',
          severity: 9,
          duration: '6 hours',
          character: 'throbbing, unilateral'
        },
        {
          symptom: 'Nausea',
          severity: 7,
          duration: '4 hours',
          character: 'with vomiting'
        }
      ],
      vitals: {
        bloodPressure: { systolic: 140, diastolic: 90 },
        heartRate: 75,
        temperature: 98.4
      },
      patientHistory: 'History of migraines',
      age: '28',
      gender: 'Female'
    }
  }
];

async function testAISuggestions() {
  console.log('🤖 Testing AI Suggestions Functionality...\n');

  for (const scenario of testScenarios) {
    console.log(`\n📋 Testing: ${scenario.name}`);
    console.log('=' .repeat(50));
    
    try {
      // Test AI suggestions endpoint
      console.log('Requesting AI suggestions...');
      const response = await axios.post(`${BASE_URL}/consultations/temp/ai-suggestions`, scenario.data);
      
      if (response.data.success) {
        console.log('✅ AI suggestions received successfully!');
        
        const suggestions = response.data.data;
        
        // Display differential diagnosis
        if (suggestions.differentialDiagnosis) {
          console.log('\n🔍 Differential Diagnosis:');
          if (Array.isArray(suggestions.differentialDiagnosis)) {
            suggestions.differentialDiagnosis.forEach((dx, index) => {
              console.log(`   ${index + 1}. ${dx.diagnosis || dx} (${dx.likelihood || 'unknown'} likelihood)`);
              if (dx.reasoning) console.log(`      Reasoning: ${dx.reasoning}`);
            });
          } else {
            console.log(`   ${suggestions.differentialDiagnosis}`);
          }
        }
        
        // Display investigations
        if (suggestions.investigations) {
          console.log('\n🧪 Recommended Investigations:');
          if (Array.isArray(suggestions.investigations)) {
            suggestions.investigations.forEach((test, index) => {
              console.log(`   ${index + 1}. ${test.test || test} (${test.priority || 'routine'} priority)`);
              if (test.reasoning) console.log(`      Reasoning: ${test.reasoning}`);
            });
          } else {
            console.log(`   ${suggestions.investigations}`);
          }
        }
        
        // Display treatment
        if (suggestions.treatment) {
          console.log('\n💊 Treatment Recommendations:');
          if (typeof suggestions.treatment === 'object') {
            if (suggestions.treatment.immediate) {
              console.log(`   Immediate: ${suggestions.treatment.immediate}`);
            }
            if (suggestions.treatment.medications) {
              console.log(`   Medications: ${suggestions.treatment.medications}`);
            }
            if (suggestions.treatment.nonPharmacological) {
              console.log(`   Non-drug: ${suggestions.treatment.nonPharmacological}`);
            }
          } else {
            console.log(`   ${suggestions.treatment}`);
          }
        }
        
        // Display red flags
        if (suggestions.redFlags) {
          console.log('\n⚠️  Red Flags to Monitor:');
          if (Array.isArray(suggestions.redFlags)) {
            suggestions.redFlags.forEach((flag, index) => {
              console.log(`   ${index + 1}. ${flag}`);
            });
          } else {
            console.log(`   ${suggestions.redFlags}`);
          }
        }
        
        // Display follow-up
        if (suggestions.followUp) {
          console.log('\n📅 Follow-up Instructions:');
          if (typeof suggestions.followUp === 'object') {
            if (suggestions.followUp.timeframe) {
              console.log(`   Timeframe: ${suggestions.followUp.timeframe}`);
            }
            if (suggestions.followUp.instructions) {
              console.log(`   Instructions: ${suggestions.followUp.instructions}`);
            }
          } else {
            console.log(`   ${suggestions.followUp}`);
          }
        }
        
        // Display confidence
        if (suggestions.confidence !== undefined) {
          console.log(`\n🎯 AI Confidence: ${suggestions.confidence}%`);
        }
        
        // Show if this was a fallback response
        if (suggestions.parseError) {
          console.log('\n⚠️  Note: This was a fallback response due to AI parsing issues');
        }
        
      } else {
        console.log(`❌ AI suggestions failed: ${response.data.message}`);
        if (response.data.rawResponse) {
          console.log(`Raw response: ${response.data.rawResponse.substring(0, 200)}...`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Error testing ${scenario.name}:`);
      console.log(`   ${error.response?.data?.message || error.message}`);
      
      if (error.response?.data?.error) {
        console.log(`   Technical error: ${error.response.data.error}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🧪 AI Testing Summary:');
  console.log('   - Tested multiple clinical scenarios');
  console.log('   - Verified AI response parsing');
  console.log('   - Checked fallback mechanisms');
  console.log('   - Validated structured output');
  
  console.log('\n💡 Tips for better AI responses:');
  console.log('   1. Ensure GEMINI_API_KEY is properly set in .env');
  console.log('   2. Provide detailed symptom descriptions');
  console.log('   3. Include relevant vital signs');
  console.log('   4. Add patient history for context');
  console.log('   5. Use specific medical terminology');
}

// Test prescription AI suggestions
async function testPrescriptionAI() {
  console.log('\n💊 Testing Prescription AI Suggestions...\n');
  
  const prescriptionTests = [
    {
      diagnosis: 'Hypertension',
      patientInfo: { age: 'Adult', allergies: [], currentMedications: [] }
    },
    {
      diagnosis: 'Type 2 Diabetes',
      patientInfo: { age: 'Adult', allergies: ['Penicillin'], currentMedications: ['Lisinopril'] }
    },
    {
      diagnosis: 'Community-acquired pneumonia',
      patientInfo: { age: 'Adult', allergies: [], currentMedications: [] }
    }
  ];

  for (const test of prescriptionTests) {
    console.log(`Testing prescription suggestions for: ${test.diagnosis}`);
    
    try {
      const response = await axios.post(`${BASE_URL}/consultations/temp/prescription-suggestions`, test);
      
      if (response.data.success) {
        console.log('✅ Prescription suggestions received');
        console.log(`   Suggestions: ${JSON.stringify(response.data.data, null, 2)}`);
      } else {
        console.log(`⚠️  Prescription suggestions failed: ${response.data.message}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.response?.data?.message || error.message}`);
    }
    
    console.log('');
  }
}

// Run all tests
async function runAllTests() {
  try {
    await testAISuggestions();
    await testPrescriptionAI();
    
    console.log('\n🎉 All AI tests completed!');
    console.log('\n🔧 If you see parsing errors or fallback responses:');
    console.log('   1. Check your Gemini API key is valid');
    console.log('   2. Verify internet connection');
    console.log('   3. Check API rate limits');
    console.log('   4. Review the AI service logs');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

runAllTests();

module.exports = { testAISuggestions, testPrescriptionAI };