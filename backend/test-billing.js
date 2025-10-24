const billingService = require('./services/billingService');

async function testBillingSystem() {
  console.log('💰 Testing Hospital Billing Management System...\n');

  try {
    // Test 1: Create billing rates
    console.log('1. Creating billing rates...');
    const consultationRate = {
      category: 'Consultation',
      serviceCode: 'CONS_TEST',
      serviceName: 'Test Consultation',
      description: 'Test consultation service',
      department: 'General Medicine',
      pricing: {
        basePrice: 1000,
        currency: 'INR',
        unit: 'per consultation',
        patientTypeRates: [
          { patientType: 'General', rate: 1000, discountPercentage: 0 },
          { patientType: 'Senior Citizen', rate: 1000, discountPercentage: 20 }
        ]
      },
      tax: { taxable: true, taxPercentage: 18, taxCode: 'GST18' },
      validity: { effectiveFrom: new Date(), isActive: true },
      approval: { status: 'Approved' }
    };

    const rateResult = await billingService.createBillingRate(consultationRate);
    if (rateResult.success) {
      console.log('✅ Billing rate created successfully:', rateResult.data.rateId);
    }

    // Test 2: Create a comprehensive bill
    console.log('\n2. Creating a comprehensive bill...');
    const billData = {
      patientId: 'P001',
      patientInfo: {
        name: 'John Doe',
        phone: '+91-9876543210',
        email: 'john.doe@email.com',
        address: '123 Main Street, City',
        insuranceProvider: 'Star Health',
        policyNumber: 'SH123456789'
      },
      visitId: 'V001',
      priority: 'Normal',
      charges: {
        consultation: [{
          consultationId: 'C001',
          doctorId: 'D001',
          doctorName: 'Dr. Smith',
          department: 'Cardiology',
          serviceCode: 'CONS_CARD',
          serviceName: 'Cardiology Consultation',
          quantity: 1,
          unitPrice: 1500,
          discount: 150,
          tax: 243,
          totalAmount: 1593,
          date: new Date(),
          notes: 'Follow-up consultation'
        }],
        laboratory: [{
          orderId: 'LAB-001',
          testCode: 'CBC',
          testName: 'Complete Blood Count',
          category: 'Hematology',
          quantity: 1,
          unitPrice: 500,
          discount: 0,
          tax: 90,
          totalAmount: 590,
          date: new Date(),
          urgency: 'Routine',
          notes: 'Fasting not required'
        }],
        pharmacy: [{
          prescriptionId: 'RX001',
          medicationCode: 'MED001',
          medicationName: 'Atorvastatin 20mg',
          strength: '20mg',
          quantity: 30,
          unitPrice: 15,
          discount: 45,
          tax: 72,
          totalAmount: 477,
          date: new Date(),
          pharmacistId: 'PH001',
          notes: '30 days supply'
        }],
        procedures: [{
          procedureId: 'PROC001',
          procedureCode: 'ECG',
          procedureName: 'Electrocardiogram',
          department: 'Cardiology',
          performedBy: 'Tech001',
          quantity: 1,
          unitPrice: 800,
          discount: 0,
          tax: 144,
          totalAmount: 944,
          date: new Date(),
          duration: '15 minutes',
          notes: 'Routine ECG'
        }]
      },
      insurance: {
        provider: 'Star Health',
        policyNumber: 'SH123456789',
        coveragePercentage: 80,
        coveredAmount: 2883.2,
        deductible: 500,
        copayAmount: 720.8,
        claimNumber: 'CLM001',
        claimStatus: 'Not Submitted'
      }
    };

    const billResult = await billingService.createBill(billData);
    if (billResult.success) {
      console.log('✅ Bill created successfully:', billResult.data.billId);
      console.log('   - Total Amount:', billResult.data.summary.totalAmount);
      console.log('   - Status:', billResult.data.status);

      // Test 3: Add payment to the bill
      console.log('\n3. Adding payment to the bill...');
      const paymentData = {
        amount: 720.8,
        method: 'Card',
        transactionId: 'TXN123456789',
        reference: 'Patient copay',
        receivedBy: 'cashier_001',
        notes: 'Copay amount paid by patient'
      };

      const paymentResult = await billingService.addPayment(billResult.data.billId, paymentData);
      if (paymentResult.success) {
        console.log('✅ Payment added successfully:', paymentResult.data.paymentId);
      }

      // Test 4: Update bill status
      console.log('\n4. Updating bill status...');
      const statusResult = await billingService.updateBillStatus(
        billResult.data.billId,
        'Sent',
        { updatedBy: 'billing_clerk' }
      );
      if (statusResult.success) {
        console.log('✅ Bill status updated successfully to:', statusResult.data.status);
      }
    }

    // Test 5: Generate bill from services
    console.log('\n5. Generating bill from services...');
    const services = {
      consultations: [{
        consultationId: 'C002',
        doctorId: 'D002',
        doctorName: 'Dr. Johnson',
        department: 'Emergency',
        serviceCode: 'CONS_EMER',
        serviceName: 'Emergency Consultation',
        date: new Date(),
        notes: 'Emergency visit'
      }],
      labOrders: [{
        orderId: 'LAB-002',
        orderDate: new Date(),
        tests: [{
          testCode: 'TROP',
          testName: 'Troponin I',
          category: 'Biochemistry',
          priority: 'STAT',
          instructions: 'Emergency cardiac marker'
        }]
      }],
      prescriptions: [{
        prescriptionId: 'RX002',
        date: new Date(),
        pharmacistId: 'PH001',
        medications: [{
          medicationCode: 'MED002',
          medicationName: 'Aspirin 75mg',
          strength: '75mg',
          quantity: 10,
          instructions: 'Emergency supply'
        }]
      }]
    };

    const generatedBillResult = await billingService.generateBillFromServices('P002', services);
    if (generatedBillResult.success) {
      console.log('✅ Bill generated from services:', generatedBillResult.data.billId);
    }

    // Test 6: Get billing statistics
    console.log('\n6. Fetching billing statistics...');
    const statsResult = await billingService.getBillingStatistics();
    if (statsResult.success) {
      console.log('✅ Billing statistics retrieved successfully');
      console.log('   - Bills by status:', statsResult.data.billsByStatus.length, 'categories');
      console.log('   - Revenue by department:', statsResult.data.revenueByDepartment.length, 'departments');
      console.log('   - Payment methods:', statsResult.data.paymentMethods.length, 'methods');
    }

    // Test 7: Get outstanding bills
    console.log('\n7. Fetching outstanding bills...');
    const outstandingResult = await billingService.getOutstandingBills();
    if (outstandingResult.success) {
      console.log(`✅ Found ${outstandingResult.data.length} outstanding bills`);
    }

    // Test 8: Get billing rates
    console.log('\n8. Fetching billing rates...');
    const ratesResult = await billingService.getBillingRates();
    if (ratesResult.success) {
      console.log(`✅ Found ${ratesResult.data.length} billing rates`);
    }

    console.log('\n🎉 All billing system tests passed successfully!');

  } catch (error) {
    console.error('❌ Billing system test failed:', error);
  }
}

// Test the API endpoints
async function testBillingAPI() {
  console.log('\n🌐 Testing Billing API endpoints...\n');

  const baseURL = 'http://localhost:5000/api/billing';

  try {
    // Test creating a bill via API
    console.log('1. Testing POST /api/billing/bills...');
    
    const billData = {
      patientId: 'P003',
      patientInfo: {
        name: 'Jane Smith',
        phone: '+91-9876543211',
        email: 'jane.smith@email.com'
      },
      charges: {
        consultation: [{
          consultationId: 'C003',
          doctorId: 'D003',
          doctorName: 'Dr. Wilson',
          department: 'General Medicine',
          serviceCode: 'CONS_GEN',
          serviceName: 'General Consultation',
          quantity: 1,
          unitPrice: 800,
          discount: 0,
          tax: 144,
          totalAmount: 944,
          date: new Date()
        }]
      }
    };

    const response = await fetch(`${baseURL}/bills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(billData)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API bill creation successful:', data.data.billId);
    } else {
      console.log('❌ API bill creation failed:', response.status);
    }

    // Test getting bills
    console.log('\n2. Testing GET /api/billing/bills...');
    const getBillsResponse = await fetch(`${baseURL}/bills`);
    
    if (getBillsResponse.ok) {
      const data = await getBillsResponse.json();
      console.log(`✅ API get bills successful: ${data.count} bills found`);
    } else {
      console.log('❌ API get bills failed:', getBillsResponse.status);
    }

    // Test getting billing statistics
    console.log('\n3. Testing GET /api/billing/statistics...');
    const statsResponse = await fetch(`${baseURL}/statistics`);
    
    if (statsResponse.ok) {
      const data = await statsResponse.json();
      console.log('✅ API statistics successful');
    } else {
      console.log('❌ API statistics failed:', statsResponse.status);
    }

    // Test getting service categories
    console.log('\n4. Testing GET /api/billing/categories...');
    const categoriesResponse = await fetch(`${baseURL}/categories`);
    
    if (categoriesResponse.ok) {
      const data = await categoriesResponse.json();
      console.log(`✅ API categories successful: ${data.data.length} categories found`);
    } else {
      console.log('❌ API categories failed:', categoriesResponse.status);
    }

    // Test getting payment methods
    console.log('\n5. Testing GET /api/billing/payment-methods...');
    const paymentMethodsResponse = await fetch(`${baseURL}/payment-methods`);
    
    if (paymentMethodsResponse.ok) {
      const data = await paymentMethodsResponse.json();
      console.log(`✅ API payment methods successful: ${data.data.length} methods found`);
    } else {
      console.log('❌ API payment methods failed:', paymentMethodsResponse.status);
    }

    console.log('\n🎉 All API tests completed!');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

// Run tests
async function runAllTests() {
  await testBillingSystem();
  
  // Wait a bit before testing API
  setTimeout(async () => {
    await testBillingAPI();
  }, 2000);
}

// Check if this file is being run directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testBillingSystem,
  testBillingAPI
};