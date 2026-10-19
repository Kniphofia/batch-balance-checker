const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer account found. Please set PRIVATE_KEY in .env.");
  }

  const network = await hre.ethers.provider.getNetwork();
  console.log(`Deployment network chainId: ${network.chainId}`);
  console.log(`Deployer account: ${deployer.address}`);

  const Factory = await hre.ethers.getContractFactory("BatchBalanceChecker");
  const checker = await Factory.deploy();
  const tx = checker.deploymentTransaction();

  let address;
  try {
    await checker.waitForDeployment();
    address = await checker.getAddress();
  } catch (err) {
    // Handle non-standard RPC responses (e.g. BSC returning `to: ""` on contract creation)
    // which causes ethers v6 getTransaction parsing to fail
    const receipt = await deployer.provider.getTransactionReceipt(tx.hash);
    address = receipt?.contractAddress || hre.ethers.getCreateAddress({ from: deployer.address, nonce: tx.nonce });
  }

  console.log(`BatchBalanceChecker deployed to: ${address}`);
  console.log("Please set this address to BALANCE_CONTRACT in .env.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
