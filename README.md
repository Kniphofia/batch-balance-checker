# EVM Batch Balance Checker

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.20-363636.svg)](https://soliditylang.org/)

[English](README.md) | [中文说明](README_zh.md)

A lightweight, production-ready EVM Hardhat project to batch query native coin and ERC-20 token balances in a **single read-only `eth_call`**. `address(0)` (zero address) represents the native currency of the connected chain. Returned arrays strictly match the order of input assets.

The contract retains backward compatibility with standard Balance Checker ABI entrypoints (`etherBalances`, `tokenBalances`, `tokensBalance`, and `tokensBalances`), while providing a concise `getBalances` method for mixed native and token queries.

## Prerequisites

- Node.js 18 or later
- npm
- Native coins on the target network for gas (only required if deploying)

## Installation

Run in the project root:

```bash
npm install
```

## Deployment

1. Copy the environment variable template:

   ```bash
   cp .env.example .env
   ```

2. Set `RPC_URL` and `PRIVATE_KEY` in `.env`.
3. Deploy the contract:

   ```bash
   npm run deploy
   ```

4. Fill the deployed `BatchBalanceChecker` address into `BALANCE_CONTRACT` in `.env`.

> Deployment requires native currency for gas. Private keys are used only for deployment; read-only queries do not require a private key.

## Batch Query

Configure `.env`:

```dotenv
RPC_URL=https://your-evm-rpc-endpoint
BALANCE_CONTRACT=0xYourDeployedContractAddress
OWNER=0xWalletAddressToQuery
ASSETS=native,0xYourTokenAddress1,0xYourTokenAddress2
NATIVE_SYMBOL=Native
BLOCK_TAG=latest
```

`ASSETS` accepts comma-separated addresses. `native`, `0x0`, or the full zero address represents the native currency; all others must be token contract addresses.

Run query:

```bash
npm run query
```

The script prints asset index, symbol, address, formatted balance (based on `decimals()`), and raw integer balance. To pin a specific block height, set `BLOCK_TAG` to a block number; defaults to `latest`.

## Solidity Interface

```solidity
address[] memory assets = new address[](3);
assets[0] = address(0); // Native currency
assets[1] = USDT;       // ERC-20 token
assets[2] = USDC;       // ERC-20 token

uint256[] memory balances = checker.getBalances(wallet, assets);
// balances[0] is native currency, balances[1] is USDT, balances[2] is USDC
```

You can also directly call the backward-compatible `tokensBalance(wallet, assets)`.

## Notes

- All query methods are `view` functions executed via RPC `eth_call`. They do not create on-chain transactions and consume zero gas for the user.
- Returned values are unsigned integers in the asset's smallest unit (`raw`).
- **Fault Tolerance**: If an asset address is not a contract (e.g. EOA), does not implement `balanceOf`, or reverts, the contract safely returns `0` for that entry without reverting the whole batch.
- `tokensBalances(addresses, assets)` returns a 2D matrix: `balances[addressIndex][assetIndex]`.

## Project Structure

```text
contracts/BatchBalanceChecker.sol  Batch query smart contract
scripts/deploy.js                  Deployment script
scripts/query.js                   Read balance script (inlined ABI)
hardhat.config.js                  Compiler & network configuration
.env.example                       Environment variable template
```

## License

[MIT](LICENSE)

