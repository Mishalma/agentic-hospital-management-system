async function testVitalsAPI() {
  console.log('🩺 Testing Vitals API with Patient Lookup...\n');

  const baseURL = 'http://localhost:5000';

  try {
    // First test patient lookup
    console.log('1. Testing patient lookup API...');
    const patientId = 'PT2024123456';
    
    const patientResponse = await fetch(`${baseURL}/api/patients/${patientId}/basic`);
    const patientData = await patientResponse.json();
    
    if (patientResponse.ok) {
      console.log(`✅ Patient found: ${patientData.name}`);
    } else {
      console.log(`❌ Patient lookup failed: ${patientData.message}`);
      return;
    }

    // Now test vitals creation
    console.log('\n2. Testing vitals creation API...');
    
    const vitalsData = {
      patientId: patientId,
      nurseId: 'NURSE001',
      vitals: {
        bloodPressure: { systolic: 140, diastolic: 90 },
        heartRate: 85,
        temperature: { value: 99.2, unit: 'F' },
        respiratoryRate: 18,
        oxygenSaturation: 96
      },
      notes: 'Test vitals entry via API',
      deviceInfo: {
        deviceType: 'tablet',
        deviceId: 'TEST001'
      }
    };

    const vitalsResponse = await fetch(`${baseURL}/api/vitals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(vitalsData)
    });

    const vitalsResult = await vitalsResponse.json();
    
    if (vitalsResponse.ok) {
      console.log('✅ Vitals created successfully!');
      console.log(`   - Patient: ${patientId}`);
      console.log(`   - Alerts: ${vitalsResult.alerts ? vitalsResult.alerts.length : 0}`);
      
      if (vitalsResult.alerts && vitalsResult.alerts.length > 0) {
        console.log('   - Alert messages:');
        vitalsResult.alerts.forEach(alert => {
          console.log(`     * ${alert.severity}: ${alert.message}`);
        });
      }
    } else {
      console.log(`❌ Vitals creation failed: ${vitalsResult.message}`);
    }

    // Test vitals dashboard
    console.log('\n3. Testing vitals dashboard API...');
    
    const dashboardResponse = await fetch(`${baseURL}/api/vitals/dashboard`);
    const dashboardData = await dashboardResponse.json();
    
    if (dashboardResponse.ok) {
      console.log('✅ Dashboard data retrieved successfully');
      console.log(`   - Today's count: ${dashboardData.data.todayCount}`);
      console.log(`   - Abnormal count: ${dashboardData.data.abnormalCount}`);
      console.log(`   - Unsynced count: ${dashboardData.data.unsyncedCount}`);
    } else {
      console.log(`❌ Dashboard failed: ${dashboardData.message}`);
    }

    console.log('\n🎉 All API tests completed!');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

// Run test
testVitalsAPI();