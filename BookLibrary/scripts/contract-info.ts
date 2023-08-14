import { ethers } from "hardhat";
import axios from "axios";

export async function main(address: string) {
  const provider = new ethers.EtherscanProvider(
    "sepolia",
    process.env.SEPOLIA_API_KEY,
  );

  const creator = await getContractCreator();

  if (creator) {
    console.log(`The creator of the contract is: ${creator}`);
  } else {
    console.log("Invalid contract address!");
    return;
  }

  const transactionCount = await provider.getTransactionCount(address);
  const balance = await provider.getBalance(address);

  console.log(`There are ${transactionCount} transactions to this address.`);
  console.log(`The balance of the contract is: ${balance}.`);

  async function getContractCreator() {
    const apiKey = process.env.ETHERSCAN_API_KEY;

    const apiUrl = "https://api-sepolia.etherscan.io/api";
    const module = "contract";
    const action = "getcontractcreation";

    const params = {
      module,
      action,
      contractaddresses: address,
      apikey: apiKey,
    };

    try {
      const response = await axios.get(apiUrl, { params });

      let creator = null;

      if (response.data.message === "OK") {
        creator = response.data.result[0].contractCreator;
      }

      return creator;
    } catch (error) {
      return null;
    }
  }
}
