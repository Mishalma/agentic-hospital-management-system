const express = require('express');
const router = express.Router();

// Mock emergency case data for development (will be replaced with actual models in task 1)
const mockEmergencyCases = [
    {
        _id: '1',
        caseNumber: 'ER-2024-001',
        patientUniqueId: 'P001',
        patientName: 'John Doe',
        registrationTime: new Date('2024-01-15T08:30:00Z'),
        chiefComplaint: 'Chest pain',
        triageScore: 4,
        priorityLevel: 'Critical',
        currentStatus: 'Triaged',
        assignedProvider: 'Dr. Smith',
        bedAssignment: 'ER-01',
        estimatedWaitTime: 15,
        vitalSigns: {
            bloodPressure: '180/110',
            heartRate: 95,
            temperature: 98.6,
            oxygenSaturation: 96,
            respiratoryRate: 22,
            painScale: 8,
            timestamp: new Date('2024-01-15T08:35:00Z')
        },
        qualityMetrics: {
            doorToDoctorTime: 12,
            lengthOfStay: 45
        },
        createdAt: new Date('2024-01-15T08:30:00Z'),
        updatedAt: new Date('2024-01-15T08:45:00Z')
    },
    {
        _id: '2',
        caseNumber: 'ER-2024-002',
        patientUniqueId: 'P002',
        patientName: 'Jane Smith',
        registrationTime: new Date('2024-01-15T09:00:00Z'),
        chiefComplaint: 'Severe headache',
        triageScore: 3,
        priorityLevel: 'Urgent',
        currentStatus: 'In Treatment',
        assignedProvider: 'Dr. Johnson',
        bedAssignment: 'ER-03',
        estimatedWaitTime: 30,
        vitalSigns: {
            bloodPressure: '140/90',
            heartRate: 88,
            temperature: 99.2,
            oxygenSaturation: 98,
            respiratoryRate: 18,
            painScale: 7,
            timestamp: new Date('2024-01-15T09:05:00Z')
        },
        qualityMetrics: {
            doorToDoctorTime: 25,
            lengthOfStay: 90
        },
        createdAt: new Date('2024-01-15T09:00:00Z'),
        updatedAt: new Date('2024-01-15T09:30:00Z')
    },
    {
        _id: '3',
        caseNumber: 'ER-2024-003',
        patientUniqueId: 'P003',
        patientName: 'Bob Wilson',
        registrationTime: new Date('2024-01-15T09:15:00Z'),
        chiefComplaint: 'Ankle injury',
        triageScore: 2,
        priorityLevel: 'Less Urgent',
        currentStatus: 'Registered',
        assignedProvider: null,
        bedAssignment: null,
        estimatedWaitTime: 60,
        vitalSigns: {
            bloodPressure: '120/80',
            heartRate: 72,
            temperature: 98.4,
            oxygenSaturation: 99,
            respiratoryRate: 16,
            painScale: 4,
            timestamp: new Date('2024-01-15T09:20:00Z')
        },
        qualityMetrics: {
            doorToDoctorTime: null,
            lengthOfStay: 30
        },
        createdAt: new Date('2024-01-15T09:15:00Z'),
        updatedAt: new Date('2024-01-15T09:20:00Z')
    }
];

// GET /api/er-queue - Get emergency queue display
router.get('/', async (req, res) => {
    try {
        const { priority, status } = req.query;
        
        // Filter cases based on query parameters
        let filteredCases = [...mockEmergencyCases];
        
        if (priority) {
            filteredCases = filteredCases.filter(case_ => 
                case_.priorityLevel.toLowerCase() === priority.toLowerCase()
            );
        }
        
        if (status) {
            filteredCases = filteredCases.filter(case_ => 
                case_.currentStatus.toLowerCase() === status.toLowerCase()
            );
        }
        
        // Sort by priority (Critical > Urgent > Less Urgent > Non-Urgent) and registration time
        const priorityOrder = { 'Critical': 4, 'Urgent': 3, 'Less Urgent': 2, 'Non-Urgent': 1 };
        filteredCases.sort((a, b) => {
            const priorityDiff = priorityOrder[b.priorityLevel] - priorityOrder[a.priorityLevel];
            if (priorityDiff !== 0) return priorityDiff;
            return new Date(a.registrationTime) - new Date(b.registrationTime);
        });
        
        // Calculate wait times for active cases
        const now = new Date();
        const casesWithWaitTime = filteredCases.map(case_ => {
            const actualWaitTime = Math.floor((now - new Date(case_.registrationTime)) / (1000 * 60));
            const isOverdue = actualWaitTime > case_.estimatedWaitTime;
            
            return {
                ...case_,
                actualWaitTime,
                isOverdue,
                timeInSystem: actualWaitTime
            };
        });
        
        // Emit real-time update for queue changes
        const io = req.app.get('io');
        if (io) {
            io.to('queue-updates').emit('er-queue-update', {
                totalCases: casesWithWaitTime.length,
                criticalCases: casesWithWaitTime.filter(c => c.priorityLevel === 'Critical').length,
                overdueCases: casesWithWaitTime.filter(c => c.isOverdue).length
            });
        }
        
        res.json({
            success: true,
            data: casesWithWaitTime,
            meta: {
                total: casesWithWaitTime.length,
                filtered: !!priority || !!status,
                filters: { priority, status }
            }
        });
        
    } catch (error) {
        console.error('Error fetching emergency queue:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch emergency queue',
            error: error.message
        });
    }
});

// GET /api/er-queue/metrics - Get dashboard statistics
router.get('/metrics', async (req, res) => {
    try {
        const { dateRange } = req.query;
        
        // Calculate current queue metrics
        const now = new Date();
        const activeCases = mockEmergencyCases.filter(case_ => 
            case_.currentStatus !== 'Discharged' && case_.currentStatus !== 'Admitted'
        );
        
        // Priority distribution
        const priorityStats = {
            critical: activeCases.filter(c => c.priorityLevel === 'Critical').length,
            urgent: activeCases.filter(c => c.priorityLevel === 'Urgent').length,
            lessUrgent: activeCases.filter(c => c.priorityLevel === 'Less Urgent').length,
            nonUrgent: activeCases.filter(c => c.priorityLevel === 'Non-Urgent').length
        };
        
        // Status distribution
        const statusStats = {
            registered: activeCases.filter(c => c.currentStatus === 'Registered').length,
            triaged: activeCases.filter(c => c.currentStatus === 'Triaged').length,
            inTreatment: activeCases.filter(c => c.currentStatus === 'In Treatment').length,
            waitingDisposition: activeCases.filter(c => c.currentStatus === 'Waiting Disposition').length
        };
        
        // Calculate average metrics
        const casesWithDoorToDoctor = mockEmergencyCases.filter(c => c.qualityMetrics.doorToDoctorTime);
        const avgDoorToDoctorTime = casesWithDoorToDoctor.length > 0 ? 
            Math.round(casesWithDoorToDoctor.reduce((sum, c) => sum + c.qualityMetrics.doorToDoctorTime, 0) / casesWithDoorToDoctor.length) : 0;
        
        const avgLengthOfStay = mockEmergencyCases.length > 0 ? 
            Math.round(mockEmergencyCases.reduce((sum, c) => sum + c.qualityMetrics.lengthOfStay, 0) / mockEmergencyCases.length) : 0;
        
        // Calculate overdue cases
        const overdueCases = activeCases.filter(case_ => {
            const actualWaitTime = Math.floor((now - new Date(case_.registrationTime)) / (1000 * 60));
            return actualWaitTime > case_.estimatedWaitTime;
        });
        
        // Bed utilization
        const occupiedBeds = activeCases.filter(c => c.bedAssignment).length;
        const totalBeds = 10; // Mock total bed count
        const bedUtilization = Math.round((occupiedBeds / totalBeds) * 100);
        
        // Performance thresholds
        const performanceAlerts = [];
        if (avgDoorToDoctorTime > 30) {
            performanceAlerts.push({
                type: 'warning',
                message: 'Average door-to-doctor time exceeds 30 minutes',
                value: avgDoorToDoctorTime,
                threshold: 30
            });
        }
        
        if (overdueCases.length > 0) {
            performanceAlerts.push({
                type: 'alert',
                message: `${overdueCases.length} cases are overdue`,
                value: overdueCases.length,
                threshold: 0
            });
        }
        
        if (bedUtilization > 85) {
            performanceAlerts.push({
                type: 'warning',
                message: 'Bed utilization exceeds 85%',
                value: bedUtilization,
                threshold: 85
            });
        }
        
        const metrics = {
            currentQueue: {
                totalActive: activeCases.length,
                byPriority: priorityStats,
                byStatus: statusStats,
                overdueCases: overdueCases.length
            },
            qualityMetrics: {
                avgDoorToDoctorTime,
                avgLengthOfStay,
                bedUtilization,
                patientThroughput: mockEmergencyCases.length // Daily throughput
            },
            performanceAlerts,
            resourceUtilization: {
                occupiedBeds,
                totalBeds,
                utilizationPercentage: bedUtilization,
                availableBeds: totalBeds - occupiedBeds
            },
            timestamp: now
        };
        
        res.json({
            success: true,
            data: metrics
        });
        
    } catch (error) {
        console.error('Error fetching emergency metrics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch emergency metrics',
            error: error.message
        });
    }
});

// PATCH /api/er-queue/:id/status - Update case status
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes, assignedProvider, bedAssignment } = req.body;
        
        // Validate status
        const validStatuses = ['Registered', 'Triaged', 'In Treatment', 'Waiting Disposition', 'Discharged', 'Admitted'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Valid statuses are: ' + validStatuses.join(', ')
            });
        }
        
        // Find the case (in real implementation, this would be a database query)
        const caseIndex = mockEmergencyCases.findIndex(case_ => case_._id === id);
        if (caseIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Emergency case not found'
            });
        }
        
        // Update the case
        const updatedCase = {
            ...mockEmergencyCases[caseIndex],
            currentStatus: status,
            updatedAt: new Date()
        };
        
        // Update optional fields if provided
        if (assignedProvider) {
            updatedCase.assignedProvider = assignedProvider;
        }
        
        if (bedAssignment) {
            updatedCase.bedAssignment = bedAssignment;
        }
        
        // Calculate door-to-doctor time if moving to treatment
        if (status === 'In Treatment' && !updatedCase.qualityMetrics.doorToDoctorTime) {
            const doorToDoctorTime = Math.floor((new Date() - new Date(updatedCase.registrationTime)) / (1000 * 60));
            updatedCase.qualityMetrics.doorToDoctorTime = doorToDoctorTime;
        }
        
        // Update the mock data
        mockEmergencyCases[caseIndex] = updatedCase;
        
        // Emit real-time update
        const io = req.app.get('io');
        if (io) {
            io.to('queue-updates').emit('case-status-update', {
                caseId: id,
                caseNumber: updatedCase.caseNumber,
                patientName: updatedCase.patientName,
                oldStatus: mockEmergencyCases[caseIndex].currentStatus,
                newStatus: status,
                priorityLevel: updatedCase.priorityLevel,
                timestamp: updatedCase.updatedAt
            });
            
            // Send alert for high priority status changes
            if (updatedCase.priorityLevel === 'Critical' || updatedCase.priorityLevel === 'Urgent') {
                io.to('admin-updates').emit('high-priority-status-change', {
                    caseNumber: updatedCase.caseNumber,
                    patientName: updatedCase.patientName,
                    newStatus: status,
                    priorityLevel: updatedCase.priorityLevel
                });
            }
        }
        
        res.json({
            success: true,
            message: 'Case status updated successfully',
            data: updatedCase
        });
        
    } catch (error) {
        console.error('Error updating case status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update case status',
            error: error.message
        });
    }
});

module.exports = router;