import { ethers } from "ethers";
import { BookLibrary, BookLibrary__factory } from "../typechain-types";

const INFURA_API_KEY = process.env.INFURA_API_KEY || "";
const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY || "";

const sepoliaContractAddress = "0x123e44503Bb2653d41509c0F31bf65E4341794Ad";

const networks = {
  sepolia: "sepolia",
  hardhatNode: "localhost",
};

export async function main(network: string) {
  const localNodePrivateKey =
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const localNodeContractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  let provider = null;
  let wallet = null;
  let bookLibraryContract = null;

  if (network === networks.hardhatNode) {
    provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545/");
    wallet = new ethers.Wallet(localNodePrivateKey, provider);
    bookLibraryContract = BookLibrary__factory.connect(
      localNodeContractAddress,
      wallet,
    );
  } else if (network === networks.sepolia) {
    provider = new ethers.InfuraProvider("sepolia", INFURA_API_KEY);
    wallet = new ethers.Wallet(SEPOLIA_PRIVATE_KEY, provider);
    bookLibraryContract = BookLibrary__factory.connect(
      sepoliaContractAddress,
      wallet,
    );
  }

  if (!bookLibraryContract || !wallet) {
    return;
  }

  let allBooksKeys = await getAllBooksKeys(bookLibraryContract);
  console.log(`All books keys are: ${allBooksKeys.length}`);
  console.log(allBooksKeys);

  if (allBooksKeys.length === 0) {
    const bookTitle = "Solidity 101";
    const bookCopies = 1;

    console.log("----------");

    const addBookTransactionReceipt = await addBook(
      bookLibraryContract,
      bookTitle,
      bookCopies,
    );

    if (addBookTransactionReceipt?.status != 1) {
      console.log("Transaction was not successful");
    } else {
      const bookKey = await bookLibraryContract.bookKeys(0);
      console.log(`Since there were no books, one has been added.`);
      console.log(`Book key: ${bookKey}`);
      console.log(`Book title: ${bookTitle}`);
      console.log(`Book copies: ${bookCopies}`);
      console.log("----------");
    }

    allBooksKeys = await getAllBooksKeys(bookLibraryContract);
  }

  try {
    console.log("----------");
    console.log(`Borrowing book: ${allBooksKeys[0]}`);

    const borrowBookTransactionReceipt = await borrowBook(
      bookLibraryContract,
      allBooksKeys[0],
    );

    if (borrowBookTransactionReceipt?.status !== 1) {
      console.log("Borrowing the book was not successful");
    } else {
      console.log("Successfully borrowed the book!");
    }
    console.log("----------");
  } catch (error: any) {
    console.log(error?.reason);
    console.log("----------");
  }

  const firstBookKey = allBooksKeys[0];
  const bookBorrowers = await bookLibraryContract.getBorrowers(firstBookKey);

  if (bookBorrowers.includes(wallet.address)) {
    console.log("----------");
    console.log(
      `It is confirmed that wallet: \n${wallet.address} has borrowed book: \n${firstBookKey}`,
    );
    console.log("----------");
  }

  await printIsAvailableForBorrow(bookLibraryContract, firstBookKey);

  try {
    console.log("----------");
    console.log(`Returning book: ${firstBookKey}`);

    const returnBookTransactionReceipt = await returnBook(
      bookLibraryContract,
      firstBookKey,
    );

    if (returnBookTransactionReceipt?.status !== 1) {
      console.log("Returning the book was not successful");
    } else {
      console.log("Successfully returned the book!");
    }
    console.log("----------");
  } catch (error: any) {
    console.log(error?.reason);
    console.log("----------");
  }

  await printIsAvailableForBorrow(bookLibraryContract, firstBookKey);

  try {
    const bookTitle = "Mastering Ethereum";
    const bookCopies = 2;

    console.log("----------");

    const addBookTransactionReceipt = await addBook(
      bookLibraryContract,
      bookTitle,
      bookCopies,
    );

    if (addBookTransactionReceipt?.status != 1) {
      console.log("Transaction was not successful");
    } else {
      const bookKey = await bookLibraryContract.bookKeys(0);
      console.log(`Book key: ${bookKey}`);
      console.log(`Book title: ${bookTitle}`);
      console.log(`Book copies: ${bookCopies}`);
      console.log("----------");
    }
  } catch (error: any) {
    console.log(error?.reason);
    console.log("----------");
  }

  const allBooksInfo = await getAllBooks(bookLibraryContract);
  console.log(allBooksInfo);
}

async function getAllBooksKeys(bookLibraryContract: BookLibrary) {
  let bookKeys = [];

  let bookAvailable = true;
  let index = 0;

  while (bookAvailable) {
    let bookKey = null;
    try {
      bookKey = await bookLibraryContract.bookKeys(index);
    } catch (error) {}

    if (bookKey) {
      bookKeys.push(bookKey);
      index++;
    } else {
      bookAvailable = false;
    }
  }

  return bookKeys;
}

async function getAllBooks(bookLibraryContract: BookLibrary) {
  const bookKeys = await getAllBooksKeys(bookLibraryContract);

  let books = [];

  for (let i = 0; i < bookKeys.length; i++) {
    const book = await bookLibraryContract.books(bookKeys[i]);
    const bookBorrowers = await bookLibraryContract.getBorrowers(bookKeys[i]);

    books.push({
      key: bookKeys[i],
      title: book.title,
      copies: ethers.getNumber(book.copies),
      borrowers: new Set(bookBorrowers),
    });
  }
  return books;
}

async function getAllAvailableBookKeys(bookLibraryContract: BookLibrary) {
  const books = await getAllBooks(bookLibraryContract);

  let availableBooks = books.filter((b) => b.copies > 0);
  return availableBooks;
}

async function addBook(
  bookLibraryContract: BookLibrary,
  bookTitle: string,
  bookCopies: number,
) {
  const transaction = await bookLibraryContract.addBook(bookTitle, bookCopies);
  console.log(`Add Book transaction: ${transaction.hash}`);

  const transactionReceipt = await transaction.wait();

  return transactionReceipt;
}

async function borrowBook(bookLibraryContract: BookLibrary, bookKey: string) {
  const transaction = await bookLibraryContract.borrowBook(bookKey);
  console.log(`Borrow Book transaction: ${transaction.hash}`);

  const transactionReceipt = await transaction.wait();

  return transactionReceipt;
}

async function returnBook(bookLibraryContract: BookLibrary, bookKey: string) {
  const transaction = await bookLibraryContract.returnBook(bookKey);
  console.log(`Return Book transaction: ${transaction.hash}`);

  const transactionReceipt = await transaction.wait();

  return transactionReceipt;
}

async function printIsAvailableForBorrow(
  bookLibraryContract: BookLibrary,
  bookKey: string,
) {
  let availableBooks = await getAllAvailableBookKeys(bookLibraryContract);
  let bookKeys = availableBooks.map((b) => b.key);

  console.log("----------");
  console.log(
    `Book: ${bookKey} is${
      bookKeys.includes(bookKey) ? "" : " not"
    } available for borrowing`,
  );
  console.log("----------");
}
