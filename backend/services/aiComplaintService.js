// AI-powered complaint analysis service
class AIComplaintService {
    constructor() {
        this.categoryKeywords = {
            'appointment_scheduling': [
                'appointment', 'booking', 'schedule', 'reschedule', 'cancel', 'slot', 'time', 'date',
                'availability', 'waiting list', 'confirmation', 'reminder'
            ],
            'doctor_behavior': [
                'doctor', 'physician', 'rude', 'unprofessional', 'attitude', 'behavior', 'treatment',
                'consultation', 'diagnosis', 'bedside manner', 'communication'
            ],
            'staff_behavior': [
                'staff', 'nurse', 'receptionist', 'rude', 'unprofessional', 'attitude', 'behavior',
                'service', 'help', 'assistance', 'front desk'
            ],
            'facility_cleanliness': [
                'dirty', 'clean', 'hygiene', 'sanitize', 'bathroom', 'room', 'facility', 'maintenance',
                'smell', 'garbage', 'infection control'
            ],
            'waiting_time': [
                'wait', 'delay', 'long', 'queue', 'time', 'hours', 'late', 'punctual', 'schedule',
                'appointment time', 'delayed'
            ],
            'billing_issues': [
                'bill', 'payment', 'charge', 'cost', 'insurance', 'claim', 'refund', 'overcharge',
                'billing error', 'invoice', 'money'
            ],
            'medical_care_quality': [
                'treatment', 'care', 'medical', 'diagnosis', 'medication', 'procedure', 'surgery',
                'quality', 'standard', 'protocol', 'negligence'
            ],
            'prescription_issues': [
                'prescription', 'medicine', 'drug', 'medication', 'pharmacy', 'dosage', 'side effect',
                'allergy', 'wrong medicine'
            ],
            'equipment_malfunction': [
                'equipment', 'machine', 'device', 'broken', 'malfunction', 'not working', 'technical',
                'system down', 'error'
            ],
            'accessibility_issues': [
                'wheelchair', 'disabled', 'accessibility', 'ramp', 'elevator', 'parking', 'access',
                'mobility', 'barrier'
            ],
            'privacy_concerns': [
                'privacy', 'confidential', 'personal', 'information', 'data', 'security', 'HIPAA',
                'disclosure', 'unauthorized'
            ],
            'communication_issues': [
                'communication', 'language', 'understand', 'explain', 'information', 'unclear',
                'confusing', 'translator', 'interpreter'
            ]
        };

        this.urgencyKeywords = {
            'critical': [
                'emergency', 'urgent', 'critical', 'life threatening', 'severe', 'immediate',
                'dangerous', 'serious injury', 'malpractice', 'death', 'dying'
            ],
            'high': [
                'pain', 'suffering', 'discrimination', 'harassment', 'negligence', 'unsafe',
                'infection', 'contamination', 'allergic reaction'
            ],
            'medium': [
                'disappointed', 'unsatisfied', 'concern', 'issue', 'problem', 'complaint',
                'improvement needed'
            ],
            'low': [
                'suggestion', 'feedback', 'minor', 'small issue', 'recommendation'
            ]
        };

        this.sentimentKeywords = {
            'very_negative': [
                'terrible', 'horrible', 'worst', 'disgusting', 'outrageous', 'unacceptable',
                'furious', 'angry', 'hate', 'never again'
            ],
            'negative': [
                'bad', 'poor', 'disappointing', 'unsatisfied', 'unhappy', 'frustrated',
                'annoyed', 'upset', 'dissatisfied'
            ],
            'neutral': [
                'okay', 'average', 'normal', 'standard', 'regular', 'fine'
            ],
            'positive': [
                'good', 'satisfied', 'happy', 'pleased', 'thank you', 'appreciate',
                'excellent', 'great', 'wonderful'
            ]
        };
    }

    async analyzeComplaint(complaintText, title = '') {
        const fullText = `${title} ${complaintText}`.toLowerCase();
        
        const analysis = {
            sentiment: this.analyzeSentiment(fullText),
            keywords: this.extractKeywords(fullText),
            suggestedCategory: this.categorizeComplaint(fullText),
            confidenceScore: 0,
            emotionalIntensity: this.analyzeEmotionalIntensity(fullText),
            urgencyScore: this.analyzeUrgency(fullText),
            similarComplaints: []
        };

        // Calculate confidence score based on keyword matches
        analysis.confidenceScore = this.calculateConfidenceScore(fullText, analysis.suggestedCategory);

        return analysis;
    }

    analyzeSentiment(text) {
        let sentimentScore = 0;
        let matchCount = 0;

        // Check for sentiment keywords
        for (const [sentiment, keywords] of Object.entries(this.sentimentKeywords)) {
            for (const keyword of keywords) {
                if (text.includes(keyword)) {
                    matchCount++;
                    switch (sentiment) {
                        case 'very_negative': sentimentScore -= 3; break;
                        case 'negative': sentimentScore -= 1; break;
                        case 'neutral': sentimentScore += 0; break;
                        case 'positive': sentimentScore += 2; break;
                    }
                }
            }
        }

        // Determine overall sentiment
        if (sentimentScore <= -3) return 'very_negative';
        if (sentimentScore < 0) return 'negative';
        if (sentimentScore === 0) return 'neutral';
        return 'positive';
    }

    categorizeComplaint(text) {
        const categoryScores = {};

        // Score each category based on keyword matches
        for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
            let score = 0;
            for (const keyword of keywords) {
                if (text.includes(keyword)) {
                    score += 1;
                    // Give higher weight to exact phrase matches
                    if (text.includes(keyword + ' ')) score += 0.5;
                }
            }
            categoryScores[category] = score;
        }

        // Find category with highest score
        const bestCategory = Object.entries(categoryScores)
            .sort(([,a], [,b]) => b - a)[0];

        return bestCategory && bestCategory[1] > 0 ? bestCategory[0] : 'other';
    }

    analyzeUrgency(text) {
        let urgencyScore = 0;
        let bestUrgency = 'medium';

        for (const [urgency, keywords] of Object.entries(this.urgencyKeywords)) {
            for (const keyword of keywords) {
                if (text.includes(keyword)) {
                    switch (urgency) {
                        case 'critical': 
                            urgencyScore = Math.max(urgencyScore, 4);
                            bestUrgency = 'critical';
                            break;
                        case 'high': 
                            if (urgencyScore < 4) {
                                urgencyScore = Math.max(urgencyScore, 3);
                                bestUrgency = 'high';
                            }
                            break;
                        case 'medium': 
                            if (urgencyScore < 3) {
                                urgencyScore = Math.max(urgencyScore, 2);
                                bestUrgency = 'medium';
                            }
                            break;
                        case 'low': 
                            if (urgencyScore < 2) {
                                urgencyScore = Math.max(urgencyScore, 1);
                                bestUrgency = 'low';
                            }
                            break;
                    }
                }
            }
        }

        return bestUrgency;
    }

    analyzeEmotionalIntensity(text) {
        // Count emotional indicators
        const emotionalWords = [
            'very', 'extremely', 'really', 'absolutely', 'completely', 'totally',
            '!!!', 'CAPS', 'urgent', 'immediate', 'serious', 'critical'
        ];

        let intensity = 1; // Base intensity
        
        for (const word of emotionalWords) {
            if (word === 'CAPS' && text === text.toUpperCase()) {
                intensity += 2;
            } else if (text.includes(word.toLowerCase())) {
                intensity += 1;
            }
        }

        // Count exclamation marks
        const exclamationCount = (text.match(/!/g) || []).length;
        intensity += Math.min(exclamationCount, 3);

        return Math.min(intensity, 10); // Cap at 10
    }

    extractKeywords(text) {
        // Simple keyword extraction
        const words = text.split(/\s+/);
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
            'by', 'is', 'was', 'are', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does',
            'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that',
            'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
            'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
        ]);

        const keywords = words
            .filter(word => word.length > 3 && !stopWords.has(word.toLowerCase()))
            .map(word => word.toLowerCase())
            .filter((word, index, arr) => arr.indexOf(word) === index) // Remove duplicates
            .slice(0, 10); // Limit to top 10 keywords

        return keywords;
    }

    calculateConfidenceScore(text, suggestedCategory) {
        if (suggestedCategory === 'other') return 0.3;

        const categoryKeywords = this.categoryKeywords[suggestedCategory] || [];
        let matches = 0;

        for (const keyword of categoryKeywords) {
            if (text.includes(keyword)) {
                matches++;
            }
        }

        // Calculate confidence as percentage of keyword matches
        const confidence = Math.min(matches / categoryKeywords.length, 1);
        return Math.round(confidence * 100) / 100;
    }

    async autoAssignComplaint(complaint) {
        // Simple auto-assignment logic based on category and urgency
        const assignmentRules = {
            'appointment_scheduling': { department: 'Patient Services', staffName: 'Sarah Johnson' },
            'doctor_behavior': { department: 'Medical Affairs', staffName: 'Dr. Michael Chen' },
            'staff_behavior': { department: 'HR Department', staffName: 'Lisa Rodriguez' },
            'facility_cleanliness': { department: 'Facilities Management', staffName: 'David Kim' },
            'waiting_time': { department: 'Operations', staffName: 'Emily Davis' },
            'billing_issues': { department: 'Billing Department', staffName: 'Robert Wilson' },
            'medical_care_quality': { department: 'Quality Assurance', staffName: 'Dr. Jennifer Lee' },
            'prescription_issues': { department: 'Pharmacy', staffName: 'Mark Thompson' },
            'equipment_malfunction': { department: 'IT Support', staffName: 'Alex Martinez' },
            'accessibility_issues': { department: 'Patient Services', staffName: 'Maria Garcia' },
            'privacy_concerns': { department: 'Compliance', staffName: 'James Anderson' },
            'communication_issues': { department: 'Patient Relations', staffName: 'Anna Patel' }
        };

        const assignment = assignmentRules[complaint.category] || assignmentRules['other'] || {
            department: 'General Support',
            staffName: 'Support Team'
        };

        return {
            staffId: `staff_${assignment.staffName.replace(/\s+/g, '_').toLowerCase()}`,
            staffName: assignment.staffName,
            department: assignment.department
        };
    }

    async generateResponseTemplate(complaint) {
        const templates = {
            'appointment_scheduling': `Dear ${complaint.patientName},

Thank you for bringing this appointment scheduling concern to our attention. We understand how important it is to have a smooth booking experience.

We are reviewing your case (${complaint.complaintId}) and will work to resolve this issue promptly. Our Patient Services team will contact you within 24 hours to address your scheduling needs.

Best regards,
HealthTech Patient Services Team`,

            'doctor_behavior': `Dear ${complaint.patientName},

We take all concerns about our medical staff very seriously. Your feedback regarding your experience is important to us and helps us maintain the highest standards of care.

We have forwarded your complaint (${complaint.complaintId}) to our Medical Affairs department for immediate review. A senior medical administrator will investigate this matter and contact you within 48 hours.

We are committed to ensuring all patients receive respectful and professional care.

Sincerely,
HealthTech Medical Affairs`,

            'billing_issues': `Dear ${complaint.patientName},

Thank you for contacting us regarding your billing concern. We understand how frustrating billing issues can be and we're here to help resolve this matter quickly.

Our Billing Department is reviewing your case (${complaint.complaintId}) and will contact you within 24 hours with a detailed explanation and resolution.

If you have any immediate questions, please call our billing hotline at (555) 123-4567.

Best regards,
HealthTech Billing Department`
        };

        return templates[complaint.category] || templates['default'] || `Dear ${complaint.patientName},

Thank you for your feedback. We have received your complaint (${complaint.complaintId}) and are reviewing it carefully.

Our team will investigate this matter and respond to you within 48 hours.

We appreciate your patience and the opportunity to address your concerns.

Best regards,
HealthTech Support Team`;
    }
}

module.exports = new AIComplaintService();