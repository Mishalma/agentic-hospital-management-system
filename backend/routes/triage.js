const express = require('express');
const router = express.Router();
const { Triage, Patient } = require('../models');

// Create new triage assessment
router.post('/', async (req, res) => {
    try {
        const { patientId, patientName, symptoms, vitals, medicalHistory, assignedNurse, notes } = req.body;

        // Validate required fields
        if (!patientId || !patientName || !symptoms || !assignedNurse) {
            return res.status(400).json({
                success: false,
                message: 'Patient ID, name, symptoms, and assigned nurse are required'
            });
        }

        // Validate symptoms format
        if (!Array.isArray(symptoms) || symptoms.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one symptom is required'
            });
        }

        // Create triage assessment
        const triageData = {
            patientId,
            patientName,
            symptoms,
            vitals: vitals || {},
            medicalHistory: medicalHistory || [],
            assignedNurse,
            notes: notes || ''
        };

        const triage = await Triage.create ? 
            await Triage.create(triageData) : 
            await new Triage(triageData).save();

        // Emit real-time update for high priority cases
        const io = req.app.get('io');
        if (triage.priority === 'critical' || triage.priority === 'high') {
            io.to('admin-updates').emit('high-priority-triage', {
                patientId: triage.patientId,
                patientName: triage.patientName,
                priority: triage.priority,
                riskScore: triage.riskScore,
                triageLevel: triage.triageLevel
            });
        }

        res.status(201).json({
            success: true,
            message: 'Triage assessment completed successfully',
            data: triage.toPublic ? triage.toPublic() : triage
        });

    } catch (error) {
        console.error('Error creating triage assessment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create triage assessment',
            error: error.message
        });
    }
});

// Get triage queue (sorted by priority)
router.get('/queue', async (req, res) => {
    try {
        const queue = await (Triage.getTriageQueue ? 
            Triage.getTriageQueue() :
            Triage.find({ status: { $ne: 'completed' } }));

        res.json({
            success: true,
            data: queue.map(t => t.toPublic ? t.toPublic() : t)
        });

    } catch (error) {
        console.error('Error fetching triage queue:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch triage queue',
            error: error.message
        });
    }
});

// Get triage assessments by priority
router.get('/priority/:priority', async (req, res) => {
    try {
        const { priority } = req.params;
        
        if (!['low', 'medium', 'high', 'critical'].includes(priority)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid priority level'
            });
        }

        const triages = await (Triage.getByPriority ? 
            Triage.getByPriority(priority) :
            Triage.find({ priority, status: { $ne: 'completed' } }));

        res.json({
            success: true,
            data: triages.map(t => t.toPublic ? t.toPublic() : t)
        });

    } catch (error) {
        console.error('Error fetching triages by priority:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch triages by priority',
            error: error.message
        });
    }
});

// Get triage assessment by patient ID
router.get('/patient/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;

        const triages = await (Triage.find ? 
            Triage.find({ patientId }) :
            Triage.findByPatient ? Triage.findByPatient(patientId) : []);

        res.json({
            success: true,
            data: triages.map(t => t.toPublic ? t.toPublic() : t)
        });

    } catch (error) {
        console.error('Error fetching patient triages:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch patient triages',
            error: error.message
        });
    }
});

// Update triage status
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        if (!['pending', 'in-assessment', 'waiting-doctor', 'completed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const updatedTriage = await (Triage.findByIdAndUpdate ? 
            Triage.findByIdAndUpdate(id, { status, notes }, { new: true }) :
            Triage.findByIdAndUpdate(id, { status, notes }));

        if (!updatedTriage) {
            return res.status(404).json({
                success: false,
                message: 'Triage assessment not found'
            });
        }

        res.json({
            success: true,
            message: 'Triage status updated successfully',
            data: updatedTriage.toPublic ? updatedTriage.toPublic() : updatedTriage
        });

    } catch (error) {
        console.error('Error updating triage status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update triage status',
            error: error.message
        });
    }
});

// Get triage dashboard statistics
router.get('/dashboard', async (req, res) => {
    try {
        const allTriages = await (Triage.find ? 
            Triage.find({}) : 
            Triage.getTriageQueue ? Triage.getTriageQueue() : []);

        const activeTriages = allTriages.filter(t => t.status !== 'completed');
        
        const stats = {
            total: activeTriages.length,
            byPriority: {
                critical: activeTriages.filter(t => t.priority === 'critical').length,
                high: activeTriages.filter(t => t.priority === 'high').length,
                medium: activeTriages.filter(t => t.priority === 'medium').length,
                low: activeTriages.filter(t => t.priority === 'low').length
            },
            byStatus: {
                pending: activeTriages.filter(t => t.status === 'pending').length,
                inAssessment: activeTriages.filter(t => t.status === 'in-assessment').length,
                waitingDoctor: activeTriages.filter(t => t.status === 'waiting-doctor').length
            },
            averageRiskScore: activeTriages.length > 0 ? 
                Math.round(activeTriages.reduce((sum, t) => sum + (t.riskScore || 0), 0) / activeTriages.length) : 0,
            highPriorityCount: activeTriages.filter(t => t.priority === 'critical' || t.priority === 'high').length
        };

        const recentHighPriority = activeTriages
            .filter(t => t.priority === 'critical' || t.priority === 'high')
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5)
            .map(t => t.toPublic ? t.toPublic() : t);

        res.json({
            success: true,
            data: {
                stats,
                recentHighPriority
            }
        });

    } catch (error) {
        console.error('Error fetching triage dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch triage dashboard',
            error: error.message
        });
    }
});

// Get common symptoms for autocomplete
router.get('/symptoms', async (req, res) => {
    try {
        const commonSymptoms = [
            'chest pain',
            'difficulty breathing',
            'severe bleeding',
            'unconsciousness',
            'severe headache',
            'abdominal pain',
            'fever',
            'nausea',
            'dizziness',
            'back pain',
            'joint pain',
            'fatigue',
            'cough',
            'sore throat',
            'rash',
            'vomiting',
            'diarrhea',
            'confusion',
            'seizure',
            'allergic reaction'
        ];

        res.json({
            success: true,
            data: commonSymptoms.sort()
        });

    } catch (error) {
        console.error('Error fetching symptoms:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch symptoms',
            error: error.message
        });
    }
});

module.exports = router;