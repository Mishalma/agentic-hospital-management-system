const geminiConfig = require("../config/gemini");

class GeminiService {
  async getDoctorSuggestions(consultationData) {
    try {
      console.log("🤖 getDoctorSuggestions called with:", {
        chiefComplaint: consultationData.chiefComplaint,
        hasSymptoms: consultationData.symptoms?.length > 0,
        hasVitals: Object.keys(consultationData.vitals || {}).length > 0,
      });

      if (!geminiConfig.isAvailable()) {
        console.warn("⚠️ Gemini AI not available, using fallback clinical guidelines.");
        return {
          success: true,
          suggestions: this.createFallbackResponse(consultationData.chiefComplaint || "AI service unavailable"),
          message: "Using offline clinical guidelines",
          isFallback: true,
        };
      }

      const prompt = this.buildConsultationPrompt(consultationData); // <<< MODIFIED PROMPT GENERATION
      console.log("📤 Sending request to Gemini AI...");
      console.log("Prompt length:", prompt.length);

      let responseText;

      // Use geminiConfig.genAI.getGenerativeModel for text generation
      const model = geminiConfig.genAI.getGenerativeModel({ model: geminiConfig.getModelName() });

      const result = await Promise.race([
        model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout after 30 seconds")), 30000)),
      ]);

      responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated";

      console.log("📥 Received response from Gemini AI");
      console.log("Response length:", responseText.length);
      console.log("Response preview:", responseText.substring(0, 200) + "...");

      // NOTE: parseAISuggestions might need adjustment as it expects JSON
      // For now, it will likely use the fallback logic inside parseAISuggestions
      const parsedSuggestions = this.parseAISuggestions(responseText);

      return {
        success: true,
        suggestions: parsedSuggestions, // This might now contain rawText due to parse failure
        rawResponse: responseText,
        isAI: true,
      };
    } catch (error) {
      console.error("❌ Gemini API error:", error.message, "Type:", error.constructor.name);

      // Fallback
      return {
        success: true,
        suggestions: this.createFallbackResponse(consultationData.chiefComplaint || "General consultation"),
        message: "Using clinical guidelines (AI temporarily unavailable)",
        isFallback: true,
        error: error.message,
      };
    }
  }

  // --- MODIFIED PROMPT ---
  buildConsultationPrompt(data) {
    const { symptoms, vitals, patientHistory, chiefComplaint, age, gender } = data;

    // Format symptoms for better AI understanding
    const symptomsText = Array.isArray(symptoms)
      ? symptoms
          .map(
            (s) => `${s.symptom || s} (severity: ${s.severity || "unknown"}/10, duration: ${s.duration || "unknown"})`
          )
          .join(", ")
      : symptoms || "Not specified";

    // Format vitals for better AI understanding
    const vitalsText = vitals
      ? `BP: ${vitals.bloodPressure?.systolic || "N/A"}/${vitals.bloodPressure?.diastolic || "N/A"} mmHg, HR: ${
          vitals.heartRate || "N/A"
        } bpm, Temp: ${vitals.temperature || "N/A"}°F, RR: ${vitals.respiratoryRate || "N/A"}, O2 Sat: ${
          vitals.oxygenSaturation || "N/A"
        }%`
      : "Not recorded";

    return `You are a medical AI assistant providing clinical decision support. Analyze this patient case and provide structured recommendations IN PLAIN TEXT ONLY. DO NOT USE JSON FORMATTING.

PATIENT CASE:
Age: ${age || "Not specified"}
Gender: ${gender || "Not specified"}
Chief Complaint: ${chiefComplaint || "Not specified"}
Symptoms: ${symptomsText}
Vital Signs: ${vitalsText}
Medical History: ${patientHistory || "No significant history"}

REQUIRED OUTPUT SECTIONS (Use clear headings for each section):
1.  **Differential Diagnosis:** List primary and alternative conditions with likelihood (high/medium/low) and brief reasoning.
2.  **Investigations:** List suggested tests with priority (urgent/routine) and reasoning.
3.  **Treatment:** Describe immediate actions, suggested medications, and non-pharmacological treatments.
4.  **Red Flags:** List critical symptoms or warning signs to monitor.
5.  **Follow-Up:** Suggest timeframe and home monitoring instructions.
6.  **Confidence Score:** Provide a confidence score (0-100) for the primary diagnosis.

IMPORTANT: Respond using plain text with clear headings for each section listed above. DO NOT output JSON. This is clinical decision support only. All recommendations require physician review and approval.`;
  }
  // --- END OF MODIFIED PROMPT ---

  parseAISuggestions(aiResponse) {
    try {
      // Clean the response - remove markdown formatting and extra text
      let cleanResponse = aiResponse.trim();

      // Remove markdown code blocks if present (though less likely now)
      cleanResponse = cleanResponse.replace(/```json\s*/g, "").replace(/```\s*/g, "");

      // Attempt to find JSON object (this will likely fail now)
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr);

        // Validate the structure (this validation might fail too)
        if (parsed.differentialDiagnosis || parsed.investigations || parsed.treatment) {
          console.log("ℹ️ Parsed JSON response (unexpected but handled)");
          return parsed;
        }
      }

      // If JSON parsing fails (which is expected now), return a structured fallback
      // containing the raw text from the AI.
      console.log("ℹ️ AI response was not JSON, creating fallback structure with raw text.");
      return this.createFallbackResponse(aiResponse); // Use fallback which includes rawText
    } catch (error) {
      console.error("Error parsing AI response (expected for text):", error);
      return this.createFallbackResponse(aiResponse); // Use fallback which includes rawText
    }
  }

  createFallbackResponse(aiResponse) {
    // Check if the input itself looks like it might already be the fallback structure
    // This prevents nesting rawText unnecessarily if parseAISuggestions calls this after failing
    if (typeof aiResponse === "object" && aiResponse.rawText) {
      return aiResponse; // It's already the fallback structure
    }

    // Original fallback logic, but includes the raw AI text
    return {
      differentialDiagnosis: [
        {
          diagnosis: "Clinical assessment required",
          likelihood: "unknown",
          reasoning: "AI response was text or parsing failed",
        },
      ],
      investigations: [
        {
          test: "Complete clinical evaluation",
          priority: "routine",
          reasoning: "Standard assessment needed",
        },
      ],
      treatment: {
        immediate: "Clinical evaluation by physician",
        medications: "To be determined by physician",
        nonPharmacological: "Standard supportive care",
      },
      redFlags: ["Any worsening of symptoms", "New concerning symptoms"],
      followUp: {
        timeframe: "As clinically indicated",
        instructions: "Monitor symptoms and return if worsening",
      },
      confidence: 0,
      rawText: aiResponse, // Store the raw text here
      parseError: true, // Indicate that parsing didn't yield structured JSON
    };
  }

  // extractSection function might be useful for parsing the TEXT response later if needed
  extractSection(text, sectionName) {
    // Adjusted regex for headings like **Section Name:**
    const regex = new RegExp(`\\*\\*${sectionName}\\*\\*[:\\s]*([\\s\\S]*?)(?=\\n\\n\\*\\*|$)`, "i");
    const match = text.match(regex);
    return match ? match[1].trim() : "";
  }

  async getDrugInteractions(medications) {
    try {
      if (!geminiConfig.isAvailable()) {
        return { success: false, message: "AI service not available" };
      }

      const model = geminiConfig.genAI.getGenerativeModel({ model: geminiConfig.getModelName() });
      const prompt = `Analyze potential drug interactions for the following medications:
${medications.map((med) => `- ${med.name} ${med.dosage} ${med.frequency}`).join("\n")}

Provide:
1. Major interactions (if any)
2. Minor interactions to monitor
3. Contraindications
4. Dosage adjustments needed
5. Monitoring recommendations

Format response as plain text using clear headings for each section. DO NOT USE JSON.`; // Modified instruction

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated";

      // Since we expect text, we return the raw text here or attempt text parsing
      // For simplicity, returning raw text
      return {
        success: true,
        interactionsText: text, // Renamed from 'interactions'
      };
    } catch (error) {
      console.error("Drug interaction analysis error:", error);
      return {
        success: false,
        message: "Failed to analyze drug interactions",
        error: error.message,
      };
    }
  }

  async getPrescriptionSuggestions(diagnosis, patientInfo) {
    try {
      if (!geminiConfig.isAvailable()) {
        return { success: false, message: "AI service not available" };
      }

      const model = geminiConfig.genAI.getGenerativeModel({ model: geminiConfig.getModelName() });
      const prompt = `Suggest appropriate medications for:
Diagnosis: ${diagnosis}
Patient: ${patientInfo.age}yo ${patientInfo.gender}
Allergies: ${patientInfo.allergies || "None known"}
Current medications: ${patientInfo.currentMedications || "None"}

Provide first-line treatment options with:
1. Generic name
2. Dosage
3. Frequency
4. Duration
5. Special instructions
6. Alternative options

Format response as a numbered list or using clear text descriptions for each medication. DO NOT USE JSON.`; // Modified instruction

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated";

      // Returning raw text
      return {
        success: true,
        suggestionsText: text, // Renamed from 'suggestions'
      };
    } catch (error) {
      console.error("Prescription suggestion error:", error);
      return {
        success: false,
        message: "Failed to get prescription suggestions",
        error: error.message,
      };
    }
  }

  // --- getChatResponse already requests plain text, no change needed there ---
  async getChatResponse(message, context = "general medical consultation", doctorId) {
    try {
      console.log("🤖 getChatResponse called with:", { message, context, doctorId });

      if (!geminiConfig.isAvailable()) {
        console.warn("⚠️ Gemini AI not available, using fallback clinical guidelines.");
        return {
          success: true,
          response: this.generateChatFallback(message),
          message: "Using offline clinical guidelines",
          isFallback: true,
        };
      }

      const prompt = `You are an AI medical assistant helping Dr. ${doctorId || "Doctor"} with clinical questions.

Context: ${context}
Doctor's Question: ${message}

Please provide a helpful, accurate, and professional medical response. Include:
- Evidence-based information when applicable
- Clinical considerations
- Safety warnings if relevant
- Suggestions for further evaluation when appropriate

Remember: This is for clinical decision support only. All medical decisions should be made by the attending physician.

Provide your response as plain text only, no JSON formatting or special markup.`; // Already asks for plain text

      console.log("📤 Sending chat request to Gemini AI...");
      console.log("Prompt length:", prompt.length);

      const model = geminiConfig.genAI.getGenerativeModel({ model: geminiConfig.getModelName() });

      const result = await Promise.race([
        model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout after 30 seconds")), 30000)),
      ]);

      const responseText =
        result.response.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I apologize, but I was unable to generate a response at this time.";

      console.log("📥 Received chat response from Gemini AI");
      console.log("Response length:", responseText.length);

      return {
        success: true,
        response: responseText,
        confidence: 75, // Note: Confidence might need to be estimated differently if not parsing JSON
        sources: ["Clinical guidelines", "Medical literature", "Evidence-based protocols"], // Example sources
        isAI: true,
      };
    } catch (error) {
      console.error("❌ Gemini chat API error:", error.message, "Type:", error.constructor.name);

      // Fallback
      return {
        success: true,
        response: this.generateChatFallback(message),
        message: "Using clinical guidelines (AI temporarily unavailable)",
        isFallback: true,
        error: error.message,
      };
    }
  }

  // --- generateChatFallback remains the same ---
  generateChatFallback(message) {
    const msg = message.toLowerCase();

    if (msg.includes("drug") || msg.includes("medication") || msg.includes("interaction")) {
      return `🔍 **Drug Information & Interactions:**

For medication queries, I recommend:
• **Check drug interactions** using Lexicomp or Micromedex
• **Verify dosing** based on patient's age, weight, and organ function
• **Review contraindications** and patient allergies
• **Consider therapeutic alternatives** if needed

**Key Safety Points:**
• Always check renal/hepatic dosing adjustments
• Monitor for drug-drug interactions
• Verify pregnancy/lactation safety
• Consider patient's medication adherence

Would you like me to help with a specific medication question?`;
    }

    if (msg.includes("diagnosis") || msg.includes("differential") || msg.includes("symptom")) {
      return `🎯 **Diagnostic Approach:**

**Clinical Assessment Framework:**
1. **History Taking**
   • Chief complaint and HPI
   • Past medical/surgical history
   • Medications and allergies
   • Social and family history

2. **Physical Examination**
   • Vital signs and general appearance
   • System-specific examination
   • Red flag symptoms

3. **Diagnostic Testing**
   • Laboratory studies as indicated
   • Imaging when appropriate
   • Specialist consultation if needed

**Evidence-Based Tools:**
• Clinical decision rules
• Risk stratification scores
• Diagnostic algorithms

What specific clinical scenario would you like to discuss?`;
    }

    if (msg.includes("treatment") || msg.includes("therapy") || msg.includes("management")) {
      return `💊 **Treatment & Management:**

**Treatment Planning:**
• **Evidence-based guidelines** - Follow established protocols
• **Patient-centered care** - Consider individual factors
• **Risk-benefit analysis** - Weigh treatment options
• **Monitoring plan** - Follow-up and assessment

**Key Considerations:**
• Patient comorbidities and contraindications
• Drug allergies and interactions
• Cost-effectiveness and accessibility
• Patient preferences and adherence

**Follow-up Strategy:**
• Response to treatment monitoring
• Adverse effect surveillance
• Dose adjustments as needed
• Long-term management planning

What specific treatment question can I help with?`;
    }

    return `👨‍⚕️ **Medical AI Assistant Ready**

I'm here to help with your clinical questions! I can assist with:

🔍 **Clinical Decision Support:**
• Differential diagnosis considerations
• Treatment protocol guidance
• Drug interaction checking
• Dosage calculations

📚 **Medical Knowledge:**
• Evidence-based guidelines
• Clinical best practices
• Risk assessment tools
• Diagnostic approaches

🩺 **Patient Care:**
• Management strategies
• Follow-up planning
• Monitoring recommendations
• Safety considerations

Please feel free to ask me about any specific medical topic or clinical scenario you're working on.`;
  }
}

module.exports = new GeminiService();
