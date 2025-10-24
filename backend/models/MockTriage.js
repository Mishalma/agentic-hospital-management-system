// Mock Triage Model for demo mode
class MockTriage {
    constructor() {
        this.triages = new Map();
        this.nextId = 1;
        this.seedData();
    }

    seedData() {
        const sampleTriages = [
            {
                id: '1',
                patientId: 'PT2024123456',
                patientName: 'John Smith',
                symptoms: [
                    { symptom: 'chest pain', severity: 'severe', duration: '<1h' }
                ],
                vitals: {
                    bloodPressure: { systolic: 180, diastolic: 110 },
                    heartRate: 120,
                    temperature: { value: 99.5, unit: 'F' },
                    oxygenSaturation: 92,
                    painLevel: 8
                },
                medicalHistory: [
                    { condition: 'hypertension', severity: 'moderate' }
                ],
                assignedNurse: 'NURSE001',
                status: 'pending',
                notes: 'Patient reports severe chest pain radiating to left arm',
                createdAt: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
            },
            {
                id: '2',
                patientId: 'PT2024789012',
                patientName: 'Emily Davis',
                symptoms: [
                    { symptom: 'fever', severity: 'moderate', duration: '6-24h' },
                    { symptom: 'nausea', severity: 'mild', duration: '1-6h' }
                ],
                vitals: {
                    temperature: { value: 102.1, unit: 'F' },
                    heartRate: 95,
                    bloodPressure: { systolic: 125, diastolic: 80 },
                    painLevel: 4
                },
                medicalHistory: [],
                assignedNurse: 'NURSE002',
                status: 'in-assessment',
                notes: 'Flu-like symptoms, monitoring temperature',
                createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
            },
            {
                id: '3',
                patientId: 'PT2024345678',
                patientName: 'Robert Wilson',
                symptoms: [
                    { symptom: 'back pain', severity: 'mild', duration: '>24h' }
                ],
                vitals: {
                    bloodPressure: { systolic: 130, diastolic: 85 },
                    heartRate: 75,
                    painLevel: 3
                },
                medicalHistory: [],
                assignedNurse: 'NURSE001',
                status: 'waiting-doctor',
                notes: 'Chronic lower back pain, routine visit',
                createdAt: new Date(Date.now() - 45 * 60 * 1000) // 45 minutes ago
            }
        ];

        sampleTriages.forEach(triage => {
            const triageObj = this.calculateScores(triage);
            this.triages.set(triage.id, triageObj);
        });
        this.nextId = 4;
    }

    calculateScores(triageData) {
        let score = 0;
        
        // Symptom scoring
        triageData.symptoms.forEach(symptom => {
            const symptomScores = {
                'chest pain': { mild: 15, moderate: 25, severe: 40 },
                'difficulty breathing': { mild: 20, moderate: 30, severe: 45 },
                'severe bleeding': { mild: 25, moderate: 35, severe: 50 },
                'unconsciousness': { mild: 40, moderate: 50, severe: 60 },
                'severe headache': { mild: 10, moderate: 20, severe: 30 },
                'abdominal pain': { mild: 8, moderate: 15, severe: 25 },
                'fever': { mild: 5, moderate: 10, severe: 20 },
                'nausea': { mild: 3, moderate: 6, severe: 12 },
                'dizziness': { mild: 5, moderate: 10, severe: 18 },
                'back pain': { mild: 4, moderate: 8, severe: 15 }
            };
            
            const symptomKey = symptom.symptom.toLowerCase();
            if (symptomScores[symptomKey]) {
                score += symptomScores[symptomKey][symptom.severity] || 5;
            } else {
                score += { mild: 3, moderate: 8, severe: 15 }[symptom.severity] || 5;
            }
            
            // Duration factor
            const durationMultiplier = {
                '<1h': 1.2,
                '1-6h': 1.0,
                '6-24h': 0.8,
                '>24h': 0.6
            };
            score *= durationMultiplier[symptom.duration] || 1.0;
        });
        
        // Vital signs scoring
        if (triageData.vitals) {
            const vitals = triageData.vitals;
            
            // Blood pressure
            if (vitals.bloodPressure) {
                const sys = vitals.bloodPressure.systolic;
                const dia = vitals.bloodPressure.diastolic;
                if (sys >= 180 || dia >= 120) score += 20;
                else if (sys >= 160 || dia >= 100) score += 15;
                else if (sys < 90 || dia < 60) score += 12;
            }
            
            // Heart rate
            if (vitals.heartRate) {
                if (vitals.heartRate > 120 || vitals.heartRate < 50) score += 15;
                else if (vitals.heartRate > 100 || vitals.heartRate < 60) score += 8;
            }
            
            // Temperature
            if (vitals.temperature && vitals.temperature.value) {
                const temp = vitals.temperature.value;
                const unit = vitals.temperature.unit;
                const tempF = unit === 'C' ? (temp * 9/5) + 32 : temp;
                
                if (tempF >= 103) score += 15;
                else if (tempF >= 101) score += 10;
                else if (tempF < 95) score += 12;
            }
            
            // Oxygen saturation
            if (vitals.oxygenSaturation) {
                if (vitals.oxygenSaturation < 90) score += 20;
                else if (vitals.oxygenSaturation < 95) score += 10;
            }
            
            // Pain level
            if (vitals.painLevel) {
                if (vitals.painLevel >= 8) score += 15;
                else if (vitals.painLevel >= 6) score += 10;
                else if (vitals.painLevel >= 4) score += 5;
            }
        }
        
        // Medical history factor
        if (triageData.medicalHistory) {
            triageData.medicalHistory.forEach(condition => {
                const historyScores = { mild: 2, moderate: 5, severe: 10 };
                score += historyScores[condition.severity] || 3;
            });
        }
        
        const riskScore = Math.min(Math.round(score), 100);
        
        // Determine priority and triage level
        let priority, triageLevel;
        if (riskScore >= 70) {
            priority = 'critical';
            triageLevel = 1;
        } else if (riskScore >= 50) {
            priority = 'high';
            triageLevel = 2;
        } else if (riskScore >= 25) {
            priority = 'medium';
            triageLevel = 3;
        } else if (riskScore >= 10) {
            priority = 'low';
            triageLevel = 4;
        } else {
            priority = 'low';
            triageLevel = 5;
        }
        
        // Calculate wait time
        const baseWaitTimes = { 1: 0, 2: 15, 3: 60, 4: 120, 5: 240 };
        const estimatedWaitTime = baseWaitTimes[triageLevel] || 60;
        
        return {
            ...triageData,
            riskScore,
            priority,
            triageLevel,
            estimatedWaitTime
        };
    }

    async create(triageData) {
        const id = this.nextId.toString();
        this.nextId++;

        const newTriage = this.calculateScores({
            id,
            ...triageData,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        this.triages.set(id, newTriage);
        return newTriage;
    }

    async findById(id) {
        return this.triages.get(id) || null;
    }

    async find(query = {}) {
        let results = Array.from(this.triages.values());

        // Apply filters
        if (query.patientId) {
            results = results.filter(t => t.patientId === query.patientId);
        }
        if (query.status) {
            results = results.filter(t => t.status === query.status);
        }
        if (query.priority) {
            results = results.filter(t => t.priority === query.priority);
        }

        return results;
    }

    async getTriageQueue() {
        const results = await this.find({ status: { $ne: 'completed' } });
        return results.sort((a, b) => {
            // Sort by triage level first, then risk score, then creation time
            if (a.triageLevel !== b.triageLevel) {
                return a.triageLevel - b.triageLevel;
            }
            if (a.riskScore !== b.riskScore) {
                return b.riskScore - a.riskScore;
            }
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
    }

    async getByPriority(priority) {
        const results = await this.find({ priority, status: { $ne: 'completed' } });
        return results.sort((a, b) => {
            if (a.riskScore !== b.riskScore) {
                return b.riskScore - a.riskScore;
            }
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
    }

    async findByIdAndUpdate(id, update) {
        const triage = this.triages.get(id);
        if (!triage) return null;

        const updated = {
            ...triage,
            ...update,
            updatedAt: new Date()
        };

        this.triages.set(id, updated);
        return updated;
    }

    async deleteMany(query) {
        const results = await this.find(query);
        results.forEach(triage => {
            this.triages.delete(triage.id);
        });
        return { deletedCount: results.length };
    }
}

module.exports = MockTriage;