class MockEmergencyCase {
  constructor() {
    this.emergencyCases = [
      {
        caseId: "EC-001",
        patientId: "P001",
        patientInfo: {
          name: "John Doe",
          age: 45,
          gender: "Male",
          phone: "+91-9876543210",
          emergencyContact: {
            name: "Jane Doe",
            relationship: "Spouse",
            phone: "+91-9876543211",
          },
        },
        arrivalTime: new Date("2024-10-24T10:00:00Z"),
        arrivalMode: "Ambulance",
        chiefComplaint: "Chest pain and shortness of breath",
        symptoms: ["Chest pain", "Dyspnea", "Sweating", "Nausea"],
        vitals: {
          temperature: 98.6,
          bloodPressure: "140/90",
          heartRate: 95,
          respiratoryRate: 24,
          oxygenSaturation: 94,
          painScale: 8,
        },
        triageScore: 8,
        priority: "High",
        status: "active",
        assignedStaff: [
          {
            staffId: "D001",
            name: "Dr. Smith",
            role: "Cardiologist",
            assignedAt: new Date("2024-10-24T10:15:00Z"),
          },
        ],
        vitalsHistory: [
          {
            temperature: 98.6,
            bloodPressure: "140/90",
            heartRate: 95,
            respiratoryRate: 24,
            oxygenSaturation: 94,
            timestamp: new Date("2024-10-24T10:00:00Z"),
          },
        ],
        treatmentOrders: [
          {
            type: "Diagnostic",
            description: "ECG and Cardiac Enzymes",
            urgency: "STAT",
            orderedBy: "Dr. Smith",
            orderedAt: new Date("2024-10-24T10:20:00Z"),
            status: "completed",
          },
          {
            type: "Medication",
            description: "Aspirin 325mg PO",
            urgency: "STAT",
            orderedBy: "Dr. Smith",
            orderedAt: new Date("2024-10-24T10:20:00Z"),
            status: "completed",
          },
        ],
        diagnosis: "Acute Coronary Syndrome",
        disposition: "Admitted to CCU",
        estimatedLengthOfStay: 3,
        lastUpdated: new Date("2024-10-24T11:30:00Z"),
        aiInsights: {
          deteriorationRisk: "Medium",
          recommendedAction: "Immediate cardiology consultation",
          predictedOutcome: "Stable with treatment",
        },
        mlcData: {
          isMLC: true,
          injuryType: "Suspected cardiac event",
          evidence: ["Chest pain symptoms", "ECG findings"],
          firData: {
            firNumber: "FIR-2024-001",
            policeStation: "City Central Police Station",
            reportedAt: new Date("2024-10-24T10:30:00Z"),
          },
          forensicOpinion: "Suspected myocardial infarction",
          authorityNotifications: ["Police notified", "Medical officer informed"],
          digitalSignature: "Dr. Smith - Electronic signature",
          auditLog: ["Case registered - 2024-10-24T10:00:00Z", "Evidence collected - 2024-10-24T10:15:00Z"],
        },
      },
      {
        caseId: "EC-002",
        patientId: "P002",
        patientInfo: {
          name: "Sarah Johnson",
          age: 28,
          gender: "Female",
          phone: "+91-9876543212",
          emergencyContact: {
            name: "Mike Johnson",
            relationship: "Husband",
            phone: "+91-9876543213",
          },
        },
        arrivalTime: new Date("2024-10-24T09:30:00Z"),
        arrivalMode: "Walk-in",
        chiefComplaint: "Severe abdominal pain",
        symptoms: ["Right lower quadrant pain", "Nausea", "Vomiting", "Fever"],
        vitals: {
          temperature: 101.2,
          bloodPressure: "110/70",
          heartRate: 95,
          respiratoryRate: 20,
          oxygenSaturation: 98,
          painScale: 9,
        },
        triageScore: 6,
        priority: "High",
        status: "active",
        assignedStaff: [
          {
            staffId: "D002",
            name: "Dr. Wilson",
            role: "Surgeon",
            assignedAt: new Date("2024-10-24T09:45:00Z"),
          },
        ],
        vitalsHistory: [
          {
            temperature: 101.2,
            bloodPressure: "110/70",
            heartRate: 95,
            respiratoryRate: 20,
            oxygenSaturation: 98,
            timestamp: new Date("2024-10-24T09:30:00Z"),
          },
        ],
        treatmentOrders: [
          {
            type: "Diagnostic",
            description: "CT Abdomen",
            urgency: "Urgent",
            orderedBy: "Dr. Wilson",
            orderedAt: new Date("2024-10-24T09:45:00Z"),
            status: "completed",
          },
          {
            type: "Medication",
            description: "Morphine 5mg IV",
            urgency: "STAT",
            orderedBy: "Dr. Wilson",
            orderedAt: new Date("2024-10-24T09:45:00Z"),
            status: "completed",
          },
        ],
        diagnosis: "Acute Appendicitis",
        disposition: "Admitted for surgery",
        estimatedLengthOfStay: 2,
        lastUpdated: new Date("2024-10-24T10:15:00Z"),
        aiInsights: {
          deteriorationRisk: "Low",
          recommendedAction: "Surgical consultation",
          predictedOutcome: "Good prognosis with timely surgery",
        },
        mlcData: {
          isMLC: true,
          injuryType: "Suspected appendicitis",
          evidence: ["Physical examination findings", "Abdominal pain symptoms"],
          firData: {
            firNumber: "FIR-2024-002",
            policeStation: "City East Police Station",
            reportedAt: new Date("2024-10-24T09:40:00Z"),
          },
          forensicOpinion: "Suspected acute abdomen requiring surgery",
          authorityNotifications: ["Police notified", "Surgical team alerted"],
          digitalSignature: "Dr. Wilson - Electronic signature",
          auditLog: ["Case registered - 2024-10-24T09:30:00Z", "Police informed - 2024-10-24T09:40:00Z"],
        },
      },
      {
        caseId: "EC-003",
        patientId: "P003",
        patientInfo: {
          name: "Robert Chen",
          age: 67,
          gender: "Male",
          phone: "+91-9876543214",
          emergencyContact: {
            name: "Lisa Chen",
            relationship: "Daughter",
            phone: "+91-9876543215",
          },
        },
        arrivalTime: new Date("2024-10-24T08:15:00Z"),
        arrivalMode: "Ambulance",
        chiefComplaint: "Confusion and weakness",
        symptoms: ["Altered mental status", "Weakness", "Dizziness"],
        vitals: {
          temperature: 97.8,
          bloodPressure: "160/95",
          heartRate: 110,
          respiratoryRate: 22,
          oxygenSaturation: 92,
          painScale: 0,
        },
        triageScore: 10,
        priority: "Critical",
        status: "active",
        assignedStaff: [
          {
            staffId: "D003",
            name: "Dr. Patel",
            role: "Neurologist",
            assignedAt: new Date("2024-10-24T08:30:00Z"),
          },
        ],
        vitalsHistory: [
          {
            temperature: 97.8,
            bloodPressure: "160/95",
            heartRate: 110,
            respiratoryRate: 22,
            oxygenSaturation: 92,
            timestamp: new Date("2024-10-24T08:15:00Z"),
          },
        ],
        treatmentOrders: [
          {
            type: "Diagnostic",
            description: "CT Brain and ECG",
            urgency: "STAT",
            orderedBy: "Dr. Patel",
            orderedAt: new Date("2024-10-24T08:30:00Z"),
            status: "completed",
          },
          {
            type: "Medication",
            description: "Oxygen 2L/min via nasal cannula",
            urgency: "STAT",
            orderedBy: "Dr. Patel",
            orderedAt: new Date("2024-10-24T08:30:00Z"),
            status: "active",
          },
        ],
        diagnosis: "Acute Stroke",
        disposition: "Admitted to ICU",
        estimatedLengthOfStay: 7,
        lastUpdated: new Date("2024-10-24T09:00:00Z"),
        aiInsights: {
          deteriorationRisk: "High",
          recommendedAction: "Immediate thrombolysis consideration",
          predictedOutcome: "Variable - depends on intervention timing",
        },
        mlcData: {
          isMLC: true,
          injuryType: "Suspected stroke",
          evidence: ["Neurological symptoms", "CT brain findings"],
          firData: {
            firNumber: "FIR-2024-003",
            policeStation: "City Central Police Station",
            reportedAt: new Date("2024-10-24T08:45:00Z"),
          },
          forensicOpinion: "Suspected cerebrovascular accident",
          authorityNotifications: ["Police notified", "Neurology team mobilized"],
          digitalSignature: "Dr. Patel - Electronic signature",
          auditLog: ["Case registered - 2024-10-24T08:15:00Z", "Urgent notifications sent - 2024-10-24T08:30:00Z"],
        },
      },
      {
        caseId: "EC-004",
        patientId: "P004",
        patientInfo: {
          name: "Maria Garcia",
          age: 34,
          gender: "Female",
          phone: "+91-9876543216",
          emergencyContact: {
            name: "Carlos Garcia",
            relationship: "Husband",
            phone: "+91-9876543217",
          },
        },
        arrivalTime: new Date("2024-10-24T07:45:00Z"),
        arrivalMode: "Walk-in",
        chiefComplaint: "Asthma exacerbation",
        symptoms: ["Shortness of breath", "Wheezing", "Coughing"],
        vitals: {
          temperature: 98.4,
          bloodPressure: "130/85",
          heartRate: 115,
          respiratoryRate: 28,
          oxygenSaturation: 88,
          painScale: 0,
        },
        triageScore: 9,
        priority: "High",
        status: "under_treatment",
        assignedStaff: [
          {
            staffId: "D004",
            name: "Dr. Kumar",
            role: "Pulmonologist",
            assignedAt: new Date("2024-10-24T08:00:00Z"),
          },
        ],
        vitalsHistory: [
          {
            temperature: 98.4,
            bloodPressure: "130/85",
            heartRate: 115,
            respiratoryRate: 28,
            oxygenSaturation: 88,
            timestamp: new Date("2024-10-24T07:45:00Z"),
          },
          {
            temperature: 98.4,
            bloodPressure: "125/80",
            heartRate: 105,
            respiratoryRate: 24,
            oxygenSaturation: 94,
            timestamp: new Date("2024-10-24T08:30:00Z"),
          },
        ],
        treatmentOrders: [
          {
            type: "Medication",
            description: "Albuterol nebulizer",
            urgency: "STAT",
            orderedBy: "Dr. Kumar",
            orderedAt: new Date("2024-10-24T08:00:00Z"),
            status: "completed",
          },
          {
            type: "Medication",
            description: "Prednisone 40mg PO",
            urgency: "Urgent",
            orderedBy: "Dr. Kumar",
            orderedAt: new Date("2024-10-24T08:15:00Z"),
            status: "completed",
          },
        ],
        diagnosis: "Acute Asthma Exacerbation",
        disposition: "Discharged with follow-up",
        estimatedLengthOfStay: 0,
        lastUpdated: new Date("2024-10-24T09:30:00Z"),
        aiInsights: {
          deteriorationRisk: "Low",
          recommendedAction: "Inhaled steroids and follow-up",
          predictedOutcome: "Good response to treatment",
        },
        mlcData: {
          isMLC: false,
          injuryType: null,
          evidence: [],
          firData: null,
          forensicOpinion: null,
          authorityNotifications: [],
          digitalSignature: null,
          auditLog: [],
        },
      },
      {
        caseId: "EC-005",
        patientId: "P005",
        patientInfo: {
          name: "David Brown",
          age: 12,
          gender: "Male",
          phone: "+91-9876543218",
          emergencyContact: {
            name: "Jennifer Brown",
            relationship: "Mother",
            phone: "+91-9876543219",
          },
        },
        arrivalTime: new Date("2024-10-24T06:30:00Z"),
        arrivalMode: "Ambulance",
        chiefComplaint: "Fever and rash",
        symptoms: ["High fever", "Maculopapular rash", "Cough", "Runny nose"],
        vitals: {
          temperature: 102.5,
          bloodPressure: "95/60",
          heartRate: 130,
          respiratoryRate: 25,
          oxygenSaturation: 96,
          painScale: 3,
        },
        triageScore: 5,
        priority: "Medium",
        status: "completed",
        assignedStaff: [
          {
            staffId: "D005",
            name: "Dr. Singh",
            role: "Pediatrician",
            assignedAt: new Date("2024-10-24T06:45:00Z"),
          },
        ],
        vitalsHistory: [
          {
            temperature: 102.5,
            bloodPressure: "95/60",
            heartRate: 130,
            respiratoryRate: 25,
            oxygenSaturation: 96,
            timestamp: new Date("2024-10-24T06:30:00Z"),
          },
        ],
        treatmentOrders: [
          {
            type: "Medication",
            description: "Acetaminophen 15mg/kg PO",
            urgency: "Routine",
            orderedBy: "Dr. Singh",
            orderedAt: new Date("2024-10-24T06:45:00Z"),
            status: "completed",
          },
        ],
        diagnosis: "Viral Exanthem",
        disposition: "Discharged home",
        estimatedLengthOfStay: 0,
        lastUpdated: new Date("2024-10-24T08:00:00Z"),
        aiInsights: {
          deteriorationRisk: "Very Low",
          recommendedAction: "Supportive care at home",
          predictedOutcome: "Complete recovery expected",
        },
        mlcData: {
          isMLC: false,
          injuryType: null,
          evidence: [],
          firData: null,
          forensicOpinion: null,
          authorityNotifications: [],
          digitalSignature: null,
          auditLog: [],
        },
      },
    ];
    this.nextId = 6;
  }

  async find(query = {}) {
    let results = [...this.emergencyCases];

    if (query.status) {
      results = results.filter((case_) => case_.status === query.status);
    }

    if (query.priority) {
      results = results.filter((case_) => case_.priority === query.priority);
    }

    if (query.patientId) {
      results = results.filter((case_) => case_.patientId === query.patientId);
    }

    if (query.arrivalTime) {
      if (query.arrivalTime.$gte) {
        results = results.filter((case_) => new Date(case_.arrivalTime) >= new Date(query.arrivalTime.$gte));
      }
      if (query.arrivalTime.$lte) {
        results = results.filter((case_) => new Date(case_.arrivalTime) <= new Date(query.arrivalTime.$lte));
      }
    }

    return results;
  }

  async findOne(query) {
    const results = await this.find(query);
    return results.length > 0 ? results[0] : null;
  }

  async findById(caseId) {
    return this.emergencyCases.find((case_) => case_.caseId === caseId) || null;
  }

  async create(caseData) {
    const newCase = {
      caseId: `EC-${String(this.nextId).padStart(3, "0")}`,
      ...caseData,
      createdAt: new Date(),
      lastUpdated: new Date(),
    };

    this.emergencyCases.push(newCase);
    this.nextId++;

    return newCase;
  }

  async findByIdAndUpdate(caseId, updateData) {
    const caseIndex = this.emergencyCases.findIndex((case_) => case_.caseId === caseId);

    if (caseIndex === -1) {
      return null;
    }

    this.emergencyCases[caseIndex] = {
      ...this.emergencyCases[caseIndex],
      ...updateData,
      lastUpdated: new Date(),
    };

    return this.emergencyCases[caseIndex];
  }

  async countDocuments(query = {}) {
    const results = await this.find(query);
    return results.length;
  }

  // Priority queue calculation
  getPriorityQueue() {
    const activeCases = this.emergencyCases.filter((case_) => case_.status === "active");

    const queue = {
      critical: activeCases.filter((c) => c.priority === "Critical"),
      high: activeCases.filter((c) => c.priority === "High"),
      medium: activeCases.filter((c) => c.priority === "Medium"),
      low: activeCases.filter((c) => c.priority === "Low"),
    };

    const now = new Date();
    Object.keys(queue).forEach((priority) => {
      queue[priority] = queue[priority].map((case_) => ({
        ...case_,
        waitTime: Math.floor((now - new Date(case_.arrivalTime)) / (1000 * 60)), // minutes
      }));
    });

    return queue;
  }

  // Dashboard statistics
  getDashboardStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayCases = this.emergencyCases.filter((case_) => new Date(case_.arrivalTime) >= today);

    const activeCases = this.emergencyCases.filter((case_) => case_.status === "active");

    const stats = {
      today: {
        total: todayCases.length,
        critical: todayCases.filter((c) => c.priority === "Critical").length,
        high: todayCases.filter((c) => c.priority === "High").length,
        medium: todayCases.filter((c) => c.priority === "Medium").length,
        low: todayCases.filter((c) => c.priority === "Low").length,
        completed: todayCases.filter((c) => c.status === "completed").length,
      },
      active: {
        total: activeCases.length,
        critical: activeCases.filter((c) => c.priority === "Critical").length,
        high: activeCases.filter((c) => c.priority === "High").length,
        medium: activeCases.filter((c) => c.priority === "Medium").length,
        low: activeCases.filter((c) => c.priority === "Low").length,
      },
      averageWaitTime: 0,
      bedOccupancy: 85,
    };

    const completedToday = todayCases.filter((c) => c.status === "completed" && c.treatmentStartTime);

    if (completedToday.length > 0) {
      const totalWaitTime = completedToday.reduce((sum, case_) => {
        return sum + (new Date(case_.treatmentStartTime) - new Date(case_.arrivalTime));
      }, 0);
      stats.averageWaitTime = Math.floor(totalWaitTime / (completedToday.length * 1000 * 60));
    }

    return stats;
  }
}

module.exports = MockEmergencyCase;
