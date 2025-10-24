require('dotenv').config();

async function testFinalGemini() {
  console.log('🎯 Final Gemini AI Test');
  console.log('=' .repeat(30));

  const apiKey = process.env.GEMINI_API_KEY;
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 20)}...` : 'NOT FOUND');

  if (!apiKey) {
    console.log('❌ No API key found in .env file');
    return;
  }

  // Test 1: Direct API test with current package
  console.log('\n1️⃣ Testing @google/generative-ai (current package)');
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try the most basic model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent('Say "Hello World"');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Current package works!');
    console.log('Response:', text.trim());
    
    // Test medical query
    console.log('\n🩺 Testing medical query...');
    const medResult = await model.generateContent('What are 3 common symptoms of diabetes?');
    const medResponse = await medResult.response;
    const medText = medResponse.text();
    
    console.log('Medical response:', medText.substring(0, 150) + '...');
    
    console.log('\n🎉 SUCCESS: Current API is working perfectly!');
    return true;
    
  } catch (error) {
    console.log('❌ Current package failed:', error.message);
    
    if (error.message.includes('models/gemini-pro is not found')) {
      console.log('💡 Model name issue - trying alternatives...');
      
      // Try alternative model names
      const alternatives = ['models/gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'];
      
      for (const modelName of alternatives) {
        try {
          const { GoogleGenerativeAI } = require('@google/generative-ai');
          const genAI = new GoogleGenerativeAI(apiKey);
          const altModel = genAI.getGenerativeModel({ model: modelName });
          const altResult = await altModel.generateContent('Say "Hello"');
          const altResponse = await altResult.response;
          const altText = altResponse.text();
          
          console.log(`✅ Alternative model ${modelName} works!`);
          console.log('Response:', altText.trim());
          return true;
          
        } catch (altError) {
          console.log(`❌ ${modelName} also failed:`, altError.message);
        }
      }
    }
  }

  // Test 2: Check if it's an API key issue
  console.log('\n2️⃣ Checking API key validity...');
  
  if (!apiKey.startsWith('AIza')) {
    console.log('❌ API key format is invalid (should start with AIza)');
    console.log('💡 Get a valid key from: https://makersuite.google.com/app/apikey');
    return false;
  }
  
  if (apiKey.length < 35) {
    console.log('❌ API key appears too short');
    console.log('💡 Verify your API key is complete');
    return false;
  }
  
  console.log('✅ API key format looks correct');

  // Test 3: Network connectivity test
  console.log('\n3️⃣ Testing network connectivity...');
  try {
    const https = require('https');
    const testUrl = 'https://generativelanguage.googleapis.com/';
    
    await new Promise((resolve, reject) => {
      const req = https.get(testUrl, (res) => {
        console.log('✅ Can reach Google AI servers');
        resolve();
      });
      
      req.on('error', (error) => {
        console.log('❌ Network connectivity issue:', error.message);
        reject(error);
      });
      
      req.setTimeout(5000, () => {
        console.log('❌ Network timeout');
        req.destroy();
        reject(new Error('Timeout'));
      });
    });
    
  } catch (netError) {
    console.log('❌ Network test failed:', netError.message);
    console.log('💡 Check your internet connection');
    return false;
  }

  console.log('\n🔍 DIAGNOSIS:');
  console.log('- API key format: ✅ Valid');
  console.log('- Network connectivity: ✅ Working');
  console.log('- Package installation: ✅ Installed');
  console.log('- Model access: ❌ Failed');
  
  console.log('\n💡 POSSIBLE SOLUTIONS:');
  console.log('1. Your API key might not have access to Gemini models');
  console.log('2. You might need to enable the Gemini API in Google Cloud Console');
  console.log('3. Billing might need to be enabled for your project');
  console.log('4. You might have exceeded API quotas');
  
  console.log('\n🔧 NEXT STEPS:');
  console.log('1. Visit: https://makersuite.google.com/app/apikey');
  console.log('2. Create a new API key');
  console.log('3. Make sure Gemini API is enabled');
  console.log('4. Update your .env file with the new key');
  
  return false;
}

testFinalGemini().then(success => {
  if (success) {
    console.log('\n🚀 Ready to use Gemini AI in your application!');
  } else {
    console.log('\n⚠️  Gemini AI not working - using fallback responses');
  }
});