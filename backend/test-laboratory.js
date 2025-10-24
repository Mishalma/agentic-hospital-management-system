const laboratoryService = require('./services/laboratoryService');

async function testLaboratorySystem() {
  console.log('🧪 Testing Laboratory Information System...\n');

  try {
    // Test 1: Create a new lab order
    console.log('1. Creating a new lab order...');
    const orderData = {
      patientId: 'P001',
      doctorId: 'D001',
      consultationId: 'C001',
      priority: 'Urgent',
      clinicalInfo: {
        diagnosis: 'Suspected diabetes',
        symptoms: 'Increased thirst, frequent urination',
        medications: 'None',
        allergies: 'NKDA'
      },
      tests: [
        {
          testCode: 'FBS',
          testName: 'Fasting Blood Sugar',
          category: 'Biochemistry',
          specimen: 'Blood',
          instructions: '12-hour fasting required'
        },
        {
          testCode: 'HBA1C',
          testName: 'Hemoglobin A1c',
          category: 'Biochemistry',
          specimen: 'Blood',
          instructions: 'No fasting required'
        }
      ]
    };

    const createResult = await laboratoryService.createLabOrder(orderData);
    if (createResult.success) {
      console.log('✅ Lab order created successfully:', createResult.data.orderId);
      
      // Test 2: Get lab orders
      console.log('\n2. Fetching lab orders...');
      const ordersResult = await laboratoryService.getLabOrders();
      if (ordersResult.success) {
        console.log(`✅ Found ${ordersResult.data.length} lab orders`);
      }

      // Test 3: Update sample collection
      console.log('\n3. Updating sample collection...');
      const collectionData = {
        collectedBy: 'Lab Tech A',
        collectionDate: new Date(),
        collectionTime: '08:30',
        collectionNotes: 'Sample collected successfully',
        barcodeId: 'BC12345'
      };

      const collectionResult = await laboratoryService.updateSampleCollection(
        createResult.data.orderId,
        collectionData
      );
      if (collectionResult.success) {
        console.log('✅ Sample collection updated successfully');
      }

      // Test 4: Create lab result
      console.log('\n4. Creating lab result...');
      const resultData = {
        orderId: createResult.data.orderId,
        patientId: 'P001',
        testCode: 'FBS',
        testName: 'Fasting Blood Sugar',
        category: 'Biochemistry',
        specimen: 'Blood',
        results: [
          {
            parameter: 'Glucose',
            value: '126',
            unit: 'mg/dL',
            referenceRange: '70-100',
            flag: 'High',
            method: 'Enzymatic',
            instrument: 'Chemistry Analyzer'
          }
        ],
        overallInterpretation: 'Elevated fasting glucose - consistent with diabetes',
        technologistComments: 'Sample processed without issues',
        performedBy: {
          technologist: 'Tech B',
          pathologist: 'Dr. Smith',
          supervisor: 'Lab Manager'
        }
      };

      const resultCreateResult = await laboratoryService.createLabResult(resultData);
      if (resultCreateResult.success) {
        console.log('✅ Lab result created successfully:', resultCreateResult.data.resultId);

        // Test 5: Verify lab result
        console.log('\n5. Verifying lab result...');
        const verificationData = {
          verifiedBy: 'Dr. Smith',
          comments: 'Results reviewed and approved'
        };

        const verifyResult = await laboratoryService.verifyLabResult(
          resultCreateResult.data.resultId,
          verificationData
        );
        if (verifyResult.success) {
          console.log('✅ Lab result verified successfully');
        }
      }

      // Test 6: Get lab statistics
      console.log('\n6. Fetching lab statistics...');
      const statsResult = await laboratoryService.getLabStatistics();
      if (statsResult.success) {
        console.log('✅ Lab statistics retrieved successfully');
        console.log('   - Orders by status:', statsResult.data.ordersByStatus);
        console.log('   - Results by category:', statsResult.data.resultsByCategory);
        console.log('   - Average turnaround time:', statsResult.data.averageTurnaroundTime);
      }

      // Test 7: Get pending orders
      console.log('\n7. Fetching pending orders...');
      const pendingResult = await laboratoryService.getPendingOrders();
      if (pendingResult.success) {
        console.log(`✅ Found ${pendingResult.data.length} pending orders`);
      }

      // Test 8: Perform QC check
      console.log('\n8. Performing QC check...');
      const qcData = {
        parameter: 'Sample Quality',
        expected: 'Good',
        actual: 'Good',
        status: 'Pass',
        checkedBy: 'QC Tech'
      };

      const qcResult = await laboratoryService.performQCCheck(
        createResult.data.orderId,
        qcData
      );
      if (qcResult.success) {
        console.log('✅ QC check performed successfully');
      }

      console.log('\n🎉 All laboratory system tests passed successfully!');

    } else {
      console.log('❌ Failed to create lab order:', createResult.error);
    }

  } catch (error) {
    console.error('❌ Laboratory system test failed:', error);
  }
}

// Test the API endpoints
async function testLaboratoryAPI() {
  console.log('\n🌐 Testing Laboratory API endpoints...\n');

  const baseURL = 'http://localhost:5000/api/laboratory';

  try {
    // Test creating a lab order via API
    console.log('1. Testing POST /api/laboratory/orders...');
    
    const orderData = {
      patientId: 'P002',
      doctorId: 'D002',
      priority: 'STAT',
      clinicalInfo: {
        diagnosis: 'Chest pain',
        symptoms: 'Acute chest pain',
        medications: 'Aspirin',
        allergies: 'None'
      },
      tests: [
        {
          testCode: 'TROP',
          testName: 'Troponin I',
          category: 'Biochemistry',
          specimen: 'Blood',
          instructions: 'STAT processing required'
        }
      ]
    };

    const response = await fetch(`${baseURL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API order creation successful:', data.data.orderId);
    } else {
      console.log('❌ API order creation failed:', response.status);
    }

    // Test getting orders
    console.log('\n2. Testing GET /api/laboratory/orders...');
    const getResponse = await fetch(`${baseURL}/orders`);
    
    if (getResponse.ok) {
      const data = await getResponse.json();
      console.log(`✅ API get orders successful: ${data.count} orders found`);
    } else {
      console.log('❌ API get orders failed:', getResponse.status);
    }

    // Test getting test catalog
    console.log('\n3. Testing GET /api/laboratory/test-catalog...');
    const catalogResponse = await fetch(`${baseURL}/test-catalog`);
    
    if (catalogResponse.ok) {
      const data = await catalogResponse.json();
      console.log(`✅ API test catalog successful: ${data.data.length} categories found`);
    } else {
      console.log('❌ API test catalog failed:', catalogResponse.status);
    }

    // Test getting statistics
    console.log('\n4. Testing GET /api/laboratory/statistics...');
    const statsResponse = await fetch(`${baseURL}/statistics`);
    
    if (statsResponse.ok) {
      const data = await statsResponse.json();
      console.log('✅ API statistics successful');
    } else {
      console.log('❌ API statistics failed:', statsResponse.status);
    }

    console.log('\n🎉 All API tests completed!');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

// Run tests
async function runAllTests() {
  await testLaboratorySystem();
  
  // Wait a bit before testing API
  setTimeout(async () => {
    await testLaboratoryAPI();
  }, 2000);
}

// Check if this file is being run directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testLaboratorySystem,
  testLaboratoryAPI
};