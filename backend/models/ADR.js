// ADR (Adverse Drug Reaction) Model
class ADR {
  constructor() {
    this.adrs = [];
    this.nextId = 1;
  }

  // Create new ADR report
  create(adrData) {
    const adr = {
      id: `ADR${this.nextId.toString().padStart(6, '0')}`,
      reportNumber: `ADR-${new Date().getFullYear()}-${this.nextId.toString().padStart(4, '0')}`,
      ...adrData,
      reportDate: new Date(),
      status: 'submitted',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.adrs.push(adr);
    this.nextId++;
    return adr;
  }

  // Find ADR by ID
  findById(id) {
    return this.adrs.find(adr => adr.id === id);
  }

  // Find all ADRs with filters
  findAll(filters = {}) {
    let filtered = [...this.adrs];

    if (filters.patientId) {
      filtered = filtered.filter(adr => adr.patient.patientId === filters.patientId);
    }

    if (filters.drugName) {
      filtered = filtered.filter(adr => 
        adr.suspectedDrug.name.toLowerCase().includes(filters.drugName.toLowerCase())
      );
    }

    if (filters.severity) {
      filtered = filtered.filter(adr => adr.reaction.severity === filters.severity);
    }

    if (filters.status) {
      filtered = filtered.filter(adr => adr.status === filters.status);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(adr => new Date(adr.reportDate) >= new Date(filters.dateFrom));
    }

    if (filters.dateTo) {
      filtered = filtered.filter(adr => new Date(adr.reportDate) <= new Date(filters.dateTo));
    }

    return filtered.sort((a, b) => new Date(b.reportDate) - new Date(a.reportDate));
  }

  // Update ADR status
  updateStatus(id, status, notes = '') {
    const adr = this.findById(id);
    if (adr) {
      adr.status = status;
      adr.statusNotes = notes;
      adr.updatedAt = new Date();
      
      if (status === 'reviewed') {
        adr.reviewedAt = new Date();
      }
      
      return adr;
    }
    return null;
  }

  // Get ADR statistics
  getStatistics() {
    const total = this.adrs.length;
    const byStatus = {};
    const bySeverity = {};
    const byDrug = {};
    const byMonth = {};

    this.adrs.forEach(adr => {
      // By status
      byStatus[adr.status] = (byStatus[adr.status] || 0) + 1;
      
      // By severity
      const severity = adr.reaction.severity;
      bySeverity[severity] = (bySeverity[severity] || 0) + 1;
      
      // By drug
      const drugName = adr.suspectedDrug.name;
      byDrug[drugName] = (byDrug[drugName] || 0) + 1;
      
      // By month
      const month = new Date(adr.reportDate).toISOString().slice(0, 7);
      byMonth[month] = (byMonth[month] || 0) + 1;
    });

    return {
      total,
      byStatus,
      bySeverity,
      topDrugs: Object.entries(byDrug)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([drug, count]) => ({ drug, count })),
      monthlyTrend: Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({ month, count }))
    };
  }
}

// Create singleton instance
const adrModel = new ADR();

// Add some sample ADR reports
adrModel.create({
  patient: {
    patientId: 'P001',
    name: 'John Doe',
    age: 45,
    gender: 'Male',
    weight: 75,
    medicalHistory: ['Hypertension', 'Diabetes']
  },
  suspectedDrug: {
    name: 'Lisinopril',
    dosage: '10mg',
    frequency: 'Once daily',
    startDate: new Date('2024-01-15'),
    batchNumber: 'LIS2024001',
    manufacturer: 'Generic Pharma'
  },
  reaction: {
    description: 'Persistent dry cough',
    severity: 'moderate',
    onset: 'Within 2 weeks of starting medication',
    duration: 'Ongoing',
    outcome: 'recovering',
    symptoms: ['Dry cough', 'Throat irritation']
  },
  reporter: {
    name: 'Dr. Smith',
    profession: 'Physician',
    contact: 'dr.smith@hospital.com',
    institution: 'City General Hospital'
  },
  assessment: {
    causality: 'probable',
    seriousness: 'non-serious',
    expectedness: 'expected',
    dechallenge: 'positive',
    rechallenge: 'not done'
  },
  additionalInfo: {
    concomitantMeds: ['Metformin 500mg', 'Aspirin 81mg'],
    labResults: 'Normal kidney function',
    notes: 'Patient developed cough 10 days after starting Lisinopril. Cough is dry and persistent, worse at night.'
  }
});

adrModel.create({
  patient: {
    patientId: 'P002',
    name: 'Jane Smith',
    age: 32,
    gender: 'Female',
    weight: 60,
    medicalHistory: ['Asthma']
  },
  suspectedDrug: {
    name: 'Amoxicillin',
    dosage: '500mg',
    frequency: 'Three times daily',
    startDate: new Date('2024-02-01'),
    batchNumber: 'AMX2024005',
    manufacturer: 'Beta Antibiotics'
  },
  reaction: {
    description: 'Allergic skin rash',
    severity: 'mild',
    onset: 'Day 3 of treatment',
    duration: '5 days',
    outcome: 'recovered',
    symptoms: ['Skin rash', 'Itching', 'Mild swelling']
  },
  reporter: {
    name: 'Dr. Johnson',
    profession: 'Family Physician',
    contact: 'dr.johnson@clinic.com',
    institution: 'Family Health Clinic'
  },
  assessment: {
    causality: 'probable',
    seriousness: 'non-serious',
    expectedness: 'expected',
    dechallenge: 'positive',
    rechallenge: 'not done'
  },
  additionalInfo: {
    concomitantMeds: ['Albuterol inhaler'],
    labResults: 'Not performed',
    notes: 'Patient developed red, itchy rash on arms and chest. Discontinued amoxicillin and rash resolved within 5 days.'
  }
});

adrModel.create({
  patient: {
    patientId: 'P003',
    name: 'Robert Wilson',
    age: 68,
    gender: 'Male',
    weight: 80,
    medicalHistory: ['Atrial fibrillation', 'Heart failure']
  },
  suspectedDrug: {
    name: 'Warfarin',
    dosage: '5mg',
    frequency: 'Once daily',
    startDate: new Date('2024-01-20'),
    batchNumber: 'WAR2024003',
    manufacturer: 'Coumadin Co.'
  },
  reaction: {
    description: 'Excessive bleeding - nosebleeds',
    severity: 'moderate',
    onset: '2 weeks after dose increase',
    duration: '3 days',
    outcome: 'recovered',
    symptoms: ['Frequent nosebleeds', 'Easy bruising', 'Prolonged bleeding from cuts']
  },
  reporter: {
    name: 'Dr. Brown',
    profession: 'Cardiologist',
    contact: 'dr.brown@cardio.com',
    institution: 'Heart Center'
  },
  assessment: {
    causality: 'probable',
    seriousness: 'non-serious',
    expectedness: 'expected',
    dechallenge: 'positive',
    rechallenge: 'not applicable'
  },
  additionalInfo: {
    concomitantMeds: ['Digoxin 0.25mg', 'Furosemide 40mg'],
    labResults: 'INR 4.2 (target 2.0-3.0)',
    notes: 'Patient had dose increased from 2.5mg to 5mg. Developed excessive bleeding with INR of 4.2. Dose reduced and bleeding stopped.'
  }
});

module.exports = adrModel;