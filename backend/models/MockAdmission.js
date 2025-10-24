class MockAdmission {
  constructor() {
    this.admissions = [
      {
        admissionId: 'ADM-001',
        patientId: 'P001',
        patientInfo: {
          name: 'John Doe',
          age: 45,
          gender: 'Male',
          phone: '+91-9876543210',
          email: 'john.doe@email.com',
          address: '123 Main Street, City',
          emergencyContact: {
            name: 'Jane Doe',
            relationship: 'Spouse',
            phone: '+91-9876543211'
          },
          insuranceInfo: {
            provider: 'Star Health',
            policyNumber: 'SH123456789',
            coverageType: 'Comprehensive'
          }
        },
        admissionDate: new Date('2024-01-15T14:30:00Z'),
        admissionTime: '14:30',
        admissionType: 'Planned',
        admissionSource: 'Outpatient',
        patientCategory: {
          primary: 'Medical',
          secondary: ['Cardiac'],
          specialNeeds: ['Diabetes monitoring', 'Low sodium diet'],
          riskLevel: 'Medium',
          isolationRequired: false,
          isolationType: 'None'
        },
        medicalInfo: {
          primaryDiagnosis: 'Hypertension',
          secondaryDiagnoses: ['Type 2 Diabetes', 'Hyperlipidemia'],
          chiefComplaint: 'Chest pain and shortness of breath',
          presentingSymptoms: ['Chest pain', 'Dyspnea', 'Fatigue'],
          allergies: ['Penicillin'],
          currentMedications: ['Metformin', 'Lisinopril', 'Atorvastatin'],
          medicalHistory: ['Myocardial Infarction 2020', 'Diabetes since 2018'],
          vitalSigns: {
            temperature: 98.6,
            bloodPressure: '140/90',
            heartRate: 85,
            respiratoryRate: 18,
            oxygenSaturation: 96,
            weight: 80,
            height: 175,
            bmi: 26.1
          }
        },
        bedAssignment: {
          bedId: 'BED-002',
          bedNumber: 'A102',
          ward: {
            wardName: 'General Ward A',
            floor: 1,
            wing: 'East',
            department: 'General Medicine'
          },
          assignedAt: new Date('2024-01-15T15:00:00Z'),
          assignedBy: 'Admission Clerk',
          previousBeds: []
        },
        careTeam: {
          attendingPhysician: {
            doctorId: 'D001',
            name: 'Dr. Smith',
            department: 'Cardiology',
            contactNumber: '+91-9876543220'
          },
          consultingPhysicians: [
            {
              doctorId: 'D002',
              name: 'Dr. Johnson',
              specialty: 'Endocrinology',
              consultationDate: new Date('2024-01-16T10:00:00Z'),
              notes: 'Diabetes management consultation'
            }
          ],
          primaryNurse: {
            nurseId: 'N001',
            name: 'Nurse Mary',
            shift: 'Day',
            contactNumber: '+91-9876543230'
          },
          assignedNurses: [
            {
              nurseId: 'N001',
              name: 'Nurse Mary',
              shift: 'Day',
              assignedDate: new Date('2024-01-15')
            },
            {
              nurseId: 'N002',
              name: 'Nurse Sarah',
              shift: 'Night',
              assignedDate: new Date('2024-01-15')
            }
          ]
        },
        carePlan: {
          treatmentPlan: 'Cardiac monitoring, diabetes management, medication adjustment',
          dietaryRequirements: 'Diabetic diet, low sodium, 1800 calories',
          activityLevel: 'Limited Activity',
          specialInstructions: ['Monitor blood glucose q6h', 'Daily weights', 'I&O monitoring'],
          precautions: ['Fall risk', 'Diabetic precautions'],
          expectedLengthOfStay: 3,
          estimatedDischargeDate: new Date('2024-01-18T10:00:00Z')
        },
        status: 'Admitted',
        discharge: null,
        financial: {
          estimatedCost: 15000,
          actualCost: 0,
          insuranceCoverage: 12000,
          patientResponsibility: 3000,
          paymentStatus: 'Pending',
          billingNotes: 'Insurance pre-authorization obtained'
        },
        aiInsights: {
          riskAssessment: {
            readmissionRisk: {
              type: 'Medium',
              confidence: 0.75
            },
            complicationRisk: {
              type: 'Low',
              confidence: 0.85
            },
            lengthOfStayPrediction: {
              predictedDays: 3,
              confidence: 0.80
            }
          },
          recommendations: [
            {
              type: 'Care Plan',
              recommendation: 'Consider early mobilization to prevent complications',
              priority: 'Medium',
              confidence: 0.85,
              reasoning: 'Patient has good mobility and low complication risk',
              generatedAt: new Date('2024-01-15T16:00:00Z')
            },
            {
              type: 'Discharge Planning',
              recommendation: 'Schedule diabetes education before discharge',
              priority: 'High',
              confidence: 0.90,
              reasoning: 'Patient has diabetes and needs education for self-management',
              generatedAt: new Date('2024-01-15T16:00:00Z')
            }
          ],
          optimalBedType: 'General',
          predictedComplications: ['Hypoglycemia', 'Medication non-compliance'],
          resourceRequirements: ['Diabetes educator', 'Dietitian consultation']
        },
        workflow: {
          admissionRequestedBy: 'Dr. Smith',
          admissionRequestedAt: new Date('2024-01-15T13:00:00Z'),
          admissionApprovedBy: 'Admission Manager',
          admissionApprovedAt: new Date('2024-01-15T13:30:00Z'),
          bedAssignedBy: 'Bed Manager',
          bedAssignedAt: new Date('2024-01-15T14:45:00Z'),
          admissionCompletedBy: 'Admission Clerk',
          admissionCompletedAt: new Date('2024-01-15T15:00:00Z')
        },
        notes: [
          {
            noteId: 'NOTE-001',
            type: 'Admission Note',
            content: 'Patient admitted for cardiac evaluation and diabetes management. Stable on admission.',
            author: 'Dr. Smith',
            authorRole: 'Attending Physician',
            timestamp: new Date('2024-01-15T15:30:00Z'),
            isPrivate: false
          },
          {
            noteId: 'NOTE-002',
            type: 'Nursing Note',
            content: 'Patient oriented and cooperative. Vital signs stable. No acute distress.',
            author: 'Nurse Mary',
            authorRole: 'Primary Nurse',
            timestamp: new Date('2024-01-15T16:00:00Z'),
            isPrivate: false
          }
        ],
        auditLog: [
          {
            action: 'Admission Created',
            performedBy: 'Admission Clerk',
            timestamp: new Date('2024-01-15T14:30:00Z'),
            details: 'New admission created for patient P001'
          },
          {
            action: 'Bed Assigned',
            performedBy: 'Bed Manager',
            timestamp: new Date('2024-01-15T15:00:00Z'),
            details: 'Bed A102 assigned to patient'
          }
        ],
        createdBy: 'admission_clerk',
        createdAt: new Date('2024-01-15T14:30:00Z'),
        updatedAt: new Date('2024-01-15T16:00:00Z')
      },
      {
        admissionId: 'ADM-002',
        patientId: 'P002',
        patientInfo: {
          name: 'Jane Smith',
          age: 32,
          gender: 'Female',
          phone: '+91-9876543212',
          email: 'jane.smith@email.com',
          address: '456 Oak Avenue, City',
          emergencyContact: {
            name: 'Robert Smith',
            relationship: 'Husband',
            phone: '+91-9876543213'
          },
          insuranceInfo: {
            provider: 'HDFC ERGO',
            policyNumber: 'HE987654321',
            coverageType: 'Basic'
          }
        },
        admissionDate: new Date('2024-01-16T09:15:00Z'),
        admissionTime: '09:15',
        admissionType: 'Emergency',
        admissionSource: 'Emergency Department',
        patientCategory: {
          primary: 'Surgical',
          secondary: ['Emergency'],
          specialNeeds: ['Post-operative monitoring'],
          riskLevel: 'High',
          isolationRequired: false,
          isolationType: 'None'
        },
        medicalInfo: {
          primaryDiagnosis: 'Acute Appendicitis',
          secondaryDiagnoses: [],
          chiefComplaint: 'Severe abdominal pain',
          presentingSymptoms: ['Right lower quadrant pain', 'Nausea', 'Vomiting', 'Fever'],
          allergies: ['Latex'],
          currentMedications: ['Birth control pills'],
          medicalHistory: ['No significant medical history'],
          vitalSigns: {
            temperature: 101.2,
            bloodPressure: '110/70',
            heartRate: 95,
            respiratoryRate: 20,
            oxygenSaturation: 98,
            weight: 65,
            height: 165,
            bmi: 23.9
          }
        },
        bedAssignment: {
          bedId: 'BED-003',
          bedNumber: 'ICU-001',
          ward: {
            wardName: 'Intensive Care Unit',
            floor: 2,
            wing: 'Central',
            department: 'Critical Care'
          },
          assignedAt: new Date('2024-01-16T12:00:00Z'),
          assignedBy: 'ICU Charge Nurse',
          previousBeds: []
        },
        careTeam: {
          attendingPhysician: {
            doctorId: 'D003',
            name: 'Dr. Wilson',
            department: 'Surgery',
            contactNumber: '+91-9876543240'
          },
          consultingPhysicians: [],
          primaryNurse: {
            nurseId: 'N003',
            name: 'Nurse Jennifer',
            shift: 'Day',
            contactNumber: '+91-9876543250'
          },
          assignedNurses: [
            {
              nurseId: 'N003',
              name: 'Nurse Jennifer',
              shift: 'Day',
              assignedDate: new Date('2024-01-16')
            }
          ]
        },
        carePlan: {
          treatmentPlan: 'Post-operative monitoring after appendectomy',
          dietaryRequirements: 'NPO initially, then clear liquids as tolerated',
          activityLevel: 'Bed Rest',
          specialInstructions: ['Monitor surgical site', 'Pain management', 'Early ambulation when stable'],
          precautions: ['Post-operative precautions', 'Infection prevention'],
          expectedLengthOfStay: 2,
          estimatedDischargeDate: new Date('2024-01-18T14:00:00Z')
        },
        status: 'Under Treatment',
        discharge: null,
        financial: {
          estimatedCost: 45000,
          actualCost: 0,
          insuranceCoverage: 36000,
          patientResponsibility: 9000,
          paymentStatus: 'Insurance Pending',
          billingNotes: 'Emergency surgery - insurance notification sent'
        },
        aiInsights: {
          riskAssessment: {
            readmissionRisk: {
              type: 'Low',
              confidence: 0.90
            },
            complicationRisk: {
              type: 'Low',
              confidence: 0.85
            },
            lengthOfStayPrediction: {
              predictedDays: 2,
              confidence: 0.88
            }
          },
          recommendations: [
            {
              type: 'Care Plan',
              recommendation: 'Monitor for signs of infection at surgical site',
              priority: 'High',
              confidence: 0.95,
              reasoning: 'Post-operative infection is a common complication',
              generatedAt: new Date('2024-01-16T12:30:00Z')
            },
            {
              type: 'Discharge Planning',
              recommendation: 'Ensure patient can tolerate oral intake before discharge',
              priority: 'Medium',
              confidence: 0.85,
              reasoning: 'Post-appendectomy patients need to demonstrate normal GI function',
              generatedAt: new Date('2024-01-16T12:30:00Z')
            }
          ],
          optimalBedType: 'General',
          predictedComplications: ['Surgical site infection', 'Ileus'],
          resourceRequirements: ['Wound care specialist', 'Physical therapy']
        },
        workflow: {
          admissionRequestedBy: 'Dr. Emergency',
          admissionRequestedAt: new Date('2024-01-16T08:00:00Z'),
          admissionApprovedBy: 'Emergency Manager',
          admissionApprovedAt: new Date('2024-01-16T08:15:00Z'),
          bedAssignedBy: 'ICU Manager',
          bedAssignedAt: new Date('2024-01-16T12:00:00Z'),
          admissionCompletedBy: 'ICU Clerk',
          admissionCompletedAt: new Date('2024-01-16T12:15:00Z')
        },
        notes: [
          {
            noteId: 'NOTE-003',
            type: 'Admission Note',
            content: 'Post-operative admission after uncomplicated laparoscopic appendectomy. Patient stable.',
            author: 'Dr. Wilson',
            authorRole: 'Surgeon',
            timestamp: new Date('2024-01-16T12:30:00Z'),
            isPrivate: false
          }
        ],
        auditLog: [
          {
            action: 'Emergency Admission',
            performedBy: 'Emergency Clerk',
            timestamp: new Date('2024-01-16T09:15:00Z'),
            details: 'Emergency admission for acute appendicitis'
          },
          {
            action: 'Surgery Completed',
            performedBy: 'Dr. Wilson',
            timestamp: new Date('2024-01-16T11:30:00Z'),
            details: 'Laparoscopic appendectomy completed successfully'
          }
        ],
        createdBy: 'emergency_clerk',
        createdAt: new Date('2024-01-16T09:15:00Z'),
        updatedAt: new Date('2024-01-16T12:30:00Z')
      }
    ];
    this.nextId = 3;
  }

  async find(query = {}) {
    let results = [...this.admissions];
    
    if (query.patientId) {
      results = results.filter(admission => admission.patientId === query.patientId);
    }
    
    if (query.status) {
      results = results.filter(admission => admission.status === query.status);
    }
    
    if (query.admissionType) {
      results = results.filter(admission => admission.admissionType === query.admissionType);
    }
    
    if (query['bedAssignment.bedId']) {
      results = results.filter(admission => admission.bedAssignment?.bedId === query['bedAssignment.bedId']);
    }
    
    if (query.admissionDate) {
      if (query.admissionDate.$gte) {
        results = results.filter(admission => new Date(admission.admissionDate) >= new Date(query.admissionDate.$gte));
      }
      if (query.admissionDate.$lte) {
        results = results.filter(admission => new Date(admission.admissionDate) <= new Date(query.admissionDate.$lte));
      }
    }
    
    return results;
  }

  async findOne(query) {
    const results = await this.find(query);
    return results.length > 0 ? results[0] : null;
  }

  async create(admissionData) {
    const newAdmission = {
      admissionId: `ADM-${String(this.nextId).padStart(3, '0')}`,
      ...admissionData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.admissions.push(newAdmission);
    this.nextId++;
    
    return newAdmission;
  }

  async findByIdAndUpdate(admissionId, updateData) {
    const admissionIndex = this.admissions.findIndex(admission => admission.admissionId === admissionId);
    
    if (admissionIndex === -1) {
      return null;
    }
    
    this.admissions[admissionIndex] = {
      ...this.admissions[admissionIndex],
      ...updateData,
      updatedAt: new Date()
    };
    
    return this.admissions[admissionIndex];
  }

  async deleteOne(query) {
    const admissionIndex = this.admissions.findIndex(admission => {
      return Object.keys(query).every(key => admission[key] === query[key]);
    });
    
    if (admissionIndex === -1) {
      return { deletedCount: 0 };
    }
    
    this.admissions.splice(admissionIndex, 1);
    return { deletedCount: 1 };
  }

  async countDocuments(query = {}) {
    const results = await this.find(query);
    return results.length;
  }

  async aggregate(pipeline) {
    let results = [...this.admissions];
    
    for (const stage of pipeline) {
      if (stage.$match) {
        results = results.filter(admission => {
          return Object.keys(stage.$match).every(key => {
            if (key === 'admissionDate' && stage.$match[key].$gte) {
              return new Date(admission.admissionDate) >= new Date(stage.$match[key].$gte);
            }
            return admission[key] === stage.$match[key];
          });
        });
      }
      
      if (stage.$group) {
        const grouped = {};
        results.forEach(admission => {
          let key;
          if (stage.$group._id === '$status') {
            key = admission.status;
          } else if (stage.$group._id === '$admissionType') {
            key = admission.admissionType;
          } else if (stage.$group._id === '$patientCategory.primary') {
            key = admission.patientCategory.primary;
          } else {
            key = 'all';
          }
          
          if (!grouped[key]) {
            grouped[key] = { 
              _id: key, 
              count: 0,
              totalCost: 0,
              averageStay: 0
            };
          }
          
          grouped[key].count++;
          grouped[key].totalCost += admission.financial?.estimatedCost || 0;
          grouped[key].averageStay += admission.carePlan?.expectedLengthOfStay || 0;
        });
        
        // Calculate averages
        Object.values(grouped).forEach(group => {
          group.averageStay = group.averageStay / group.count;
        });
        
        results = Object.values(grouped);
      }
    }
    
    return results;
  }
}

module.exports = MockAdmission;