import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn("⚠️  GEMINI_API_KEY not set. Chatbot features will be disabled.");
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
// Use gemini-1.5-flash (faster, cheaper) or gemini-1.5-pro (more capable)
// You can change this to "gemini-1.5-pro" if you need more advanced capabilities
// Clean model name (remove any extra spaces or commas)
const MODEL_NAME_RAW = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const MODEL_NAME = MODEL_NAME_RAW.split(',')[0].trim();

// Lazy initialization - get model when needed to catch errors properly
function getModel() {
  if (!genAI) {
    return null;
  }
  try {
    return genAI.getGenerativeModel({ model: MODEL_NAME });
  } catch (error: any) {
    console.error(`❌ Failed to get model "${MODEL_NAME}":`, error);
    return null;
  }
}

if (genAI && GEMINI_API_KEY) {
  console.log(`✅ Chatbot initialized`);
  console.log(`   Model: ${MODEL_NAME}`);
  console.log(`   API Key: ${GEMINI_API_KEY.substring(0, 10)}...${GEMINI_API_KEY.substring(GEMINI_API_KEY.length - 4)}`);
  // Test model initialization
  const testModel = getModel();
  if (testModel) {
    console.log(`   Model "${MODEL_NAME}" is ready`);
  } else {
    console.warn(`   ⚠️  Model "${MODEL_NAME}" initialization failed - will retry on first use`);
  }
} else {
  console.warn(`⚠️  Chatbot disabled: GEMINI_API_KEY not set`);
}

const CHATBOT_HANDLE = "@PolyXBot";
const CHATBOT_SYSTEM_PROMPT = `You are PolyXBot, an AI assistant for PolyX, a decentralized social network on Polygon. 
You help users with questions about:
- PolyX features and how to use them
- Web3 and blockchain concepts
- Polygon network
- Decentralized social media
- On-chain interactions

Be helpful, friendly, and concise. Keep responses under 280 characters when possible, but you can be longer if needed for clarity.
Always be accurate and if you don't know something, say so.`;

interface ChatHistory {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

// Store chat history per user (in production, use a database)
const chatHistory: Map<string, ChatHistory[]> = new Map();

export async function chatWithBot(userAddress: string, message: string): Promise<string> {
  const model = getModel();
  if (!model) {
    console.error("Chatbot model not initialized. Check GEMINI_API_KEY and GEMINI_MODEL in backend/.env");
    throw new Error("Chatbot is not configured. Please set GEMINI_API_KEY environment variable.");
  }

  if (!message || message.trim().length === 0) {
    throw new Error("Message cannot be empty");
  }

  try {
    console.log(`[Chatbot] Processing message from ${userAddress}: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);
    
    // Get user's chat history
    const history = chatHistory.get(userAddress) || [];
    
    // Build conversation history in the correct format (last 10 messages)
    const chatHistoryArray = history.slice(-10).map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Create chat session - include system prompt in history if no history exists
    const initialHistory = chatHistoryArray.length === 0 ? [
      {
        role: "user" as const,
        parts: [{ text: CHATBOT_SYSTEM_PROMPT }],
      },
      {
        role: "model" as const,
        parts: [{ text: "Hello! I'm PolyXBot, your AI assistant for PolyX. How can I help you today?" }],
      },
    ] : [];

    // Use generateContent directly for more reliable operation
    // Build the prompt with context
    let prompt = CHATBOT_SYSTEM_PROMPT;
    
    // Add conversation history if available
    if (chatHistoryArray.length > 0) {
      prompt += "\n\nPrevious conversation:\n";
      chatHistoryArray.forEach(msg => {
        prompt += `${msg.role === "user" ? "User" : "Assistant"}: ${msg.parts[0].text}\n`;
      });
    }
    
    prompt += `\n\nUser: ${message}\nAssistant:`;
    
    console.log(`[Chatbot] Using model: ${MODEL_NAME}`);
    console.log(`[Chatbot] Prompt length: ${prompt.length} chars`);
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Save to history
    const userMessage: ChatHistory = {
      role: "user",
      content: message,
      timestamp: Date.now(),
    };
    const botMessage: ChatHistory = {
      role: "assistant",
      content: text,
      timestamp: Date.now(),
    };

    const updatedHistory = [...history, userMessage, botMessage];
    chatHistory.set(userAddress, updatedHistory.slice(-20)); // Keep last 20 messages

    console.log(`[Chatbot] Response generated successfully (${text.length} chars)`);
    return text;
  } catch (error: any) {
    console.error("Chatbot error:", error);
    console.error("Error type:", error?.constructor?.name);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
    
    // Try to extract more details from the error
    let errorDetails = error?.message || String(error);
    if (error?.response) {
      console.error("API Response error:", error.response);
      errorDetails = JSON.stringify(error.response);
    }
    if (error?.cause) {
      console.error("Error cause:", error.cause);
    }
    
    // Check for specific error patterns
    const errorStr = String(error).toLowerCase();
    const errorMsg = errorDetails.toLowerCase();
    
    if (errorStr.includes("404") || errorMsg.includes("not found") || errorMsg.includes("model") && errorMsg.includes("not found")) {
      // Try to get the actual error from the API
      const actualError = error?.message || errorStr;
      throw new Error(`Model "${MODEL_NAME}" not found or not available. Error: ${actualError}. Please verify:\n1. Your API key has access to Gemini models\n2. Billing is enabled in your Google Cloud project\n3. The model name is correct: gemini-1.5-flash or gemini-1.5-pro`);
    }
    if (errorStr.includes("api key") || errorStr.includes("401") || errorStr.includes("403") || errorStr.includes("unauthorized") || errorStr.includes("forbidden")) {
      throw new Error("Invalid or missing GEMINI_API_KEY. Please check your backend/.env file and ensure the API key is valid and has proper permissions.");
    }
    if (errorStr.includes("429") || errorStr.includes("rate limit")) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    if (errorStr.includes("400") || errorStr.includes("bad request")) {
      throw new Error(`Bad request to Gemini API. Model: ${MODEL_NAME}. Error: ${errorDetails}`);
    }
    
    // Generic error with full details
    throw new Error(`Failed to get response from chatbot. Model: ${MODEL_NAME}. Error: ${errorDetails}`);
  }
}

export function getChatHistory(userAddress: string): ChatHistory[] {
  return chatHistory.get(userAddress) || [];
}

export function clearChatHistory(userAddress: string): void {
  chatHistory.delete(userAddress);
}

// Check if a post mentions the chatbot
export function isMentioned(content: string): boolean {
  if (!content) return false;
  const lowerContent = content.toLowerCase();
  
  // Check for various forms of "polyx" mention
  // Match "polyx" as a word (not part of another word like "polyxenon")
  const polyxPattern = /\b@?polyx\b/i;
  return polyxPattern.test(content) || 
         lowerContent.includes("@polyxbot") ||
         lowerContent.includes("polyxbot");
}

// Generate response to a tagged post
export async function respondToMention(
  postContent: string,
  postAuthor: string,
  postId: number
): Promise<string> {
  const model = getModel();
  if (!model) {
    throw new Error("Chatbot is not configured. Please set GEMINI_API_KEY environment variable.");
  }

  try {
    const prompt = `${CHATBOT_SYSTEM_PROMPT}

A user tagged you in a post. Here's the post content:
"${postContent}"

Generate a helpful, relevant response. Keep it concise (under 280 characters if possible). Be friendly and helpful.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return text;
  } catch (error: any) {
    console.error("Mention response error:", error);
    console.error("Error type:", error?.constructor?.name);
    console.error("Error message:", error?.message);
    
    const errorStr = String(error).toLowerCase();
    const errorMsg = (error?.message || String(error)).toLowerCase();
    
    if (errorStr.includes("404") || errorMsg.includes("not found") || errorMsg.includes("model") && errorMsg.includes("not found")) {
      throw new Error(`Model "${MODEL_NAME}" not found or not available. Please verify your API key has access and billing is enabled.`);
    }
    if (errorStr.includes("api key") || errorStr.includes("401") || errorStr.includes("403")) {
      throw new Error("Invalid or missing GEMINI_API_KEY. Please check your backend/.env file.");
    }
    if (errorStr.includes("429") || errorStr.includes("rate limit")) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    throw new Error(`Failed to generate response: ${error?.message || String(error)}`);
  }
}

export { CHATBOT_HANDLE };

