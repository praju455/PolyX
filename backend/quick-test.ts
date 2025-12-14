import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.argv[2] || "gemini-1.5-flash-latest";

console.log(`Testing model: ${MODEL_NAME}`);
console.log(`API Key: ${GEMINI_API_KEY?.substring(0, 10)}...${GEMINI_API_KEY?.substring(GEMINI_API_KEY.length - 4)}\n`);

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);

async function test() {
    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const result = await model.generateContent("Say hello");
        const response = await result.response;
        const text = response.text();
        console.log(`✅ SUCCESS! Model works!`);
        console.log(`Response: ${text}`);
        process.exit(0);
    } catch (error: any) {
        console.log(`❌ FAILED: ${error.message}`);
        process.exit(1);
    }
}

test();
