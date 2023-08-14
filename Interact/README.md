# Interaction Project

This project interacts with the BookLibrary contract.

The first thing to do is to perform the steps from the `README.md` in the BookLibrary folder.\
Run `npm install` here.\
This project requires basic .env file configuration.\
You may fulfill the `.env.example` and remove '.example' to make the file valid `.env`\
The following environment variables are required:
`SEPOLIA_URL`, `SEPOLIA_PRIVATE_KEY`, `ETHERSCAN_API_KEY`

Contract address: 0x123e44503Bb2653d41509c0F31bf65E4341794Ad
Contract link: https://sepolia.etherscan.io/address/0x123e44503Bb2653d41509c0F31bf65E4341794Ad

## Interact with the contract locally:

Open a terminal in BookLibrary folder and run `npx hardhat node`\
Deploy the contract locally with: `npx hardhat run scripts/deploy.ts --network localhost`\
Open `index.js` and run the function `run` with `interactWith.hardhatNode`\
Execute `npm start` and watch

## Interact with the contract via Sepolia

Make sure that you have set the correct environment variables\
Open `index.js` and run the function `run` with `interactWith.sepolia`\
Execute `npm start` and watch
