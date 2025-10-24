const express = require('express');
const router = express.Router();
const { Complaint, Patient } = require('../models');
const aiComplaintService = require('../services/aiComplaintService');

// Submit a new complaint
router.post('/submit', async (req, res) => {
    try {
        const {
            patientId,
            patientName,
            patientPhone,
            title,
            description,
            category,
            channel,
            language,
            isAnonymous,
            relatedAppointment
        } = req.body;

        // Validate required fields
        if (!title || !description || !patientName || !patientPhone) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: title, description, patientName, patientPhone'
            });
        }

        // AI Analysis
        const aiAnalysis = await aiComplaintService.analyzeComplaint(description, title);
        
        // Determine urgency from AI analysis if not provided
        const urgency = aiAnalysis.urgencyScore || 'medium';
        
        // Create complaint
        const complaintData = {
            patient: patientId,
            patientName,
            patientPhone,
            title,
            description,
            category: category || aiAnalysis.suggestedCategory || 'other',
            urgency,
            channel: channel || 'web',
            language: language || 'en',
            isAnonymous: isAnonymous || false,
            relatedAppointment,
            aiAnalysis
        };

        const complaint = await Complaint.create(complaintData);

        // Auto-assign based on AI analysis
        if (complaint.urgency !== 'low') {
            const assignment = await aiComplaintService.autoAssignComplaint(complaint);
            await complaint.assignTo(assignment.staffId, assignment.staffName, assignment.department);
        }

        res.status(201).json({
            success: true,
            message: 'Complaint submitted successfully',
            data: {
                complaintId: complaint.complaintId,
                status: complaint.status,
                urgency: complaint.urgency,
                category: complaint.category,
                assignedTo: complaint.assignedTo
            }
        });

    } catch (error) {
        console.error('Error submitting complaint:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit complaint',
            error: error.message
        });
    }
});

// Get complaint by ID
router.get('/:complaintId', async (req, res) => {
    try {
        const { complaintId } = req.params;
        
        const complaint = await Complaint.findByComplaintId(complaintId);
        
        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        res.json({
            success: true,
            data: complaint.toObject()
        });

    } catch (error) {
        console.error('Error fetching complaint:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch complaint',
            error: error.message
        });
    }
});

// Get complaints by patient
router.get('/patient/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;
        
        const complaints = await Complaint.findByPatient(patientId);
        
        res.json({
            success: true,
            data: complaints.map(c => c.toObject())
        });

    } catch (error) {
        console.error('Error fetching patient complaints:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch patient complaints',
            error: error.message
        });
    }
});

// Get all open complaints (for admin)
router.get('/admin/open', async (req, res) => {
    try {
        const complaints = await Complaint.getOpenComplaints();
        
        res.json({
            success: true,
            data: complaints.map(c => c.toObject())
        });

    } catch (error) {
        console.error('Error fetching open complaints:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch open complaints',
            error: error.message
        });
    }
});

// Get overdue complaints (for admin)
router.get('/admin/overdue', async (req, res) => {
    try {
        const complaints = await Complaint.getOverdueComplaints();
        
        res.json({
            success: true,
            data: complaints.map(c => c.toObject())
        });

    } catch (error) {
        console.error('Error fetching overdue complaints:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch overdue complaints',
            error: error.message
        });
    }
});

// Update complaint status
router.put('/:complaintId/status', async (req, res) => {
    try {
        const { complaintId } = req.params;
        const { status, notes, performedBy } = req.body;

        const complaint = await Complaint.findByComplaintId(complaintId);
        
        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        await complaint.updateStatus(status, performedBy, notes);

        res.json({
            success: true,
            message: 'Complaint status updated successfully',
            data: complaint.toObject()
        });

    } catch (error) {
        console.error('Error updating complaint status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update complaint status',
            error: error.message
        });
    }
});

// Assign complaint
router.put('/:complaintId/assign', async (req, res) => {
    try {
        const { complaintId } = req.params;
        const { staffId, staffName, department } = req.body;

        const complaint = await Complaint.findByComplaintId(complaintId);
        
        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        await complaint.assignTo(staffId, staffName, department);

        res.json({
            success: true,
            message: 'Complaint assigned successfully',
            data: complaint.toObject()
        });

    } catch (error) {
        console.error('Error assigning complaint:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to assign complaint',
            error: error.message
        });
    }
});

// Escalate complaint
router.put('/:complaintId/escalate', async (req, res) => {
    try {
        const { complaintId } = req.params;
        const { reason, escalatedTo, performedBy } = req.body;

        const complaint = await Complaint.findByComplaintId(complaintId);
        
        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        await complaint.escalate(reason, escalatedTo, performedBy);

        res.json({
            success: true,
            message: 'Complaint escalated successfully',
            data: complaint.toObject()
        });

    } catch (error) {
        console.error('Error escalating complaint:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to escalate complaint',
            error: error.message
        });
    }
});

// Resolve complaint
router.put('/:complaintId/resolve', async (req, res) => {
    try {
        const { complaintId } = req.params;
        const { summary, actionTaken, resolvedBy } = req.body;

        const complaint = await Complaint.findByComplaintId(complaintId);
        
        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        await complaint.resolve(summary, actionTaken, resolvedBy);

        res.json({
            success: true,
            message: 'Complaint resolved successfully',
            data: complaint.toObject()
        });

    } catch (error) {
        console.error('Error resolving complaint:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resolve complaint',
            error: error.message
        });
    }
});

// AI Analysis endpoint
router.post('/analyze', async (req, res) => {
    try {
        const { text, title } = req.body;

        if (!text) {
            return res.status(400).json({
                success: false,
                message: 'Text is required for analysis'
            });
        }

        const analysis = await aiComplaintService.analyzeComplaint(text, title);

        res.json({
            success: true,
            data: analysis
        });

    } catch (error) {
        console.error('Error analyzing complaint:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to analyze complaint',
            error: error.message
        });
    }
});

// Get complaint analytics
router.get('/admin/analytics', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        // For mock mode, provide sample analytics
        if (Complaint.storage) {
            const complaints = Array.from(Complaint.storage.values());
            const filteredComplaints = complaints.filter(c => 
                new Date(c.createdAt) >= start && new Date(c.createdAt) <= end
            );

            const analytics = {
                totalComplaints: filteredComplaints.length,
                byCategory: {},
                byStatus: {},
                byUrgency: {},
                avgResolutionTime: 24,
                satisfactionRating: 4.2
            };

            // Calculate category distribution
            filteredComplaints.forEach(c => {
                analytics.byCategory[c.category] = (analytics.byCategory[c.category] || 0) + 1;
                analytics.byStatus[c.status] = (analytics.byStatus[c.status] || 0) + 1;
                analytics.byUrgency[c.urgency] = (analytics.byUrgency[c.urgency] || 0) + 1;
            });

            return res.json({
                success: true,
                data: analytics
            });
        }

        // For MongoDB mode
        const analytics = await Complaint.getAnalytics(start, end);

        res.json({
            success: true,
            data: analytics[0] || {}
        });

    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch analytics',
            error: error.message
        });
    }
});

module.exports = router;