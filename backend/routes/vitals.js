const express = require('express');
const router = express.Router();
const { Vitals, Patient } = require('../models');

// Record new vitals
router.post('/', async (req, res) => {
    console.log('[VITALS RECORD] Starting vitals recording');
    console.log('[VITALS RECORD] Request body:', JSON.stringify(req.body, null, 2));

    try {
        const { patientId, nurseId, vitals, notes, deviceInfo } = req.body;

        // Validate required fields
        if (!patientId || !nurseId || !vitals) {
            console.log('[VITALS RECORD] Validation failed - missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Patient ID, Nurse ID, and vitals data are required'
            });
        }

        console.log(`[VITALS RECORD] Validating patient exists for patientId: ${patientId}`);

        // Verify patient exists and get patient object for reference
        let patient = null;
        let vitalsData = {};

        try {
            // Try to find patient using findByUniqueId method (works for both MongoDB and Mock)
            patient = await Patient.findByUniqueId(patientId);
            console.log(`[VITALS RECORD] Patient lookup result:`, patient ? `Found ${patient.name}` : 'Not found');
        } catch (error) {
            console.log(`[VITALS RECORD] Error during patient lookup:`, error.message);
            // If findByUniqueId doesn't exist, try alternative methods
            try {
                patient = await Patient.findOne({ uniqueId: patientId });
                console.log(`[VITALS RECORD] Alternative patient lookup result:`, patient ? `Found ${patient.name}` : 'Not found');
            } catch (altError) {
                console.log(`[VITALS RECORD] Alternative patient lookup also failed:`, altError.message);
            }
        }

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        // Determine if we're using MongoDB or Mock models
        const isMongoModel = patient._id && typeof patient._id === 'object';
        
        if (isMongoModel) {
            console.log('[VITALS RECORD] Creating vitals record with MongoDB patient reference');
            vitalsData = {
                patient: patient._id,
                nurseId,
                vitals,
                notes: notes || '',
                deviceInfo: deviceInfo || {}
            };
        } else {
            console.log('[VITALS RECORD] Creating vitals record with patientId string for Mock model');
            vitalsData = {
                patientId,
                nurseId,
                vitals,
                notes: notes || '',
                deviceInfo: deviceInfo || {}
            };
        }

        console.log('[VITALS RECORD] Attempting to save vitals with method:', Vitals.create ? 'create()' : 'new Vitals().save()');

        const newVitals = await Vitals.create(vitalsData);

        console.log('[VITALS RECORD] Vitals saved successfully, ID:', newVitals._id || newVitals.id);
        console.log('[VITALS RECORD] Alerts generated:', newVitals.alerts?.length || 0);

        // Emit real-time update for alerts
        const io = req.app.get('io');
        if (newVitals.alerts && newVitals.alerts.length > 0) {
            console.log('[VITALS RECORD] Emitting alerts to admin-updates room');
            io.to('admin-updates').emit('vitals-alert', {
                patientId,
                patientName: patient ? patient.name : null,
                alerts: newVitals.alerts,
                timestamp: new Date()
            });
        }

        console.log('[VITALS RECORD] Sending success response');
        res.status(201).json({
            success: true,
            message: 'Vitals recorded successfully',
            data: newVitals.toPublic ? newVitals.toPublic() : newVitals,
            alerts: newVitals.alerts || []
        });

    } catch (error) {
        console.error('[VITALS RECORD] Error recording vitals:', error);
        console.error('[VITALS RECORD] Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to record vitals',
            error: error.message
        });
    }
});

// Get vitals by patient ID
router.get('/patient/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;
        const limit = parseInt(req.query.limit) || 10;

        const vitals = await (Vitals.findByPatient ? 
            Vitals.findByPatient(patientId, limit) :
            Vitals.find({ patientId }).sort({ createdAt: -1 }).limit(limit));

        res.json({
            success: true,
            data: vitals.map(v => v.toPublic ? v.toPublic() : v)
        });

    } catch (error) {
        console.error('Error fetching patient vitals:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch patient vitals',
            error: error.message
        });
    }
});

// Get vitals by nurse ID
router.get('/nurse/:nurseId', async (req, res) => {
    try {
        const { nurseId } = req.params;
        const limit = parseInt(req.query.limit) || 50;

        const vitals = await (Vitals.findByNurse ? 
            Vitals.findByNurse(nurseId, limit) :
            Vitals.find({ nurseId }).sort({ createdAt: -1 }).limit(limit));

        res.json({
            success: true,
            data: vitals.map(v => v.toPublic ? v.toPublic() : v)
        });

    } catch (error) {
        console.error('Error fetching nurse vitals:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch nurse vitals',
            error: error.message
        });
    }
});

// Get all abnormal vitals (with alerts)
router.get('/abnormal', async (req, res) => {
    try {
        const abnormalVitals = await (Vitals.findAbnormal ? 
            Vitals.findAbnormal() :
            Vitals.find({ 'alerts.0': { $exists: true }, status: { $ne: 'reviewed' } }));

        res.json({
            success: true,
            data: abnormalVitals.map(v => v.toPublic ? v.toPublic() : v)
        });

    } catch (error) {
        console.error('Error fetching abnormal vitals:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch abnormal vitals',
            error: error.message
        });
    }
});

// Get unsynced vitals (not synced to EMR)
router.get('/unsynced', async (req, res) => {
    try {
        const unsyncedVitals = await (Vitals.findUnsyncedToEMR ? 
            Vitals.findUnsyncedToEMR() :
            Vitals.find({ syncedToEMR: false }));

        res.json({
            success: true,
            data: unsyncedVitals.map(v => v.toPublic ? v.toPublic() : v),
            count: unsyncedVitals.length
        });

    } catch (error) {
        console.error('Error fetching unsynced vitals:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unsynced vitals',
            error: error.message
        });
    }
});

// Update vitals status (e.g., mark as reviewed)
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['recorded', 'reviewed', 'flagged'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be: recorded, reviewed, or flagged'
            });
        }

        const updatedVitals = await (Vitals.findByIdAndUpdate ? 
            Vitals.findByIdAndUpdate(id, { status }, { new: true }) :
            Vitals.findByIdAndUpdate(id, { status }));

        if (!updatedVitals) {
            return res.status(404).json({
                success: false,
                message: 'Vitals record not found'
            });
        }

        res.json({
            success: true,
            message: 'Status updated successfully',
            data: updatedVitals.toPublic ? updatedVitals.toPublic() : updatedVitals
        });

    } catch (error) {
        console.error('Error updating vitals status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update vitals status',
            error: error.message
        });
    }
});

// Sync vitals to EMR (simulate EMR sync)
router.post('/:id/sync-emr', async (req, res) => {
    try {
        const { id } = req.params;

        // Simulate EMR sync delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const updatedVitals = await (Vitals.findByIdAndUpdate ? 
            Vitals.findByIdAndUpdate(id, { 
                syncedToEMR: true, 
                emrSyncTimestamp: new Date() 
            }, { new: true }) :
            Vitals.findByIdAndUpdate(id, { 
                syncedToEMR: true, 
                emrSyncTimestamp: new Date() 
            }));

        if (!updatedVitals) {
            return res.status(404).json({
                success: false,
                message: 'Vitals record not found'
            });
        }

        res.json({
            success: true,
            message: 'Successfully synced to EMR',
            data: updatedVitals.toPublic ? updatedVitals.toPublic() : updatedVitals
        });

    } catch (error) {
        console.error('Error syncing to EMR:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to sync to EMR',
            error: error.message
        });
    }
});

// Bulk sync all unsynced vitals to EMR
router.post('/sync-all-emr', async (req, res) => {
    try {
        const unsyncedVitals = await (Vitals.findUnsyncedToEMR ? 
            Vitals.findUnsyncedToEMR() :
            Vitals.find({ syncedToEMR: false }));

        // Simulate bulk EMR sync
        const syncPromises = unsyncedVitals.map(async (vital) => {
            await new Promise(resolve => setTimeout(resolve, 100)); // Small delay per record
            
            return Vitals.findByIdAndUpdate ? 
                Vitals.findByIdAndUpdate(vital.id || vital._id, { 
                    syncedToEMR: true, 
                    emrSyncTimestamp: new Date() 
                }) :
                Vitals.findByIdAndUpdate(vital.id || vital._id, { 
                    syncedToEMR: true, 
                    emrSyncTimestamp: new Date() 
                });
        });

        await Promise.all(syncPromises);

        res.json({
            success: true,
            message: `Successfully synced ${unsyncedVitals.length} vitals records to EMR`,
            syncedCount: unsyncedVitals.length
        });

    } catch (error) {
        console.error('Error bulk syncing to EMR:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to bulk sync to EMR',
            error: error.message
        });
    }
});

// Get vitals dashboard data
router.get('/dashboard', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get today's vitals
        const todayVitals = await Vitals.find({ 
            createdAt: { $gte: today } 
        });

        // Get abnormal vitals
        const abnormalVitals = await (Vitals.findAbnormal ? 
            Vitals.findAbnormal() :
            Vitals.find({ 'alerts.0': { $exists: true }, status: { $ne: 'reviewed' } }));

        // Get unsynced count
        const unsyncedCount = await (Vitals.findUnsyncedToEMR ? 
            (await Vitals.findUnsyncedToEMR()).length :
            (await Vitals.find({ syncedToEMR: false })).length);

        // Calculate alert severity distribution
        const alertSeverity = { low: 0, medium: 0, high: 0, critical: 0 };
        abnormalVitals.forEach(vital => {
            if (vital.alerts) {
                vital.alerts.forEach(alert => {
                    alertSeverity[alert.severity] = (alertSeverity[alert.severity] || 0) + 1;
                });
            }
        });

        res.json({
            success: true,
            data: {
                todayCount: todayVitals.length,
                abnormalCount: abnormalVitals.length,
                unsyncedCount,
                alertSeverity,
                recentAbnormal: abnormalVitals.slice(0, 5).map(v => v.toPublic ? v.toPublic() : v)
            }
        });

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
            error: error.message
        });
    }
});

module.exports = router;