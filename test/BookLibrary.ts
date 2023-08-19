import { expect } from "chai";
import { ethers } from "hardhat";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

describe("Book Library", () => {
  async function deployBookLibraryFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const bookLibrary = await ethers.deployContract("BookLibrary", owner);
    await bookLibrary.waitForDeployment();

    return { bookLibrary, owner, otherAccount };
  }

  describe("Deployment", () => {
    it("Should deploy with correct owner", async () => {
      const { bookLibrary, owner } = await loadFixture(
        deployBookLibraryFixture,
      );

      expect(await bookLibrary.owner()).to.equal(owner.address);
    });
  });

  describe("Transactions", () => {
    describe("Add Book", () => {
      it("Should correctly add a book", async () => {
        const { bookLibrary } = await loadFixture(deployBookLibraryFixture);

        const bookTitle = "Test Book";
        const bookCopies = 2;

        await bookLibrary.addBook(bookTitle, bookCopies);

        const bookKey = await bookLibrary.bookKeys(0);
        const book = await bookLibrary.books(bookKey);

        expect(book.title).to.equal(bookTitle);
        expect(book.copies).to.equal(BigInt(bookCopies));
      });

      it("Should correctly add copies of a book", async () => {
        const { bookLibrary } = await loadFixture(deployBookLibraryFixture);

        const bookTitle = "Test Book";
        const bookCopies = 2;

        await bookLibrary.addBook(bookTitle, bookCopies);
        await bookLibrary.addBook(bookTitle, bookCopies);

        const bookKey = await bookLibrary.bookKeys(0);
        const book = await bookLibrary.books(bookKey);

        expect(book.title).to.equal(bookTitle);
        expect(book.copies).to.equal(BigInt(bookCopies * 2));

        await expect(bookLibrary.bookKeys(1)).to.be.revertedWithoutReason();
      });
    });

    describe("Borrow Book", () => {
      it("Should correctly borrow book", async () => {
        const { bookLibrary, owner } = await loadFixture(
          deployBookLibraryFixture,
        );

        const bookTitle = "Test Book";
        const bookCopies = 2;

        await bookLibrary.addBook(bookTitle, bookCopies);

        const bookKey = await bookLibrary.bookKeys(0);

        await bookLibrary.borrowBook(bookKey);

        const book = await bookLibrary.books(bookKey);
        const bookBorrowers = await bookLibrary.getBorrowers(bookKey);

        expect(book.copies).to.equal(1n);
        expect(bookBorrowers.length).to.equal(1);
        expect(bookBorrowers[0]).to.equal(owner.address);
      });
    });

    describe("Return Book", () => {
      it("Should correctly return book", async () => {
        const { bookLibrary } = await loadFixture(deployBookLibraryFixture);

        const bookTitle = "Test Book";
        const bookCopies = 2;

        await bookLibrary.addBook(bookTitle, bookCopies);

        const bookKey = await bookLibrary.bookKeys(0);

        await bookLibrary.borrowBook(bookKey);
        await bookLibrary.returnBook(bookKey);

        const book = await bookLibrary.books(bookKey);

        expect(book.copies).to.equal(2n);
      });
    });

    describe("Return Book", () => {
      it("Should correctly return book keys array length", async () => {
        const { bookLibrary } = await loadFixture(deployBookLibraryFixture);

        const bookTitle = "Test Book";
        const bookCopies = 2;

        await bookLibrary.addBook(bookTitle, bookCopies);

        expect(await bookLibrary.getBookKeysLength()).to.equal(1);
      });
    });

    describe("Get Book Borrowers", () => {
      it("Should correctly return book borrowers", async () => {
        const { bookLibrary, owner, otherAccount } = await loadFixture(
          deployBookLibraryFixture,
        );

        const bookTitle = "Test Book";
        const bookCopies = 2;

        await bookLibrary.addBook(bookTitle, bookCopies);

        const bookKey = await bookLibrary.bookKeys(0);

        await bookLibrary.borrowBook(bookKey);
        await bookLibrary.connect(otherAccount).borrowBook(bookKey);

        const borrowers = await bookLibrary.getBorrowers(bookKey);

        expect(borrowers.length).to.equal(2n);
        expect(borrowers[0]).to.equal(owner.address);
        expect(borrowers[1]).to.equal(otherAccount.address);
      });
    });
  });

  describe("Validations", () => {
    describe("Add Book", () => {
      it("Should revert if someone different from the owner tries to add a book", async () => {
        const { bookLibrary, otherAccount } = await loadFixture(
          deployBookLibraryFixture,
        );

        const bookTitle = "Test Book";
        const bookCopies = 2;

        await expect(
          bookLibrary.connect(otherAccount).addBook(bookTitle, bookCopies),
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });

    describe("Borrow Book", () => {
      it("Should revert if someone has already borrowed that book", async () => {
        const { bookLibrary } = await loadFixture(deployBookLibraryFixture);

        const bookTitle = "Test Book";
        const bookCopies = 2;

        await bookLibrary.addBook(bookTitle, bookCopies);

        const bookKey = await bookLibrary.bookKeys(0);

        await bookLibrary.borrowBook(bookKey);

        await expect(bookLibrary.borrowBook(bookKey)).to.be.revertedWith(
          "You cannot borrow a more than one copy!",
        );
      });

      it("Should revert if no copies are available", async () => {
        const { bookLibrary } = await loadFixture(deployBookLibraryFixture);

        const bytes =
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

        await expect(bookLibrary.borrowBook(bytes)).to.be.revertedWith(
          "There aren't available copies!",
        );

        const bookTitle = "Test Book";
        const bookCopies = 0;

        await bookLibrary.addBook(bookTitle, bookCopies);

        const bookKey = await bookLibrary.bookKeys(0);

        await expect(bookLibrary.borrowBook(bookKey)).to.be.revertedWith(
          "There aren't available copies!",
        );
      });
    });

    describe("Return Book", () => {
      it("Should revert if someone hasn't borrowed that book", async () => {
        const { bookLibrary } = await loadFixture(deployBookLibraryFixture);

        const bookTitle = "Test Book";
        const bookCopies = 2;

        await bookLibrary.addBook(bookTitle, bookCopies);

        const bookKey = await bookLibrary.bookKeys(0);

        await expect(bookLibrary.returnBook(bookKey)).to.be.revertedWith(
          "You haven't borrowed that book!",
        );
      });
    });
  });

  describe("Events", () => {
    it("Should emit BookAdded event", async () => {
      const { bookLibrary } = await loadFixture(deployBookLibraryFixture);

      const bookTitle = "Test Book";
      const bookCopies = 2;

      await expect(bookLibrary.addBook(bookTitle, bookCopies))
        .to.emit(bookLibrary, "BookAdded")
        .withArgs(anyValue, "Test Book", 2);
    });

    it("Should emit BookUpdate event", async () => {
      const { bookLibrary } = await loadFixture(deployBookLibraryFixture);

      const bookTitle = "Test Book";
      const bookCopies = 2;

      await bookLibrary.addBook(bookTitle, bookCopies);

      await expect(bookLibrary.addBook(bookTitle, bookCopies))
        .to.emit(bookLibrary, "BookUpdated")
        .withArgs(anyValue, "Test Book", 4);
    });

    it("Should emit BookBorrowed event", async () => {
      const { bookLibrary, owner } = await loadFixture(
        deployBookLibraryFixture,
      );

      const bookTitle = "Test Book";
      const bookCopies = 2;

      await bookLibrary.addBook(bookTitle, bookCopies);
      const bookKey = await bookLibrary.bookKeys(0);

      await expect(bookLibrary.borrowBook(bookKey))
        .to.emit(bookLibrary, "BookBorrowed")
        .withArgs(bookKey, owner.address, 1);
    });

    it("Should emit BookReturned event", async () => {
      const { bookLibrary, owner } = await loadFixture(
        deployBookLibraryFixture,
      );

      const bookTitle = "Test Book";
      const bookCopies = 2;

      await bookLibrary.addBook(bookTitle, bookCopies);
      const bookKey = await bookLibrary.bookKeys(0);
      await bookLibrary.borrowBook(bookKey);

      await expect(bookLibrary.returnBook(bookKey))
        .to.emit(bookLibrary, "BookReturned")
        .withArgs(bookKey, owner.address, 2);
    });
  });
});
