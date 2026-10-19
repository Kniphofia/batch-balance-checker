const hre = require("hardhat");
const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("No deployer account found. Please set PRIVATE_KEY in .env.");
  }

  // Use JsonRpcProvider with standard ethers.Wallet to bypass hardhat-ethers checkTx formatting issues on non-standard RPCs (e.g. BSC)
  const rpcUrl = process.env.RPC_URL;
  const provider = rpcUrl ? new ethers.JsonRpcProvider(rpcUrl) : hre.ethers.provider;
  const deployer = new ethers.Wallet(privateKey, provider);

  const network = await provider.getNetwork();
  console.log(`Deployment network chainId: ${network.chainId}`);
  console.log(`Deployer account: ${deployer.address}`);

  const artifact = await hre.artifacts.readArtifact("BatchBalanceChecker");
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);
  const checker = await factory.deploy();
  await checker.waitForDeployment();

  const address = await checker.getAddress();
  console.log(`BatchBalanceChecker deployed to: ${address}`);
  console.log("Please set this address to BALANCE_CONTRACT in .env.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
