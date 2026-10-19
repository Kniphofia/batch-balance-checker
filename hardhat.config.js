require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

const accounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    hardhat: {},
    custom: {
      url: process.env.RPC_URL || "",
      accounts
    }
  }
};
