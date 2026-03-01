import dotenv from "dotenv";
dotenv.config();

console.log("=".repeat(60));
console.log("Backend Environment Check");
console.log("=".repeat(60));
console.log(`CHATBOT_ADDRESS from .env: ${process.env.CHATBOT_ADDRESS}`);
console.log(`Lowercase: ${process.env.CHATBOT_ADDRESS?.toLowerCase()}`);
console.log("\nYour wallet address: 0xe716ca2f30b8b7711c92e020359f2b9d2d96c4fd");
console.log(`Match: ${process.env.CHATBOT_ADDRESS?.toLowerCase() === "0xe716ca2f30b8b7711c92e020359f2b9d2d96c4fd"}`);
console.log("=".repeat(60));
