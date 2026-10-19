require("dotenv").config();
const { ethers } = require("ethers");
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const checkerAbi = [
  "function getBalances(address account, address[] calldata assets) view returns (uint256[] memory balances)"
];
const tokenAbi = [
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

async function main() {
  const rpcUrl = process.env.RPC_URL;
  const checkerAddress = process.env.BALANCE_CONTRACT;
  const owner = process.env.OWNER;
  const assetsInput = process.env.ASSETS;

  if (!rpcUrl || !checkerAddress || !owner || !assetsInput) {
    throw new Error(
      "Missing configuration in .env: RPC_URL, BALANCE_CONTRACT, OWNER, ASSETS."
    );
  }
  if (!ethers.isAddress(checkerAddress) || !ethers.isAddress(owner)) {
    throw new Error("BALANCE_CONTRACT or OWNER is not a valid EVM address.");
  }

  const assets = assetsInput.split(",").map((value) => {
    const item = value.trim();
    if (!item) throw new Error("Empty item found in ASSETS; please provide comma-separated valid addresses.");
    if (["native", "0x0", "zero"].includes(item.toLowerCase())) return ZERO_ADDRESS;
    if (!ethers.isAddress(item)) throw new Error(`Invalid asset address: ${item}`);
    return ethers.getAddress(item);
  });

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  const checker = new ethers.Contract(checkerAddress, checkerAbi, provider);
  const blockInput = process.env.BLOCK_TAG || "latest";
  const blockTag = /^\d+$/.test(blockInput) ? Number(blockInput) : blockInput;

  // Single eth_call executes the batch query; returned array matches ASSETS order.
  const balances = await checker.getBalances(owner, assets, { blockTag });
  const nativeSymbol = process.env.NATIVE_SYMBOL || "Native";

  console.log(`Network chainId: ${network.chainId}`);
  console.log(`Wallet address: ${owner}`);
  console.log(`Block: ${blockTag}`);
  console.log("");

  for (let i = 0; i < assets.length; i += 1) {
    const asset = assets[i];
    let symbol = nativeSymbol;
    let decimals = 18;

    if (asset !== ZERO_ADDRESS) {
      const token = new ethers.Contract(asset, tokenAbi, provider);
      try {
        decimals = Number(await token.decimals({ blockTag }));
      } catch (_) {
        decimals = null;
      }
      try {
        symbol = await token.symbol({ blockTag });
      } catch (_) {
        symbol = "TOKEN";
      }
    }

    const raw = balances[i].toString();
    const formatted = decimals === null ? "Failed to read decimals" : ethers.formatUnits(balances[i], decimals);
    console.log(`[${i}] ${symbol} | ${asset} | ${formatted} | raw=${raw}`);
  }
}

main().catch((error) => {
  console.error("Query failed:", error.shortMessage || error.message || error);
  process.exitCode = 1;
});
