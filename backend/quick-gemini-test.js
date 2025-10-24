require('dotenv').config();

async function quickTest() {
  console.log('⚡ Quick Gemini Test');
  console.log('==================');

  const apiKey = process.env.GEMINI_API_KEY;
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 20)}...` : 'NOT FOUND');

  if (!apiKey) {
    console.log('❌ No API key - add GEMINI_API_KEY to .env file');
    return;
  }

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);

    // Test the most basic model
    console.log('\n🧪 Testing gemini-pro...');
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent('Say hello');
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ SUCCESS!');
      console.log('Response:', text.trim());
      console.log('\n🎉 Gemini AI is working with model: gemini-pro');
      
    } catch (error) {
      console.log('❌ gemini-pro failed:', error.message);
      
      // Try with models/ prefix
      console.log('\n🧪 Testing models/gemini-pro...');
      try {
        const model2 = genAI.getGenerativeModel({ model: "models/gemini-pro" });
        const result2 = await model2.generateContent('Say hello');
        const response2 = await result2.response;
        const text2 = response2.text();
        
        console.log('✅ SUCCESS!');
        console.log('Response:', text2.trim());
        console.log('\n🎉 Gemini AI is working with model: models/gemini-pro');
        
      } catch (error2) {
        console.log('❌ models/gemini-pro also failed:', error2.message);
        
        console.log('\n🔍 Possible issues:');
        console.log('- API key might be invalid or expired');
        console.log('- Gemini API might not be enabled for your project');
        console.log('- You might need to enable billing');
        console.log('- API quotas might be exceeded');
        
        console.log('\n🔧 Next steps:');
        console.log('1. Check your API key at: https://makersuite.google.com/app/apikey');
        console.log('2. Make sure Gemini API is enabled');
        console.log('3. Check if billing is required and enabled');
      }
    }

  } catch (initError) {
    console.log('❌ Failed to initialize:', initError.message);
  }
}

quickTest();