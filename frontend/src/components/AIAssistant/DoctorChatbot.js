import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import "./DoctorChatbot.css";

const DoctorChatbot = ({ isOpen, onToggle }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      content: `Hello Dr. ${user?.fullName || user?.username}! I'm your AI medical assistant. I can help you with:
      
• Clinical decision support
• Drug interactions and contraindications
• Differential diagnosis suggestions
• Treatment protocols and guidelines
• Medical calculations and dosing
• Latest medical research insights

How can I assist you today?`,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quickActions, setQuickActions] = useState([
    "Drug interaction check",
    "Differential diagnosis",
    "Treatment guidelines",
    "Dosage calculation",
    "Lab interpretation",
    "Emergency protocols",
  ]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (message = inputMessage) => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Send to AI service
      const response = await axios.post("/api/consultations/temp/ai-suggestions", {
        message: message,
        context: "medical_consultation",
        doctorId: user.id,
      });
      console.log(response);

      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content:
          response.data.rawResponse ||
          "I apologize, but I encountered an issue processing your request. Please try rephrasing your question.",
        timestamp: new Date(),
        confidence: response.data.confidence,
        sources: response.data.sources,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);

      // Provide intelligent fallback responses
      const fallbackResponse = generateFallbackResponse(message);

      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content: fallbackResponse,
        timestamp: new Date(),
        isFallback: true,
      };

      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackResponse = (message) => {
    const msg = message.toLowerCase();

    if (msg.includes("drug") || msg.includes("medication") || msg.includes("interaction")) {
      return `For drug interactions and medication queries:

🔍 **Drug Interaction Checking:**
- Always check for major contraindications
- Consider patient's renal/hepatic function
- Review current medications list
- Check for allergies and adverse reactions

📚 **Reliable Resources:**
- Lexicomp Drug Interactions
- Micromedex
- FDA Drug Labels
- Clinical pharmacology references

⚠️ **Key Considerations:**
- Age-related dosing adjustments
- Pregnancy/lactation safety
- Therapeutic drug monitoring needs

Would you like me to help with a specific medication query?`;
    }

    if (msg.includes("diagnosis") || msg.includes("differential") || msg.includes("symptom")) {
      return `For diagnostic support:

🎯 **Differential Diagnosis Approach:**
1. **Chief Complaint Analysis**
   - Duration and onset
   - Associated symptoms
   - Aggravating/relieving factors

2. **Physical Examination Focus**
   - Vital signs assessment
   - System-specific findings
   - Red flag symptoms

3. **Diagnostic Testing**
   - Laboratory studies
   - Imaging when indicated
   - Specialist consultation

📋 **Clinical Decision Tools:**
- Evidence-based guidelines
- Risk stratification scores
- Diagnostic algorithms

What specific clinical scenario would you like to discuss?`;
    }

    if (msg.includes("dose") || msg.includes("dosage") || msg.includes("calculation")) {
      return `For dosage calculations and prescribing:

💊 **Dosing Considerations:**
- **Weight-based dosing** (mg/kg)
- **BSA calculations** for chemotherapy
- **Renal dosing adjustments** (CrCl-based)
- **Hepatic impairment** modifications

🧮 **Common Calculations:**
- Pediatric dosing formulas
- IV drip rate calculations
- Unit conversions
- Bioavailability adjustments

⚠️ **Safety Checks:**
- Maximum daily doses
- Frequency limitations
- Route-specific considerations
- Patient-specific factors

What dosing calculation do you need help with?`;
    }

    if (msg.includes("emergency") || msg.includes("urgent") || msg.includes("critical")) {
      return `For emergency and critical care:

🚨 **Emergency Protocols:**
- **ACLS Guidelines** - Cardiac arrest management
- **PALS Protocols** - Pediatric emergencies
- **Stroke Protocols** - Time-sensitive interventions
- **Sepsis Management** - Early recognition and treatment

⏰ **Time-Critical Conditions:**
- Acute MI (Door-to-balloon <90 min)
- Stroke (tPA window 3-4.5 hours)
- Sepsis (1-hour bundle)
- Anaphylaxis (Epinephrine immediately)

📞 **When to Consult:**
- Specialist availability
- Transfer criteria
- Family communication
- Documentation requirements

What emergency situation are you managing?`;
    }

    return `I'm here to help with your medical questions! I can assist with:

🩺 **Clinical Support:**
- Differential diagnosis guidance
- Treatment protocol recommendations
- Drug interaction checking
- Dosage calculations

📚 **Medical Knowledge:**
- Evidence-based guidelines
- Latest research insights
- Clinical decision tools
- Risk assessment

🔬 **Diagnostic Support:**
- Lab value interpretation
- Imaging study guidance
- Screening recommendations

Please feel free to ask me about any specific medical topic, patient case, or clinical decision you're working on.`;
  };

  const handleQuickAction = (action) => {
    sendMessage(`Help me with ${action.toLowerCase()}`);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        type: "bot",
        content: `Chat cleared! How can I assist you with your medical practice today, Dr. ${
          user?.fullName || user?.username
        }?`,
        timestamp: new Date(),
      },
    ]);
  };

  const testGeminiConnection = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/consultations/test-gemini");

      const testMessage = {
        id: Date.now(),
        type: "bot",
        content: `🧪 **Gemini AI Connection Test Results:**

**Status:** ${response.data.success ? "✅ Connected" : "❌ Not Connected"}
**Message:** ${response.data.message}

**Details:**
• API Key Present: ${response.data.details.apiKeyPresent ? "✅ Yes" : "❌ No"}
• API Key Length: ${response.data.details.apiKeyLength} characters
• Model Initialized: ${response.data.details.modelInitialized ? "✅ Yes" : "❌ No"}

${response.data.details.response ? `**Test Response:** ${response.data.details.response}` : ""}
${response.data.details.error ? `**Error:** ${response.data.details.error}` : ""}

${
  !response.data.success
    ? `
**Troubleshooting:**
• Check if GEMINI_API_KEY is set in backend/.env
• Verify API key is valid at https://makersuite.google.com/app/apikey
• Restart the backend server after changing .env
• Check internet connection and API quotas`
    : ""
}`,
        timestamp: new Date(),
        isTest: true,
      };

      setMessages((prev) => [...prev, testMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now(),
        type: "bot",
        content: `❌ **Connection Test Failed**

Error: ${error.response?.data?.message || error.message}

This could indicate:
• Backend server is not running
• Network connectivity issues
• Server configuration problems

Please check the backend server status and try again.`,
        timestamp: new Date(),
        isTest: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessage = (content) => {
    // Convert markdown-like formatting to HTML
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/•/g, "•")
      .replace(/\n/g, "<br/>");
  };

  if (!isOpen) {
    return (
      <div className="chatbot-toggle" onClick={onToggle}>
        <div className="chatbot-icon">🤖</div>
        <div className="chatbot-badge">AI Assistant</div>
      </div>
    );
  }

  return (
    <div className="doctor-chatbot">
      <div className="chatbot-header">
        <div className="chatbot-title">
          <span className="chatbot-avatar">🤖</span>
          <div>
            <h3>Medical AI Assistant</h3>
            <span className="chatbot-status">Online • Ready to help</span>
          </div>
        </div>
        <div className="chatbot-controls">
          <button className="btn-test" onClick={testGeminiConnection} title="Test AI Connection">
            🧪
          </button>
          <button className="btn-clear" onClick={clearChat} title="Clear chat">
            🗑️
          </button>
          <button className="btn-minimize" onClick={onToggle} title="Minimize">
            ➖
          </button>
        </div>
      </div>

      <div className="chatbot-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-content">
              <div className="message-text" dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }} />
              {message.confidence && <div className="message-confidence">Confidence: {message.confidence}%</div>}
              {message.isFallback && (
                <div className="message-fallback">⚠️ Offline response - AI service unavailable</div>
              )}
            </div>
            <div className="message-time">
              {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message bot">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="quick-actions">
        {quickActions.map((action, index) => (
          <button key={index} className="quick-action-btn" onClick={() => handleQuickAction(action)}>
            {action}
          </button>
        ))}
      </div>

      <div className="chatbot-input">
        <div className="input-container">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me about diagnoses, treatments, drug interactions, dosing..."
            rows="2"
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <button className="send-btn" onClick={() => sendMessage()} disabled={!inputMessage.trim() || isLoading}>
            📤
          </button>
        </div>
        <div className="input-hint">Press Enter to send • Shift+Enter for new line</div>
      </div>
    </div>
  );
};

export default DoctorChatbot;
