const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const apiKey = "AIzaSyA_fake_key_for_testing_123";
console.log('API Key:', apiKey ? apiKey : 'NOT FOUND');

async function run() {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hola");
        console.log(await result.response.text());
    } catch (error) {
        console.error('ERROR DETAILED:', error);
    }
}
run();
