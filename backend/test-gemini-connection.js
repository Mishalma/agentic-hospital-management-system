require("dotenv").config();

let geminiConfig, geminiService;

try {
  geminiConfig = require("./config/gemini");
  geminiService = require("./services/geminiService");
} catch (error) {
  console.error("❌ Failed to load Gemini modules:", error.message);
  if (error.message.includes("@google/generative-ai")) {
    console.log("");
    console.log("🔧 Package not installed. Run:");
    console.log("   npm install @google/generative-ai");
    console.log("");
    console.log("Or use the setup script:");
    console.log("   node ../setup-gemini.js");
  }
  process.exit(1);
}

async function testGeminiConnection() {
  console.log("🔍 Gemini AI Connection Diagnostic Test");
  console.log("=".repeat(50));

  // Test 1: Environment Variables
  console.log("\n1. Environment Variables Check:");
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("   GEMINI_API_KEY present:", apiKey ? "✅ Yes" : "❌ No");
  if (apiKey) {
    console.log("   API Key length:", apiKey.length);
    console.log("   API Key starts with:", apiKey.substring(0, 10) + "...");
    console.log("   API Key format valid:", apiKey.startsWith("AIza") ? "✅ Yes" : "❌ No");
  }

  // Test 2: Gemini Config Initialization
  console.log("\n2. Gemini Configuration:");
  console.log("   Config available:", geminiConfig.isAvailable() ? "✅ Yes" : "❌ No");
  console.log("   Model initialized:", geminiConfig.getModelName() ? "✅ Yes" : "❌ No");

  // Test 3: Direct Connection Test
  console.log("\n3. Direct Connection Test:");
  try {
    const connectionTest = await geminiConfig.testConnection();
    if (connectionTest.success) {
      console.log("   ✅ Connection successful!");
      console.log("   Response:", connectionTest.response);
    } else {
      console.log("   ❌ Connection failed:", connectionTest.message);
    }
  } catch (error) {
    console.log("   ❌ Connection error:", error.message);
  }

  // Test 4: Service Layer Test
  console.log("\n4. Service Layer Test:");
  try {
    const testData = {
      chiefComplaint: "Test chest pain",
      symptoms: [{ symptom: "chest pain", severity: 5, duration: "1 hour" }],
      vitals: { heartRate: 80, bloodPressure: { systolic: 120, diastolic: 80 } },
      patientHistory: "No significant history",
      age: "45",
      gender: "Male",
    };

    console.log("   Testing doctor suggestions...");
    const serviceResponse = await geminiService.getDoctorSuggestions(testData);

    if (serviceResponse.success) {
      console.log("   ✅ Service test successful!");
      console.log("   Has suggestions:", serviceResponse.suggestions ? "Yes" : "No");
      console.log("   Is fallback:", serviceResponse.isFallback ? "Yes" : "No");
      if (serviceResponse.suggestions.differentialDiagnosis) {
        console.log("   Sample diagnosis:", serviceResponse.suggestions.differentialDiagnosis[0]?.diagnosis || "N/A");
      }
    } else {
      console.log("   ❌ Service test failed:", serviceResponse.message);
    }
  } catch (error) {
    console.log("   ❌ Service error:", error.message);
  }

  // Test 5: Manual API Test
  console.log("\n5. Manual API Test:");
  try {
    const { GoogleGenerativeAI } = require("@google/generative-ai");

    if (!apiKey) {
      console.log("   ❌ Cannot test - no API key");
    } else {
      console.log("   Creating manual connection...");
      const genAI = new GoogleGenerativeAI(apiKey);

      // Try different models
      const modelsToTry = [
        "gemini-2.5-flash",
        "gemini-1.5-pro",
        "gemini-2.0-flash-exp",
        "gemini-1.0-pro",
        "gemini-pro",
      ];

      let testSuccessful = false;

      for (const modelName of modelsToTry) {
        try {
          console.log(`   Trying model: ${modelName}`);
          const model = genAI.getGenerativeModel({ model: modelName });

          console.log("   Sending test request...");
          const result = await model.generateContent("What is 2+2? Please respond with just the number.");
          const response = await result.response;
          const text = response.text();

          console.log("   ✅ Manual test successful!");
          console.log("   Working model:", modelName);
          console.log("   Response:", text.trim());
          testSuccessful = true;
          break;
        } catch (modelError) {
          console.log(`   ❌ Model ${modelName} failed:`, modelError.message);
          continue;
        }
      }

      if (!testSuccessful) {
        console.log("   ❌ All models failed");
      }
    }
  } catch (error) {
    console.log("   ❌ Manual test failed:", error.message);

    // Check for common error types
    if (error.message.includes("API_KEY_INVALID")) {
      console.log("   💡 Suggestion: Check if your API key is correct");
    } else if (error.message.includes("PERMISSION_DENIED")) {
      console.log("   💡 Suggestion: Check if Gemini API is enabled in your Google Cloud project");
    } else if (error.message.includes("QUOTA_EXCEEDED")) {
      console.log("   💡 Suggestion: Check your API quota limits");
    } else if (error.message.includes("models/gemini-pro is not found")) {
      console.log("   💡 Suggestion: Model name has changed. Using updated model names.");
    } else if (error.message.includes("fetch")) {
      console.log("   💡 Suggestion: Check your internet connection");
    }
  }

  // Test 6: Package Installation Check
  console.log("\n6. Package Installation Check:");
  try {
    const packageInfo = require("@google/generative-ai/package.json");
    console.log("   ✅ @google/generative-ai installed");
    console.log("   Version:", packageInfo.version);
  } catch (error) {
    console.log("   ❌ @google/generative-ai not properly installed");
    console.log("   Run: npm install @google/generative-ai --prefix backend");
  }

  // Summary and Recommendations
  console.log("\n" + "=".repeat(50));
  console.log("🎯 DIAGNOSTIC SUMMARY:");

  if (!apiKey) {
    console.log("❌ CRITICAL: No API key found");
    console.log("💡 Solution: Add GEMINI_API_KEY to backend/.env file");
    console.log("   Get your key from: https://makersuite.google.com/app/apikey");
  } else if (!apiKey.startsWith("AIza")) {
    console.log("❌ CRITICAL: Invalid API key format");
    console.log("💡 Solution: Verify your API key from Google AI Studio");
  } else if (!geminiConfig.isAvailable()) {
    console.log("❌ CRITICAL: Gemini not initialized");
    console.log("💡 Solution: Check server logs for initialization errors");
  } else {
    console.log("✅ Configuration appears correct");
    console.log("💡 If still having issues, check:");
    console.log("   - Internet connection");
    console.log("   - API quota limits");
    console.log("   - Google Cloud project settings");
  }

  console.log("\n🔧 Quick Fixes:");
  console.log("1. Restart the backend server after changing .env");
  console.log("2. Verify API key at: https://makersuite.google.com/app/apikey");
  console.log("3. Check Google AI Studio for API status");
  console.log("4. Ensure @google/generative-ai package is installed");
}

// Run the diagnostic
testGeminiConnection().catch(console.error);

module.exports = { testGeminiConnection };
