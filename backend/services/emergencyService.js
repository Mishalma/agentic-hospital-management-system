const EmergencyCase = require('../models/EmergencyCase');

class EmergencyService {
  // AI-based triage scoring algorithm
  calculateTriageScore(vitals, symptoms, demographics) {
    let score = 0;
    let priority = 'Low';
    let riskFactors = [];

    // Vital signs scoring
    if (vitals.systolicBP > 180 || vitals.systolicBP < 90) {
      score += 3;
      riskFactors.push('Critical Blood Pressure');
    }
    if (vitals.heartRate > 120 || vitals.heartRate < 50) {
      score += 2;
      riskFactors.push('Abnormal Heart Rate');
    }
    if (vitals.temperature > 39 || vitals.temperature < 35) {
      score += 2;
      riskFactors.push('Temperature Extremes');
    }
    if (vitals.oxygenSaturation < 92) {
      score += 3;
      riskFactors.push('Low Oxygen Saturation');
    }
    if (vitals.respiratoryRate > 24 || vitals.respiratoryRate < 12) {
      score += 2;
      riskFactors.push('Abnormal Respiratory Rate');
    }

    // Symptom-based scoring
    const criticalSymptoms = ['chest pain', 'difficulty breathing', 'unconscious', 'severe bleeding'];
    const urgentSymptoms = ['severe pain', 'vomiting', 'high fever', 'confusion'];
    
    symptoms.forEach(symptom => {
      if (criticalSymptoms.some(cs => symptom.toLowerCase().includes(cs))) {
        score += 4;
        riskFactors.push(`Critical Symptom: ${symptom}`);
      } else if (urgentSymptoms.some(us => symptom.toLowerCase().includes(us))) {
        score += 2;
        riskFactors.push(`Urgent Symptom: ${symptom}`);
      }
    });

    // Age-based risk adjustment
    if (demographics.age > 65 || demographics.age < 2) {
      score += 1;
      riskFactors.push('Age Risk Factor');
    }

    // Determine priority based on score
    if (score >= 8) {
      priority = 'Critical';
    } else if (score >= 5) {
      priority = 'High';
    } else if (score >= 3) {
      priority = 'Medium';
    }

    return {
      score,
      priority,
      riskFactors,
      recommendedAction: this.getRecommendedAction(priority, score)
    };
  }

  getRecommendedAction(priority, score) {
    switch (priority) {
      case 'Critical':
        return 'Immediate resuscitation required - Activate trauma team';
      case 'High':
        return 'Urgent medical attention - See within 15 minutes';
      case 'Medium':
        return 'Semi-urgent care - See within 1 hour';
      default:
        return 'Standard care - See within 2-4 hours';
    }
  }

  // Deterioration prediction based on trends
  predictDeterioration(caseHistory) {
    const recentVitals = caseHistory.vitalsHistory.slice(-3);
    if (recentVitals.length < 2) return { risk: 'Unknown', confidence: 0 };

    let deteriorationScore = 0;
    const trends = this.calculateVitalsTrends(recentVitals);

    // Check for worsening trends
    if (trends.bpTrend === 'decreasing' && trends.bpChange > 20) deteriorationScore += 2;
    if (trends.hrTrend === 'increasing' && trends.hrChange > 20) deteriorationScore += 2;
    if (trends.o2Trend === 'decreasing' && trends.o2Change > 5) deteriorationScore += 3;
    if (trends.tempTrend === 'increasing' && trends.tempChange > 1.5) deteriorationScore += 1;

    const riskLevel = deteriorationScore >= 4 ? 'High' : 
                     deteriorationScore >= 2 ? 'Medium' : 'Low';
    
    return {
      risk: riskLevel,
      confidence: Math.min(deteriorationScore * 20, 95),
      trends,
      recommendations: this.getDeteriorationRecommendations(riskLevel)
    };
  }

  calculateVitalsTrends(vitals) {
    if (vitals.length < 2) return {};

    const first = vitals[0];
    const last = vitals[vitals.length - 1];

    return {
      bpTrend: last.systolicBP > first.systolicBP ? 'increasing' : 'decreasing',
      bpChange: Math.abs(last.systolicBP - first.systolicBP),
      hrTrend: last.heartRate > first.heartRate ? 'increasing' : 'decreasing',
      hrChange: Math.abs(last.heartRate - first.heartRate),
      o2Trend: last.oxygenSaturation > first.oxygenSaturation ? 'increasing' : 'decreasing',
      o2Change: Math.abs(last.oxygenSaturation - first.oxygenSaturation),
      tempTrend: last.temperature > first.temperature ? 'increasing' : 'decreasing',
      tempChange: Math.abs(last.temperature - first.temperature)
    };
  }

  getDeteriorationRecommendations(riskLevel) {
    switch (riskLevel) {
      case 'High':
        return [
          'Increase monitoring frequency to every 15 minutes',
          'Consider ICU consultation',
          'Review current treatment plan',
          'Prepare for potential escalation'
        ];
      case 'Medium':
        return [
          'Increase monitoring frequency to every 30 minutes',
          'Review vital signs trends',
          'Consider additional diagnostic tests'
        ];
      default:
        return [
          'Continue standard monitoring',
          'Document current status'
        ];
    }
  }

  // Resource allocation optimization
  optimizeResourceAllocation(activeCases, availableResources) {
    const prioritizedCases = activeCases
      .filter(c => c.status === 'active')
      .sort((a, b) => {
        // Sort by priority first, then by waiting time
        const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return new Date(a.arrivalTime) - new Date(b.arrivalTime);
      });

    const allocation = {
      assignments: [],
      waitingQueue: [],
      resourceUtilization: {}
    };

    // Assign resources based on priority and availability
    prioritizedCases.forEach(case_ => {
      const requiredResource = this.getRequiredResource(case_.priority);
      const availableResource = availableResources.find(r => 
        r.type === requiredResource && r.status === 'available'
      );

      if (availableResource) {
        allocation.assignments.push({
          caseId: case_.id,
          resourceId: availableResource.id,
          estimatedDuration: this.estimateTreatmentDuration(case_),
          assignedAt: new Date()
        });
        availableResource.status = 'occupied';
      } else {
        allocation.waitingQueue.push({
          caseId: case_.id,
          priority: case_.priority,
          waitingSince: case_.arrivalTime,
          estimatedWaitTime: this.estimateWaitTime(case_, allocation.assignments)
        });
      }
    });

    // Calculate resource utilization
    availableResources.forEach(resource => {
      const type = resource.type;
      if (!allocation.resourceUtilization[type]) {
        allocation.resourceUtilization[type] = { total: 0, occupied: 0 };
      }
      allocation.resourceUtilization[type].total++;
      if (resource.status === 'occupied') {
        allocation.resourceUtilization[type].occupied++;
      }
    });

    return allocation;
  }

  getRequiredResource(priority) {
    switch (priority) {
      case 'Critical':
        return 'trauma_bay';
      case 'High':
        return 'acute_bed';
      case 'Medium':
        return 'standard_bed';
      default:
        return 'triage_chair';
    }
  }

  estimateTreatmentDuration(case_) {
    const baseDuration = {
      'Critical': 120, // 2 hours
      'High': 90,      // 1.5 hours
      'Medium': 60,    // 1 hour
      'Low': 30        // 30 minutes
    };
    return baseDuration[case_.priority] || 60;
  }

  estimateWaitTime(case_, currentAssignments) {
    const similarCases = currentAssignments.filter(a => 
      a.priority === case_.priority
    );
    const averageDuration = similarCases.length > 0 
      ? similarCases.reduce((sum, a) => sum + a.estimatedDuration, 0) / similarCases.length
      : this.estimateTreatmentDuration(case_);
    
    return Math.max(15, averageDuration * 0.8); // Minimum 15 minutes
  }

  // Quality metrics calculation
  calculateQualityMetrics(cases, timeframe = 24) {
    const cutoffTime = new Date(Date.now() - timeframe * 60 * 60 * 1000);
    const recentCases = cases.filter(c => new Date(c.arrivalTime) > cutoffTime);

    const metrics = {
      totalCases: recentCases.length,
      averageWaitTime: 0,
      triageAccuracy: 0,
      patientSatisfaction: 0,
      resourceUtilization: 0,
      mortalityRate: 0,
      readmissionRate: 0,
      lengthOfStay: 0
    };

    if (recentCases.length === 0) return metrics;

    // Calculate average wait time
    const waitTimes = recentCases
      .filter(c => c.treatmentStartTime)
      .map(c => (new Date(c.treatmentStartTime) - new Date(c.arrivalTime)) / (1000 * 60));
    metrics.averageWaitTime = waitTimes.length > 0 
      ? waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length 
      : 0;

    // Calculate triage accuracy (simplified)
    const accurateTriages = recentCases.filter(c => 
      c.finalDiagnosis && c.triageScore && 
      this.isTriageAccurate(c.priority, c.finalDiagnosis)
    );
    metrics.triageAccuracy = (accurateTriages.length / recentCases.length) * 100;

    // Calculate other metrics
    const completedCases = recentCases.filter(c => c.status === 'completed');
    if (completedCases.length > 0) {
      metrics.patientSatisfaction = completedCases
        .filter(c => c.satisfactionScore)
        .reduce((sum, c) => sum + c.satisfactionScore, 0) / completedCases.length;

      const stayTimes = completedCases
        .filter(c => c.dischargeTime)
        .map(c => (new Date(c.dischargeTime) - new Date(c.arrivalTime)) / (1000 * 60 * 60));
      metrics.lengthOfStay = stayTimes.length > 0 
        ? stayTimes.reduce((sum, time) => sum + time, 0) / stayTimes.length 
        : 0;
    }

    return metrics;
  }

  isTriageAccurate(triagePriority, finalDiagnosis) {
    // Simplified accuracy check - in real implementation, this would be more sophisticated
    const criticalDiagnoses = ['myocardial infarction', 'stroke', 'sepsis', 'trauma'];
    const urgentDiagnoses = ['pneumonia', 'appendicitis', 'fracture'];
    
    if (triagePriority === 'Critical') {
      return criticalDiagnoses.some(d => finalDiagnosis.toLowerCase().includes(d));
    } else if (triagePriority === 'High') {
      return urgentDiagnoses.some(d => finalDiagnosis.toLowerCase().includes(d)) ||
             criticalDiagnoses.some(d => finalDiagnosis.toLowerCase().includes(d));
    }
    return true; // Assume lower priorities are generally accurate
  }
}

module.exports = new EmergencyService();