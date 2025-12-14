#!/usr/bin/env node

/**
 * Simple script to get the Ethereum address from a private key
 * Usage: node scripts/get-address.js <PRIVATE_KEY>
 * 
 * Example:
 *   node scripts/get-address.js 0xabc123...
 */

import { ethers } from "ethers";

const privateKey = process.argv[2];

if (!privateKey) {
  console.error("❌ Error: Please provide a private key");
  console.log("\nUsage: node scripts/get-address.js <PRIVATE_KEY>");
  console.log("\nExample:");
  console.log("  node scripts/get-address.js 0xabc123...");
  process.exit(1);
}

try {
  // Create a wallet from the private key
  const wallet = new ethers.Wallet(privateKey);
  const address = wallet.address;
  
  console.log("\n✅ Wallet Address:");
  console.log(`   ${address}\n`);
  console.log("📝 Add this to your .env file:");
  console.log(`   CHATBOT_ADDRESS=${address}\n`);
} catch (error) {
  console.error("❌ Error:", error.message);
  console.log("\n💡 Make sure your private key is valid (should start with 0x and be 66 characters)");
  process.exit(1);
}

