import { config as dotEnvConfig } from "dotenv";
import { HardhatUserConfig, task } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

dotEnvConfig();

const lazyImport = async (module: any) => {
  return await import(module);
};

task("contract-info", "Gets contract info by address")
  .addParam("address", "Please provide contract's address")
  .setAction(async ({ address }) => {
    const { main } = await lazyImport("./scripts/contract-info.ts");
    await main(address);
  });

task("interact", "Interacts with Book Library").setAction(
  async (taskArgs, hre) => {
    const { main } = await lazyImport("./scripts/interact.ts");
    await main(hre.network.name);
  },
);

const config: HardhatUserConfig = {
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      chainId: 11155111,
      accounts: [process.env.SEPOLIA_PRIVATE_KEY || "Invalid"],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  solidity: {
    version: "0.8.19",
  },
};

export default config;
