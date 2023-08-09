import { ethers } from "hardhat";

async function main() {
  const bookLibrary = await ethers.deployContract("BookLibrary");

  (await bookLibrary).waitForDeployment();

  console.log(`Book Library deployed to ${bookLibrary.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
