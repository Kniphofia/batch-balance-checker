# EVM 批量余额查询合约

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.20-363636.svg)](https://soliditylang.org/)

[English](README.md) | [中文说明](README_zh.md)

这是一个可直接编译和部署的通用 EVM Hardhat 项目。它能在**一次只读调用**中查询一个地址的原生主币和多个 ERC-20 代币余额。资产数组中的 `address(0)`（零地址）表示当前链的原生主币，返回数组按输入顺序排列。

项目保留了标准 EVM 批量查询合约 ABI 中的 `etherBalances`、`tokenBalances`、`tokensBalance` 和 `tokensBalances` 四个入口；另提供更直观的 `getBalances`，用于单个地址的原生主币与代币混合查询。

## 环境要求

- Node.js 18 或更新版本
- npm
- 如需部署到链上：部署账户有对应网络的原生币（用于支付 Gas），并准备一个可用的 RPC URL

## 安装依赖

在项目根目录运行：

```bash
npm install
```

## 部署到链上

1. 复制环境变量模板：

   ```bash
   cp .env.example .env
   ```

2. 在 `.env` 中设置 `RPC_URL` 与 `PRIVATE_KEY`。**不要把真实私钥提交到 Git，也不要发给他人。**
3. 部署合约：

   ```bash
   npm run deploy
   ```

4. 将终端输出的 `BatchBalanceChecker` 合约地址填到 `.env` 的 `BALANCE_CONTRACT`。

部署会花费网络原生币作为 Gas，请确认网络和部署账户无误。部署者私钥仅用于部署；查询脚本不需要私钥。

## 批量查询

在 `.env` 中设置：

```dotenv
RPC_URL=https://your-evm-rpc-endpoint
BALANCE_CONTRACT=0x你部署的新合约地址
OWNER=0x要查询的钱包地址
ASSETS=native,0xYourTokenAddress1,0xYourTokenAddress2
NATIVE_SYMBOL=Native
BLOCK_TAG=latest
```

`ASSETS` 可用逗号分隔多个地址。`native`、`0x0` 或完整零地址均表示原生主币；其余地址必须是代币合约地址。上例中结果依次是原生主币、代币1、代币2。之后执行：

```bash
npm run query
```

查询脚本打印资产序号、代币符号、资产地址、按 `decimals()` 格式化后的余额和原始最小单位余额。若需要对齐某个区块高度，把 `BLOCK_TAG` 设置为区块号；默认使用 `latest`。

## Solidity 接口示例

```solidity
address[] memory assets = new address[](3);
assets[0] = address(0); // 原生主币
assets[1] = USDT;       // 代币
assets[2] = USDC;       // 代币

uint256[] memory balances = checker.getBalances(wallet, assets);
// balances[0] 是原生主币，balances[1] 是 USDT，balances[2] 是 USDC
```

也可以直接调用与原接口兼容的 `tokensBalance(wallet, assets)`。

## 注意事项

- 查询方法都是 `view`，通常通过 RPC `eth_call` 执行，不会发送交易，也不消耗用户链上交易 Gas；但部署合约需要正常支付网络 Gas。
- 返回值为最小单位整数。格式化展示必须读取每个代币的 `decimals()`；原生主币通常按 18 位小数处理。
- 如果某个代币地址不是合约（如 EOA 地址）、未兼容实现 `balanceOf` 或调用发生回滚，合约会自动容错并返回该项余额为 0，不会导致整批调用回滚。遇到 RPC 超时或单次执行上限时，将资产拆成较小批次查询。
- `tokensBalances(addresses, assets)` 返回二维数组，第一维对应地址，第二维对应资产：`balances[addressIndex][assetIndex]`。

## 目录结构

```text
contracts/BatchBalanceChecker.sol  查询合约
scripts/deploy.js                  部署脚本
scripts/query.js                   读取链上余额脚本
hardhat.config.js                  编译器与网络配置
.env.example                       环境变量模板
```

## 开源协议

[MIT](LICENSE)

