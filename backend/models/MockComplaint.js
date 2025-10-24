// Mock Complaint model for demo mode when MongoDB is not available
class MockComplaint {
    constructor(data) {
        this.id = data.id || this.generateId();
        this._id = this.id;
        this.patient = data.patient;
        this.patientName = data.patientName;
        this.patientPhone = data.patientPhone;
        this.complaintId = data.complaintId || this.generateComplaintId();
        this.title = data.title;
        this.description = data.description;
        this.category = data.category;
        this.subcategory = data.subcategory;
        this.urgency = data.urgency || 'medium';
        this.priority = data.priority || 3;
        this.status = data.status || 'open';
        this.channel = data.channel;
        this.language = data.language || 'en';
        this.assignedTo = data.assignedTo;
        this.attachments = data.attachments || [];
        this.aiAnalysis = data.aiAnalysis || {};
        this.timeline = data.timeline || [];
        this.resolution = data.resolution;
        this.sla = data.sla || this.calculateSLA();
        this.escalation = data.escalation || { level: 0 };
        this.relatedAppointment = data.relatedAppointment;
        this.tags = data.tags || [];
        this.isAnonymous = data.isAnonymous || false;
        this.followUpRequired = data.followUpRequired || false;
        this.followUpDate = data.followUpDate;
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    generateId() {
        return 'mock_cmp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateComplaintId() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(1000 + Math.random() * 9000);
        return `CMP${year}${month}${day}${random}`;
    }

    calculateSLA() {
        const now = new Date();
        const responseHours = this.urgency === 'critical' ? 1 : this.urgency === 'high' ? 4 : 24;
        const resolutionHours = this.urgency === 'critical' ? 4 : this.urgency === 'high' ? 24 : 72;
        
        return {
            responseTime: responseHours,
            resolutionTime: resolutionHours,
            responseDeadline: new Date(now.getTime() + responseHours * 60 * 60 * 1000),
            resolutionDeadline: new Date(now.getTime() + resolutionHours * 60 * 60 * 1000),
            breached: false
        };
    }

    static storage = new Map();

    static async create(complaintData) {
        const complaint = new MockComplaint(complaintData);
        
        // Add initial timeline entry
        complaint.timeline.push({
            action: 'created',
            description: 'Complaint submitted',
            performedBy: {
                id: complaint.patient,
                name: complaint.patientName,
                role: 'patient'
            },
            timestamp: new Date()
        });

        this.storage.set(complaint.id, complaint);
        console.log(`📝 Mock: Created complaint ${complaint.complaintId} - ${complaint.title}`);
        return complaint;
    }

    static async findById(id) {
        return this.storage.get(id) || null;
    }

    static async findByComplaintId(complaintId) {
        for (const complaint of this.storage.values()) {
            if (complaint.complaintId === complaintId) {
                return complaint;
            }
        }
        return null;
    }

    static async findByPatient(patientId) {
        const complaints = [];
        for (const complaint of this.storage.values()) {
            if (complaint.patient === patientId) {
                complaints.push(complaint);
            }
        }
        return complaints.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    static async getOpenComplaints() {
        const complaints = [];
        for (const complaint of this.storage.values()) {
            if (['open', 'in_progress', 'escalated'].includes(complaint.status)) {
                complaints.push(complaint);
            }
        }
        return complaints.sort((a, b) => {
            const urgencyOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
            const urgencyDiff = (urgencyOrder[b.urgency] || 2) - (urgencyOrder[a.urgency] || 2);
            if (urgencyDiff !== 0) return urgencyDiff;
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
    }

    static async getOverdueComplaints() {
        const now = new Date();
        const complaints = [];
        
        for (const complaint of this.storage.values()) {
            const isResponseOverdue = complaint.sla.responseDeadline < now && complaint.status === 'open';
            const isResolutionOverdue = complaint.sla.resolutionDeadline < now && 
                ['open', 'in_progress'].includes(complaint.status);
            
            if (isResponseOverdue || isResolutionOverdue) {
                complaints.push(complaint);
            }
        }
        
        return complaints;
    }

    async save() {
        this.updatedAt = new Date();
        MockComplaint.storage.set(this.id, this);
        return this;
    }

    async addTimelineEntry(action, description, performedBy, notes = '') {
        this.timeline.push({
            action,
            description,
            performedBy,
            notes,
            timestamp: new Date()
        });
        return this.save();
    }

    async assignTo(staffId, staffName, department) {
        this.assignedTo = {
            staffId,
            staffName,
            department,
            assignedAt: new Date()
        };
        this.status = 'in_progress';
        
        return this.addTimelineEntry(
            'assigned',
            `Complaint assigned to ${staffName} (${department})`,
            { id: 'system', name: 'System', role: 'system' }
        );
    }

    async updateStatus(newStatus, performedBy, notes = '') {
        const oldStatus = this.status;
        this.status = newStatus;
        
        return this.addTimelineEntry(
            'status_change',
            `Status changed from ${oldStatus} to ${newStatus}`,
            performedBy,
            notes
        );
    }

    async escalate(reason, escalatedTo, performedBy) {
        this.escalation.level += 1;
        this.escalation.escalatedTo = escalatedTo;
        this.escalation.escalatedAt = new Date();
        this.escalation.reason = reason;
        this.status = 'escalated';
        
        return this.addTimelineEntry(
            'escalated',
            `Complaint escalated to ${escalatedTo}. Reason: ${reason}`,
            performedBy
        );
    }

    async resolve(summary, actionTaken, resolvedBy) {
        this.status = 'resolved';
        this.resolution = {
            summary,
            actionTaken,
            resolvedBy,
            resolvedAt: new Date()
        };
        
        return this.addTimelineEntry(
            'resolved',
            `Complaint resolved: ${summary}`,
            resolvedBy
        );
    }

    // Virtual properties
    get ageInHours() {
        return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60));
    }

    get slaStatus() {
        const now = new Date();
        if (this.sla.resolutionDeadline && now > this.sla.resolutionDeadline) {
            return 'overdue';
        }
        if (this.sla.responseDeadline && now > this.sla.responseDeadline && this.status === 'open') {
            return 'response_overdue';
        }
        return 'on_time';
    }

    toObject() {
        return {
            id: this.id,
            _id: this._id,
            patient: this.patient,
            patientName: this.patientName,
            patientPhone: this.patientPhone,
            complaintId: this.complaintId,
            title: this.title,
            description: this.description,
            category: this.category,
            subcategory: this.subcategory,
            urgency: this.urgency,
            priority: this.priority,
            status: this.status,
            channel: this.channel,
            language: this.language,
            assignedTo: this.assignedTo,
            attachments: this.attachments,
            aiAnalysis: this.aiAnalysis,
            timeline: this.timeline,
            resolution: this.resolution,
            sla: this.sla,
            escalation: this.escalation,
            relatedAppointment: this.relatedAppointment,
            tags: this.tags,
            isAnonymous: this.isAnonymous,
            followUpRequired: this.followUpRequired,
            followUpDate: this.followUpDate,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            ageInHours: this.ageInHours,
            slaStatus: this.slaStatus
        };
    }

    toPublic() {
        return {
            complaintId: this.complaintId,
            title: this.title,
            category: this.category,
            urgency: this.urgency,
            status: this.status,
            createdAt: this.createdAt,
            ageInHours: this.ageInHours,
            slaStatus: this.slaStatus
        };
    }
}

module.exports = MockComplaint;