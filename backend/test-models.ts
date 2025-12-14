import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY not set in .env file");
    process.exit(1);
}

console.log("🔍 Testing Gemini API with your key...\n");
console.log(`API Key: ${GEMINI_API_KEY.substring(0, 10)}...${GEMINI_API_KEY.substring(GEMINI_API_KEY.length - 4)}\n`);

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// List of models to test
const modelsToTest = [
    "gemini-pro",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro-latest",
    "gemini-2.0-flash-exp",
];

async function testModel(modelName: string) {
    try {
        console.log(`Testing: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });

        // Try to generate content
        const result = await model.generateContent("Say hello in one word");
        const response = await result.response;
        const text = response.text();

        console.log(`✅ ${modelName} - WORKS! Response: "${text}"\n`);
        return { model: modelName, works: true, response: text };
    } catch (error: any) {
        console.log(`❌ ${modelName} - FAILED: ${error.message}\n`);
        return { model: modelName, works: false, error: error.message };
    }
}

async function main() {
    console.log("=".repeat(60));
    console.log("Testing all Gemini models...");
    console.log("=".repeat(60) + "\n");

    const results = [];

    for (const modelName of modelsToTest) {
        const result = await testModel(modelName);
        results.push(result);
    }

    console.log("\n" + "=".repeat(60));
    console.log("SUMMARY");
    console.log("=".repeat(60) + "\n");

    const workingModels = results.filter(r => r.works);
    const failedModels = results.filter(r => !r.works);

    if (workingModels.length > 0) {
        console.log("✅ Working models:");
        workingModels.forEach(m => {
            console.log(`   - ${m.model}`);
        });
        console.log(`\n🎯 RECOMMENDED: Use "${workingModels[0].model}" in your .env file`);
    } else {
        console.log("❌ No working models found!");
    }

    if (failedModels.length > 0) {
        console.log("\n❌ Failed models:");
        failedModels.forEach(m => {
            console.log(`   - ${m.model}`);
        });
    }

    console.log("\n" + "=".repeat(60));
}

main().catch(console.error);
