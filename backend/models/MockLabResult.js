class MockLabResult {
  constructor() {
    this.results = [
      {
        resultId: 'RES-001',
        orderId: 'LAB-001',
        patientId: 'P001',
        testCode: 'CBC',
        testName: 'Complete Blood Count',
        category: 'Hematology',
        specimen: 'Blood',
        results: [
          {
            parameter: 'Hemoglobin',
            value: '14.2',
            unit: 'g/dL',
            referenceRange: '12.0-15.5',
            flag: 'Normal',
            method: 'Automated',
            instrument: 'Hematology Analyzer'
          },
          {
            parameter: 'White Blood Cells',
            value: '7.8',
            unit: '10³/µL',
            referenceRange: '4.0-11.0',
            flag: 'Normal',
            method: 'Automated',
            instrument: 'Hematology Analyzer'
          },
          {
            parameter: 'Platelets',
            value: '285',
            unit: '10³/µL',
            referenceRange: '150-450',
            flag: 'Normal',
            method: 'Automated',
            instrument: 'Hematology Analyzer'
          }
        ],
        overallInterpretation: 'Complete blood count within normal limits',
        technologistComments: 'No abnormal cells observed',
        pathologistComments: 'Normal hematological parameters',
        performedBy: {
          technologist: 'Tech A',
          pathologist: 'Dr. Smith',
          supervisor: 'Lab Manager'
        },
        performedAt: new Date('2024-01-15T09:30:00Z'),
        verifiedBy: 'Dr. Smith',
        verifiedAt: new Date('2024-01-15T10:30:00Z'),
        status: 'Final',
        qcStatus: 'Pass',
        criticalValues: [],
        deltaChecks: [],
        instrumentData: {
          instrumentId: 'HEMA-001',
          runId: 'RUN-20240115-001',
          calibrationStatus: 'Valid',
          qcResults: 'Pass'
        },
        reportGenerated: true,
        reportUrl: '/reports/RES-001.pdf',
        deliveryStatus: 'Delivered',
        deliveryMethod: 'EMR',
        deliveredAt: new Date('2024-01-15T10:45:00Z'),
        createdAt: new Date('2024-01-15T09:30:00Z'),
        updatedAt: new Date('2024-01-15T10:45:00Z')
      },
      {
        resultId: 'RES-002',
        orderId: 'LAB-002',
        patientId: 'P002',
        testCode: 'LIPID',
        testName: 'Lipid Panel',
        category: 'Biochemistry',
        specimen: 'Blood',
        results: [
          {
            parameter: 'Total Cholesterol',
            value: '245',
            unit: 'mg/dL',
            referenceRange: '<200',
            flag: 'High',
            method: 'Enzymatic',
            instrument: 'Chemistry Analyzer'
          },
          {
            parameter: 'HDL Cholesterol',
            value: '38',
            unit: 'mg/dL',
            referenceRange: '>40',
            flag: 'Low',
            method: 'Enzymatic',
            instrument: 'Chemistry Analyzer'
          },
          {
            parameter: 'LDL Cholesterol',
            value: '165',
            unit: 'mg/dL',
            referenceRange: '<100',
            flag: 'High',
            method: 'Calculated',
            instrument: 'Chemistry Analyzer'
          },
          {
            parameter: 'Triglycerides',
            value: '210',
            unit: 'mg/dL',
            referenceRange: '<150',
            flag: 'High',
            method: 'Enzymatic',
            instrument: 'Chemistry Analyzer'
          }
        ],
        overallInterpretation: 'Dyslipidemia - elevated cholesterol and triglycerides',
        technologistComments: 'Sample hemolyzed slightly but results valid',
        pathologistComments: 'Recommend lifestyle modifications and consider statin therapy',
        performedBy: {
          technologist: 'Tech B',
          pathologist: 'Dr. Johnson',
          supervisor: 'Lab Manager'
        },
        performedAt: new Date('2024-01-16T10:00:00Z'),
        verifiedBy: 'Dr. Johnson',
        verifiedAt: new Date('2024-01-16T11:00:00Z'),
        status: 'Final',
        qcStatus: 'Pass',
        criticalValues: [],
        deltaChecks: [],
        instrumentData: {
          instrumentId: 'CHEM-001',
          runId: 'RUN-20240116-001',
          calibrationStatus: 'Valid',
          qcResults: 'Pass'
        },
        reportGenerated: true,
        reportUrl: '/reports/RES-002.pdf',
        deliveryStatus: 'Sent',
        deliveryMethod: 'EMR',
        deliveredAt: new Date('2024-01-16T11:15:00Z'),
        createdAt: new Date('2024-01-16T10:00:00Z'),
        updatedAt: new Date('2024-01-16T11:15:00Z')
      }
    ];
    this.nextId = 3;
  }

  async find(query = {}) {
    let results = [...this.results];
    
    if (query.patientId) {
      results = results.filter(result => result.patientId === query.patientId);
    }
    
    if (query.orderId) {
      results = results.filter(result => result.orderId === query.orderId);
    }
    
    if (query.status) {
      results = results.filter(result => result.status === query.status);
    }
    
    if (query.resultId) {
      results = results.filter(result => result.resultId === query.resultId);
    }
    
    return results;
  }

  async findOne(query) {
    const results = await this.find(query);
    return results.length > 0 ? results[0] : null;
  }

  async create(resultData) {
    const newResult = {
      resultId: `RES-${String(this.nextId).padStart(3, '0')}`,
      ...resultData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.results.push(newResult);
    this.nextId++;
    
    return newResult;
  }

  async findByIdAndUpdate(resultId, updateData) {
    const resultIndex = this.results.findIndex(result => result.resultId === resultId);
    
    if (resultIndex === -1) {
      return null;
    }
    
    this.results[resultIndex] = {
      ...this.results[resultIndex],
      ...updateData,
      updatedAt: new Date()
    };
    
    return this.results[resultIndex];
  }

  async deleteOne(query) {
    const resultIndex = this.results.findIndex(result => {
      return Object.keys(query).every(key => result[key] === query[key]);
    });
    
    if (resultIndex === -1) {
      return { deletedCount: 0 };
    }
    
    this.results.splice(resultIndex, 1);
    return { deletedCount: 1 };
  }

  async countDocuments(query = {}) {
    const results = await this.find(query);
    return results.length;
  }

  // Aggregate method for statistics
  async aggregate(pipeline) {
    let results = [...this.results];
    
    for (const stage of pipeline) {
      if (stage.$match) {
        results = results.filter(result => {
          return Object.keys(stage.$match).every(key => {
            if (key === 'performedAt' && stage.$match[key].$gte) {
              return new Date(result.performedAt) >= new Date(stage.$match[key].$gte);
            }
            return result[key] === stage.$match[key];
          });
        });
      }
      
      if (stage.$group) {
        const grouped = {};
        results.forEach(result => {
          const key = stage.$group._id === '$status' ? result.status : 'all';
          if (!grouped[key]) {
            grouped[key] = { _id: key, count: 0 };
          }
          grouped[key].count++;
        });
        results = Object.values(grouped);
      }
    }
    
    return results;
  }
}

module.exports = MockLabResult;