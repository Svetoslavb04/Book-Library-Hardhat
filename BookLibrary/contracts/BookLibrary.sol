// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Book Library
/// @author Svetoslav Borislavov
/// @notice A Book Library simulator
contract BookLibrary is Ownable {
  /// @notice Emitted when a new book is added.
  /// @param bookKey The book key in bytes
  /// @param title The title of the book.
  /// @param copies The number of copies added.
  event BookAdded(bytes32 bookKey, string title, uint copies);

  /// @notice Emitted when the number of copies of an existing book is increased.
  /// @param bookKey The book id in bytes
  /// @param title The title of the book.
  /// @param copies The number of copies added.
  event BookUpdated(bytes32 bookKey, string title, uint copies);

  /// @notice Emitted when an existing book is borrowed by a user.
  /// @param bookKey The book id in bytes
  /// @param borrower The address of the user who borrowed the book.
  /// @param copiesAvailable The remaining number of available copies.
  event BookBorrowed(bytes32 bookKey, address borrower, uint copiesAvailable);

  /// @notice Emitted when a borrowed book is returned by a user.
  /// @param bookKey The book id in bytes
  /// @param borrower The address of the user who returned the book.
  /// @param copiesAvailable The updated number of available copies.
  event BookReturned(bytes32 bookKey, address borrower, uint copiesAvailable);

  /// @notice Represents a book in the library.
  struct Book {
    string title;
    uint8 copies;
    address[] borrowers;
  }

  /// @notice An array of unique book keys.
  bytes32[] public bookKeys;

  /// @notice A mapping from book keys to Book structs.
  mapping(bytes32 => Book) public books;

  /// @notice A mapping from user addresses to a mapping of book keys to borrow status.
  mapping(address => mapping(bytes32 => bool)) userBorrowedBooks;

  /// @notice Modifier that checks if a user is allowed to borrow a specific book.
  /// @param _bookId The book id in bytes
  modifier ableToBorrow(bytes32 _bookId) {
    require(
      !userBorrowedBooks[msg.sender][_bookId],
      "You cannot borrow a more than one copy!"
    );
    require(books[_bookId].copies > 0, "There aren't available copies!");
    _;
  }

  /// @notice Modifier that checks if a user is allowed to return a specific borrowed book.
  /// @param _bookId The book id in bytes
  modifier ableToReturn(bytes32 _bookId) {
    require(
      userBorrowedBooks[msg.sender][_bookId],
      "You haven't borrowed that book!"
    );
    _;
  }

  /// @dev Adds a new book or updates an existing book's copies.
  /// @param _title The title of the book to be added or updated.
  /// @param _copies The number of copies to be added or updated.
  function addBook(string memory _title, uint8 _copies) external onlyOwner {
    bytes32 bookKey = keccak256(abi.encodePacked(_title));

    if (books[bookKey].copies > 0) {
      books[bookKey].copies += _copies;
      emit BookUpdated(bookKey, _title, books[bookKey].copies);
    } else {
      books[bookKey] = Book(_title, _copies, new address[](0));
      bookKeys.push(bookKey);

      emit BookAdded(bookKey, _title, _copies);
    }
  }

  /// @dev Allows a user to borrow a book.
  /// @param _bookId The unique key of the book to be borrowed.
  function borrowBook(bytes32 _bookId) external ableToBorrow(_bookId) {
    books[_bookId].copies--;
    books[_bookId].borrowers.push(msg.sender);
    userBorrowedBooks[msg.sender][_bookId] = true;

    emit BookBorrowed(_bookId, msg.sender, books[_bookId].copies);
  }

  /// @dev Allows a user to return a borrowed book.
  /// @param _bookId The unique key of the book to be returned.
  function returnBook(bytes32 _bookId) external ableToReturn(_bookId) {
    books[_bookId].copies++;
    userBorrowedBooks[msg.sender][_bookId] = false;

    emit BookReturned(_bookId, msg.sender, books[_bookId].copies);
  }

  /// @dev Retrieves the list of borrowers for a specific book.
  /// @param _bookId The unique key of the book.
  /// @return borrowers The array of addresses of users who borrowed the book.
  function getBorrowers(
    bytes32 _bookId
  ) external view returns (address[] memory) {
    return books[_bookId].borrowers;
  }
}
