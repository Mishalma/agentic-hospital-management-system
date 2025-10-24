require('dotenv').config();

async function testCurrentAPI() {
  console.log('🧪 Testing Current @google/generative-ai Package');
  console.log('=' .repeat(50));

  const apiKey = process.env.GEMINI_API_KEY;
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 20)}...` : 'NOT FOUND');

  if (!apiKey) {
    console.log('❌ No API key found');
    return;
  }

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    console.log('✅ Package loaded successfully');

    const genAI = new GoogleGenerativeAI(apiKey);
    console.log('✅ GoogleGenerativeAI instance created');

    // Test different model names that might work
    const modelsToTest = [
      'gemini-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'models/gemini-pro',
      'models/gemini-1.5-pro',
      'models/gemini-1.5-flash'
    ];

    console.log('\n🔍 Testing available models...\n');

    for (const modelName of modelsToTest) {
      try {
        console.log(`Testing: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        // Simple test
        const prompt = 'Hello! Please respond with just "Working" to confirm the connection.';
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log(`✅ ${modelName} - SUCCESS!`);
        console.log(`   Response: "${text.trim()}"`);
        console.log('');
        
        // Test with a medical query
        console.log(`   Testing medical query with ${modelName}...`);
        const medicalPrompt = 'What are the common symptoms of hypertension? Please list 3 main symptoms.';
        const medResult = await model.generateContent(medicalPrompt);
        const medResponse = await medResult.response;
        const medText = medResponse.text();
        
        console.log(`   Medical response: ${medText.substring(0, 100)}...`);
        console.log('');
        
        console.log(`🎉 FOUND WORKING MODEL: ${modelName}`);
        console.log('This model can be used in your application!');
        return modelName;
        
      } catch (error) {
        console.log(`❌ ${modelName} - FAILED`);
        console.log(`   Error: ${error.message}`);
        console.log('');
      }
    }

    console.log('❌ No working models found with current API');
    
  } catch (error) {
    console.log('❌ Failed to load package:', error.message);
    
    if (error.message.includes('Cannot find module')) {
      console.log('\n📦 Package not installed. Run:');
      console.log('   npm install @google/generative-ai');
    }
  }
}

testCurrentAPI();