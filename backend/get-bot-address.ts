import { ethers } from "ethers";

// Private key provided by user
const privateKey = "0x04f461c238b215508cfff71475717a10310ca4c376ba051b80eb8a41ce389caa";

// Create wallet from private key
const wallet = new ethers.Wallet(privateKey);

console.log("=".repeat(60));
console.log("Bot Wallet Information");
console.log("=".repeat(60));
console.log(`\nPrivate Key: ${privateKey}`);
console.log(`Address: ${wallet.address}`);
console.log("\n" + "=".repeat(60));
console.log("\nNext Steps:");
console.log("1. Update backend/.env:");
console.log(`   CHATBOT_ADDRESS=${wallet.address}`);
console.log("\n2. Import this wallet to MetaMask:");
console.log(`   - Click 'Import Account'`);
console.log(`   - Paste private key: ${privateKey}`);
console.log("\n3. Connect to frontend and create profile:");
console.log(`   - Handle: polyx`);
console.log(`   - Display Name: PolyX AI Assistant`);
console.log("=".repeat(60));
