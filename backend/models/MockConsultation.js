class MockConsultation {
  constructor() {
    this.consultations = [
      {
        id: 'CONS001',
        patientId: 'PAT001',
        doctorId: 'DOC001',
        appointmentId: 'APT001',
        consultationDate: new Date('2024-10-24T09:00:00'),
        chiefComplaint: 'Chest pain and shortness of breath',
        historyOfPresentIllness: 'Patient reports chest pain for 2 days, worse with exertion',
        pastMedicalHistory: 'Hypertension, diabetes mellitus type 2',
        medications: [
          {
            name: 'Metformin',
            dosage: '500mg',
            frequency: 'BID',
            status: 'active'
          },
          {
            name: 'Lisinopril',
            dosage: '10mg',
            frequency: 'Daily',
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
          oxygenSaturation: 96,
          weight: 180,
          height: 70,
          bmi: 25.8
        },
        symptoms: [
          {
            symptom: 'Chest pain',
            severity: 7,
            duration: '2 days',
            onset: 'gradual',
            character: 'pressure-like'
          },
          {
            symptom: 'Shortness of breath',
            severity: 5,
            duration: '2 days',
            onset: 'with exertion',
            character: 'progressive'
          }
        ],
        assessment: {
          primaryDiagnosis: 'Unstable angina',
          differentialDiagnosis: ['Myocardial infarction', 'Pulmonary embolism', 'Anxiety'],
          clinicalNotes: 'Patient requires immediate cardiac evaluation'
        },
        aiSuggestions: {
          requested: true,
          response: {
            differentialDiagnosis: ['Unstable angina', 'NSTEMI', 'Pulmonary embolism'],
            investigations: ['ECG', 'Troponin levels', 'Chest X-ray', 'D-dimer'],
            treatment: 'Immediate cardiology consultation, aspirin, beta-blocker',
            redFlags: ['Worsening chest pain', 'Syncope', 'Severe dyspnea'],
            followUp: 'Cardiology within 24 hours',
            confidence: 85,
            timestamp: new Date()
          }
        },
        investigations: [
          {
            test: 'ECG',
            status: 'ordered',
            orderDate: new Date()
          },
          {
            test: 'Troponin I',
            status: 'ordered',
            orderDate: new Date()
          }
        ],
        consultationStatus: 'in-progress',
        consultationType: 'initial'
      },
      {
        id: 'CONS002',
        patientId: 'PAT002',
        doctorId: 'DOC001',
        consultationDate: new Date('2024-10-24T10:30:00'),
        chiefComplaint: 'Fever and cough for 5 days',
        historyOfPresentIllness: 'Productive cough with yellow sputum, fever up to 101°F',
        pastMedicalHistory: 'No significant past medical history',
        medications: [],
        allergies: [],
        vitals: {
          bloodPressure: { systolic: 120, diastolic: 80 },
          heartRate: 95,
          temperature: 101.2,
          respiratoryRate: 22,
          oxygenSaturation: 94
        },
        symptoms: [
          {
            symptom: 'Cough',
            severity: 6,
            duration: '5 days',
            onset: 'gradual',
            character: 'productive'
          },
          {
            symptom: 'Fever',
            severity: 7,
            duration: '5 days',
            onset: 'acute',
            character: 'intermittent'
          }
        ],
        assessment: {
          primaryDiagnosis: 'Community-acquired pneumonia',
          differentialDiagnosis: ['Bronchitis', 'Viral pneumonia'],
          clinicalNotes: 'Likely bacterial pneumonia, start antibiotics'
        },
        consultationStatus: 'completed',
        consultationType: 'initial'
      }
    ];

    this.prescriptions = [
      {
        id: 'RX001',
        consultationId: 'CONS002',
        patientId: 'PAT002',
        doctorId: 'DOC001',
        prescriptionNumber: 'RX202410240001',
        prescriptionDate: new Date('2024-10-24T10:45:00'),
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
            indication: 'Pneumonia'
          }
        ],
        diagnosis: {
          primary: 'Community-acquired pneumonia'
        },
        status: 'sent'
      }
    ];
  }

  async findAll(filters = {}) {
    let result = [...this.consultations];
    
    if (filters.patientId) {
      result = result.filter(c => c.patientId === filters.patientId);
    }
    
    if (filters.doctorId) {
      result = result.filter(c => c.doctorId === filters.doctorId);
    }
    
    if (filters.status) {
      result = result.filter(c => c.consultationStatus === filters.status);
    }
    
    if (filters.dateFrom) {
      result = result.filter(c => c.consultationDate >= new Date(filters.dateFrom));
    }
    
    if (filters.dateTo) {
      result = result.filter(c => c.consultationDate <= new Date(filters.dateTo));
    }
    
    return result;
  }

  async findById(id) {
    return this.consultations.find(c => c.id === id);
  }

  async create(consultationData) {
    const newConsultation = {
      id: `CONS${String(this.consultations.length + 1).padStart(3, '0')}`,
      ...consultationData,
      consultationDate: consultationData.consultationDate || new Date(),
      consultationStatus: consultationData.consultationStatus || 'in-progress'
    };
    
    this.consultations.push(newConsultation);
    return newConsultation;
  }

  async update(id, updateData) {
    const index = this.consultations.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    this.consultations[index] = { ...this.consultations[index], ...updateData };
    return this.consultations[index];
  }

  async delete(id) {
    const index = this.consultations.findIndex(c => c.id === id);
    if (index === -1) return false;
    
    this.consultations.splice(index, 1);
    return true;
  }

  // Prescription methods
  async findPrescriptions(filters = {}) {
    let result = [...this.prescriptions];
    
    if (filters.patientId) {
      result = result.filter(p => p.patientId === filters.patientId);
    }
    
    if (filters.consultationId) {
      result = result.filter(p => p.consultationId === filters.consultationId);
    }
    
    return result;
  }

  async createPrescription(prescriptionData) {
    const newPrescription = {
      id: `RX${String(this.prescriptions.length + 1).padStart(3, '0')}`,
      prescriptionNumber: `RX${Date.now()}${String(this.prescriptions.length + 1).padStart(4, '0')}`,
      ...prescriptionData,
      prescriptionDate: prescriptionData.prescriptionDate || new Date(),
      status: prescriptionData.status || 'draft'
    };
    
    this.prescriptions.push(newPrescription);
    return newPrescription;
  }

  async getConsultationStats(doctorId) {
    const doctorConsultations = this.consultations.filter(c => c.doctorId === doctorId);
    
    return {
      total: doctorConsultations.length,
      today: doctorConsultations.filter(c => 
        c.consultationDate.toDateString() === new Date().toDateString()
      ).length,
      inProgress: doctorConsultations.filter(c => c.consultationStatus === 'in-progress').length,
      completed: doctorConsultations.filter(c => c.consultationStatus === 'completed').length,
      prescriptionsWritten: this.prescriptions.filter(p => p.doctorId === doctorId).length
    };
  }
}

module.exports = new MockConsultation();