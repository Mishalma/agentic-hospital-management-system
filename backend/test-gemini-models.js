require('dotenv').config();

async function testGeminiModels() {
  console.log('🧪 Testing Gemini Models');
  console.log('=' .repeat(40));

  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ No API key found');
    return;
  }

  console.log('✅ API key found:', apiKey.substring(0, 10) + '...');

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);

    // Models to test
    const modelsToTest = [
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-pro",
      "models/gemini-1.5-flash",
      "models/gemini-1.5-pro",
      "models/gemini-pro"
    ];

    console.log('\n🔍 Testing available models...\n');

    for (const modelName of modelsToTest) {
      try {
        console.log(`Testing: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const result = await model.generateContent('Say "Hello" in one word.');
        const response = await result.response;
        const text = response.text();
        
        console.log(`✅ ${modelName} - SUCCESS`);
        console.log(`   Response: ${text.trim()}`);
        console.log('');
        
        // If we found a working model, we can stop here
        console.log(`🎉 Found working model: ${modelName}`);
        break;
        
      } catch (error) {
        console.log(`❌ ${modelName} - FAILED`);
        console.log(`   Error: ${error.message}`);
        console.log('');
      }
    }

  } catch (error) {
    console.log('❌ Failed to initialize:', error.message);
  }
}

testGeminiModels();