import { ethers } from "hardhat";

async function main() {
  const PolyX = await ethers.getContractFactory("PolyX");
  const polyx = await PolyX.deploy();
  await polyx.waitForDeployment();

  console.log("PolyX deployed to:", await polyx.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});







