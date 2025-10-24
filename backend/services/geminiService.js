const geminiConfig = require('../config/gemini');

class GeminiService {
  async getDoctorSuggestions(consultationData) {
  try {
    console.log('🤖 getDoctorSuggestions called with:', {
      chiefComplaint: consultationData.chiefComplaint,
      hasSymptoms: consultationData.symptoms?.length > 0,
      hasVitals: Object.keys(consultationData.vitals || {}).length > 0
    });

    if (!geminiConfig.isAvailable()) {
      console.warn('⚠️ Gemini AI not available, using fallback clinical guidelines.');
      return {
        success: true,
        suggestions: this.createFallbackResponse(consultationData.chiefComplaint || 'AI service unavailable'),
        message: 'Using offline clinical guidelines',
        isFallback: true
      };
    }

    const prompt = this.buildConsultationPrompt(consultationData);
    console.log('📤 Sending request to Gemini AI...');
    console.log('Prompt length:', prompt.length);

    let responseText;

    // Use geminiConfig.genAI.getGenerativeModel for text generation
    const model = geminiConfig.genAI.getGenerativeModel({ model: geminiConfig.getModelName() });

    const result = await Promise.race([
      model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
      )
    ]);

    responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

    console.log('📥 Received response from Gemini AI');
    console.log('Response length:', responseText.length);
    console.log('Response preview:', responseText.substring(0, 200) + '...');

    const parsedSuggestions = this.parseAISuggestions(responseText);

    return {
      success: true,
      suggestions: parsedSuggestions,
      rawResponse: responseText,
      isAI: true
    };

  } catch (error) {
    console.error('❌ Gemini API error:', error.message, 'Type:', error.constructor.name);

    // Fallback
    return {
      success: true,
      suggestions: this.createFallbackResponse(consultationData.chiefComplaint || 'General consultation'),
      message: 'Using clinical guidelines (AI temporarily unavailable)',
      isFallback: true,
      error: error.message
    };
  }
}


  buildConsultationPrompt(data) {
    const { symptoms, vitals, patientHistory, chiefComplaint, age, gender } = data;
    
    // Format symptoms for better AI understanding
    const symptomsText = Array.isArray(symptoms) 
      ? symptoms.map(s => `${s.symptom || s} (severity: ${s.severity || 'unknown'}/10, duration: ${s.duration || 'unknown'})`).join(', ')
      : symptoms || 'Not specified';

    // Format vitals for better AI understanding
    const vitalsText = vitals ? 
      `BP: ${vitals.bloodPressure?.systolic || 'N/A'}/${vitals.bloodPressure?.diastolic || 'N/A'} mmHg, HR: ${vitals.heartRate || 'N/A'} bpm, Temp: ${vitals.temperature || 'N/A'}°F, RR: ${vitals.respiratoryRate || 'N/A'}, O2 Sat: ${vitals.oxygenSaturation || 'N/A'}%` 
      : 'Not recorded';
    
    return `You are a medical AI assistant providing clinical decision support. Analyze this patient case and provide structured recommendations.

PATIENT CASE:
Age: ${age || 'Not specified'}
Gender: ${gender || 'Not specified'}
Chief Complaint: ${chiefComplaint || 'Not specified'}
Symptoms: ${symptomsText}
Vital Signs: ${vitalsText}
Medical History: ${patientHistory || 'No significant history'}

REQUIRED OUTPUT FORMAT (respond with valid JSON only):
{
  "differentialDiagnosis": [
    {"diagnosis": "Primary suspected condition", "likelihood": "high/medium/low", "reasoning": "brief explanation"},
    {"diagnosis": "Alternative condition", "likelihood": "medium/low", "reasoning": "brief explanation"}
  ],
  "investigations": [
    {"test": "Test name", "priority": "urgent/routine", "reasoning": "why needed"},
    {"test": "Another test", "priority": "routine", "reasoning": "additional info"}
  ],
  "treatment": {
    "immediate": "Immediate actions needed",
    "medications": "Suggested medications if any",
    "nonPharmacological": "Non-drug treatments"
  },
  "redFlags": [
    "Critical symptom to monitor",
    "Another warning sign"
  ],
  "followUp": {
    "timeframe": "When to follow up",
    "instructions": "What to monitor at home"
  },
  "confidence": 75
}

IMPORTANT: This is clinical decision support only. All recommendations require physician review and approval.`;
  }

  parseAISuggestions(aiResponse) {
    try {
      // Clean the response - remove markdown formatting and extra text
      let cleanResponse = aiResponse.trim();
      
      // Remove markdown code blocks if present
      cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Find JSON object in the response
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        
        // Validate the structure
        if (parsed.differentialDiagnosis || parsed.investigations || parsed.treatment) {
          return parsed;
        }
      }

      // Fallback: create structured response from text
      return this.createFallbackResponse(aiResponse);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return this.createFallbackResponse(aiResponse);
    }
  }

  createFallbackResponse(aiResponse) {
    return {
      differentialDiagnosis: [
        {
          diagnosis: "Clinical assessment required",
          likelihood: "unknown",
          reasoning: "AI response parsing failed"
        }
      ],
      investigations: [
        {
          test: "Complete clinical evaluation",
          priority: "routine",
          reasoning: "Standard assessment needed"
        }
      ],
      treatment: {
        immediate: "Clinical evaluation by physician",
        medications: "To be determined by physician",
        nonPharmacological: "Standard supportive care"
      },
      redFlags: ["Any worsening of symptoms", "New concerning symptoms"],
      followUp: {
        timeframe: "As clinically indicated",
        instructions: "Monitor symptoms and return if worsening"
      },
      confidence: 0,
      rawText: aiResponse,
      parseError: true
    };
  }

  extractSection(text, sectionName) {
    const regex = new RegExp(`${sectionName}[:\\s]*([\\s\\S]*?)(?=\\n\\n|\\d+\\.|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }

  async getDrugInteractions(medications) {
    try {
      if (!geminiConfig.isAvailable()) {
        return { success: false, message: 'AI service not available' };
      }

      const model = geminiConfig.getModel();
      const prompt = `Analyze potential drug interactions for the following medications:
${medications.map(med => `- ${med.name} ${med.dosage} ${med.frequency}`).join('\n')}

Provide:
1. Major interactions (if any)
2. Minor interactions to monitor
3. Contraindications
4. Dosage adjustments needed
5. Monitoring recommendations

Format as JSON with keys: majorInteractions, minorInteractions, contraindications, dosageAdjustments, monitoring`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        interactions: this.parseAISuggestions(text)
      };
    } catch (error) {
      console.error('Drug interaction analysis error:', error);
      return {
        success: false,
        message: 'Failed to analyze drug interactions',
        error: error.message
      };
    }
  }

  async getPrescriptionSuggestions(diagnosis, patientInfo) {
    try {
      if (!geminiConfig.isAvailable()) {
        return { success: false, message: 'AI service not available' };
      }

      const model = geminiConfig.getModel();
      const prompt = `Suggest appropriate medications for:
Diagnosis: ${diagnosis}
Patient: ${patientInfo.age}yo ${patientInfo.gender}
Allergies: ${patientInfo.allergies || 'None known'}
Current medications: ${patientInfo.currentMedications || 'None'}

Provide first-line treatment options with:
1. Generic name
2. Dosage
3. Frequency
4. Duration
5. Special instructions
6. Alternative options

Format as JSON array of medication objects.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        suggestions: this.parseAISuggestions(text)
      };
    } catch (error) {
      console.error('Prescription suggestion error:', error);
      return {
        success: false,
        message: 'Failed to get prescription suggestions',
        error: error.message
      };
    }
  }
}

module.exports = new GeminiService();