const mongoose = require('mongoose');
const EmergencyCase = require('./models/EmergencyCase');
const emergencyService = require('./services/emergencyService');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/hospital_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testEmergencySystem() {
  console.log('🚨 Testing Emergency Case Management System...\n');

  try {
    // Clear existing test data
    await EmergencyCase.deleteMany({ chiefComplaint: /Test/ });

    // Test 1: Create Critical Emergency Case
    console.log('1. Creating Critical Emergency Case...');
    const criticalCase = new EmergencyCase({
      patientId: new mongoose.Types.ObjectId(),
      chiefComplaint: 'Test - Severe chest pain with shortness of breath',
      symptoms: ['chest pain', 'difficulty breathing', 'sweating', 'nausea'],
      vitals: {
        systolicBP: 200,
        diastolicBP: 110,
        heartRate: 130,
        temperature: 37.8,
        oxygenSaturation: 88,
        respiratoryRate: 28,
        painScale: 9
      },
      preHospitalData: {
        ambulanceService: 'City EMS',
        paramedicsReport: 'Patient found conscious but in severe distress',
        treatmentGiven: 'Oxygen therapy, IV access established',
        medications: 'Aspirin 325mg, Nitroglycerin SL'
      },
      arrivalMode: 'Ambulance',
      arrivalTime: new Date(),
      status: 'active'
    });

    // Calculate triage score
    const triageAssessment = emergencyService.calculateTriageScore(
      criticalCase.vitals,
      criticalCase.symptoms,
      { age: 65 }
    );

    criticalCase.triageScore = triageAssessment.score;
    criticalCase.priority = triageAssessment.priority;
    criticalCase.riskFactors = triageAssessment.riskFactors;
    criticalCase.recommendedAction = triageAssessment.recommendedAction;
    criticalCase.vitalsHistory = [{ ...criticalCase.vitals, timestamp: new Date() }];

    await criticalCase.save();
    console.log(`✅ Critical case created with priority: ${criticalCase.priority}, Score: ${criticalCase.triageScore}`);
    console.log(`   Risk factors: ${criticalCase.riskFactors.join(', ')}`);
    console.log(`   Recommended action: ${criticalCase.recommendedAction}\n`);

    // Test 2: Create High Priority Case
    console.log('2. Creating High Priority Emergency Case...');
    const highCase = new EmergencyCase({
      patientId: new mongoose.Types.ObjectId(),
      chiefComplaint: 'Test - Severe abdominal pain',
      symptoms: ['severe pain', 'vomiting', 'fever'],
      vitals: {
        systolicBP: 160,
        diastolicBP: 95,
        heartRate: 110,
        temperature: 39.2,
        oxygenSaturation: 95,
        respiratoryRate: 22,
        painScale: 8
      },
      arrivalMode: 'Walk-in',
      arrivalTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      status: 'active'
    });

    const highTriageAssessment = emergencyService.calculateTriageScore(
      highCase.vitals,
      highCase.symptoms,
      { age: 45 }
    );

    highCase.triageScore = highTriageAssessment.score;
    highCase.priority = highTriageAssessment.priority;
    highCase.riskFactors = highTriageAssessment.riskFactors;
    highCase.recommendedAction = highTriageAssessment.recommendedAction;
    highCase.vitalsHistory = [{ ...highCase.vitals, timestamp: new Date() }];

    await highCase.save();
    console.log(`✅ High priority case created with priority: ${highCase.priority}, Score: ${highCase.triageScore}`);
    console.log(`   Risk factors: ${highCase.riskFactors.join(', ')}\n`);

    // Test 3: Create Medium Priority Case
    console.log('3. Creating Medium Priority Emergency Case...');
    const mediumCase = new EmergencyCase({
      patientId: new mongoose.Types.ObjectId(),
      chiefComplaint: 'Test - Ankle injury from fall',
      symptoms: ['pain', 'swelling', 'difficulty walking'],
      vitals: {
        systolicBP: 130,
        diastolicBP: 80,
        heartRate: 85,
        temperature: 36.8,
        oxygenSaturation: 98,
        respiratoryRate: 18,
        painScale: 6
      },
      arrivalMode: 'Walk-in',
      arrivalTime: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      status: 'active'
    });

    const mediumTriageAssessment = emergencyService.calculateTriageScore(
      mediumCase.vitals,
      mediumCase.symptoms,
      { age: 28 }
    );

    mediumCase.triageScore = mediumTriageAssessment.score;
    mediumCase.priority = mediumTriageAssessment.priority;
    mediumCase.riskFactors = mediumTriageAssessment.riskFactors;
    mediumCase.recommendedAction = mediumTriageAssessment.recommendedAction;
    mediumCase.vitalsHistory = [{ ...mediumCase.vitals, timestamp: new Date() }];

    await mediumCase.save();
    console.log(`✅ Medium priority case created with priority: ${mediumCase.priority}, Score: ${mediumCase.triageScore}\n`);

    // Test 4: Add treatment orders
    console.log('4. Adding treatment orders...');
    criticalCase.treatmentOrders.push({
      type: 'medication',
      description: 'Morphine 2mg IV for pain management',
      urgency: 'stat',
      orderedBy: 'Dr. Smith',
      orderedAt: new Date(),
      status: 'pending'
    });

    criticalCase.treatmentOrders.push({
      type: 'lab',
      description: 'Cardiac enzymes, CBC, BMP',
      urgency: 'urgent',
      orderedBy: 'Dr. Smith',
      orderedAt: new Date(),
      status: 'pending'
    });

    criticalCase.treatmentOrders.push({
      type: 'imaging',
      description: 'Chest X-ray and ECG',
      urgency: 'stat',
      orderedBy: 'Dr. Smith',
      orderedAt: new Date(),
      status: 'pending'
    });

    await criticalCase.save();
    console.log(`✅ Added ${criticalCase.treatmentOrders.length} treatment orders to critical case\n`);

    // Test 5: Simulate vitals updates and deterioration prediction
    console.log('5. Testing deterioration prediction...');
    
    // Add worsening vitals
    const worseningVitals = {
      systolicBP: 180,
      diastolicBP: 100,
      heartRate: 140,
      temperature: 38.2,
      oxygenSaturation: 85,
      respiratoryRate: 32,
      timestamp: new Date()
    };

    criticalCase.vitalsHistory.push(worseningVitals);
    await criticalCase.save();

    const deteriorationPrediction = emergencyService.predictDeterioration(criticalCase);
    console.log(`✅ Deterioration prediction:`);
    console.log(`   Risk Level: ${deteriorationPrediction.risk}`);
    console.log(`   Confidence: ${deteriorationPrediction.confidence}%`);
    console.log(`   Recommendations: ${deteriorationPrediction.recommendations.join(', ')}\n`);

    // Test 6: Resource allocation optimization
    console.log('6. Testing resource allocation...');
    const activeCases = [criticalCase, highCase, mediumCase];
    const availableResources = [
      { id: 'trauma1', type: 'trauma_bay', status: 'available' },
      { id: 'trauma2', type: 'trauma_bay', status: 'available' },
      { id: 'acute1', type: 'acute_bed', status: 'available' },
      { id: 'acute2', type: 'acute_bed', status: 'occupied' },
      { id: 'standard1', type: 'standard_bed', status: 'available' },
      { id: 'standard2', type: 'standard_bed', status: 'available' }
    ];

    const allocation = emergencyService.optimizeResourceAllocation(activeCases, availableResources);
    console.log(`✅ Resource allocation completed:`);
    console.log(`   Assignments: ${allocation.assignments.length}`);
    console.log(`   Waiting queue: ${allocation.waitingQueue.length}`);
    console.log(`   Resource utilization:`, allocation.resourceUtilization);
    
    allocation.assignments.forEach(assignment => {
      console.log(`   - Case ${assignment.caseId.toString().slice(-6)} assigned to ${assignment.resourceId}`);
    });
    console.log('');

    // Test 7: Quality metrics calculation
    console.log('7. Testing quality metrics...');
    const allCases = await EmergencyCase.find({});
    const qualityMetrics = emergencyService.calculateQualityMetrics(allCases, 24);
    
    console.log(`✅ Quality metrics (24h):`);
    console.log(`   Total cases: ${qualityMetrics.totalCases}`);
    console.log(`   Average wait time: ${qualityMetrics.averageWaitTime.toFixed(1)} minutes`);
    console.log(`   Triage accuracy: ${qualityMetrics.triageAccuracy.toFixed(1)}%`);
    console.log(`   Patient satisfaction: ${qualityMetrics.patientSatisfaction.toFixed(1)}/5`);
    console.log(`   Length of stay: ${qualityMetrics.lengthOfStay.toFixed(1)} hours\n`);

    // Test 8: Complete a case (discharge)
    console.log('8. Testing case completion...');
    mediumCase.status = 'completed';
    mediumCase.disposition = 'Home';
    mediumCase.dischargeTime = new Date();
    mediumCase.dischargeNotes = 'Ankle sprain, discharged with crutches and pain medication';
    mediumCase.followUpInstructions = 'Follow up with orthopedics in 1 week';
    mediumCase.satisfactionScore = 4.5;

    await mediumCase.save();
    console.log(`✅ Case ${mediumCase._id.toString().slice(-6)} completed and discharged\n`);

    // Test 9: Dashboard statistics
    console.log('9. Testing dashboard statistics...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayCases = await EmergencyCase.find({
      arrivalTime: { $gte: today }
    });
    
    const activeCasesCount = await EmergencyCase.find({ status: 'active' });
    
    const stats = {
      today: {
        total: todayCases.length,
        critical: todayCases.filter(c => c.priority === 'Critical').length,
        high: todayCases.filter(c => c.priority === 'High').length,
        medium: todayCases.filter(c => c.priority === 'Medium').length,
        low: todayCases.filter(c => c.priority === 'Low').length,
        completed: todayCases.filter(c => c.status === 'completed').length
      },
      active: {
        total: activeCasesCount.length,
        critical: activeCasesCount.filter(c => c.priority === 'Critical').length,
        high: activeCasesCount.filter(c => c.priority === 'High').length,
        medium: activeCasesCount.filter(c => c.priority === 'Medium').length,
        low: activeCasesCount.filter(c => c.priority === 'Low').length
      }
    };

    console.log(`✅ Dashboard statistics:`);
    console.log(`   Today's cases: ${stats.today.total} (${stats.today.completed} completed)`);
    console.log(`   Active cases: ${stats.active.total}`);
    console.log(`   Priority breakdown: Critical(${stats.active.critical}), High(${stats.active.high}), Medium(${stats.active.medium}), Low(${stats.active.low})\n`);

    console.log('🎉 All Emergency Case Management tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- AI-powered triage scoring ✅');
    console.log('- Real-time case tracking ✅');
    console.log('- Deterioration prediction ✅');
    console.log('- Resource allocation optimization ✅');
    console.log('- Treatment order management ✅');
    console.log('- Quality metrics calculation ✅');
    console.log('- Dashboard statistics ✅');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testEmergencySystem();