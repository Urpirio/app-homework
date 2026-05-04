// Feature: homework-app-integration, Property 30: Book loan/return round-trip restores availability
/**
 * Property 30: Book loan/return round-trip restores availability
 *
 * For any available book, requesting a loan should make the book unavailable,
 * and subsequently returning the book should restore its availability to true.
 * The loan history should contain both the loan and return records.
 *
 * **Validates: Requirements 18.6, 18.7**
 */

import * as fc from 'fast-check';
import type { Book, BookLoan } from '../../types/library';

// ---------------------------------------------------------------------------
// Pure domain logic under test
// ---------------------------------------------------------------------------

/**
 * Simulate loaning a book: sets available to false and adds an ACTIVE loan.
 */
function loanBook(book: Book, userId: string, loanId: string, loanDate: string): { book: Book; loan: BookLoan } {
  if (!book.available) {
    throw new Error('Book is not available for loan');
  }
  const loan: BookLoan = {
    id: loanId,
    bookId: book.id,
    userId,
    loanDate,
    status: 'ACTIVE',
  };
  const updatedBook: Book = {
    ...book,
    available: false,
    loans: [...(book.loans || []), loan],
  };
  return { book: updatedBook, loan };
}

/**
 * Simulate returning a book: sets available to true and updates the loan status.
 */
function returnBook(book: Book, loanId: string, returnDate: string): { book: Book; loan: BookLoan } {
  const loans = book.loans || [];
  const loanIndex = loans.findIndex(l => l.id === loanId && l.status === 'ACTIVE');
  if (loanIndex === -1) {
    throw new Error('No active loan found for this book');
  }
  const updatedLoan: BookLoan = {
    ...loans[loanIndex],
    returnDate,
    status: 'RETURNED',
  };
  const updatedLoans = [...loans];
  updatedLoans[loanIndex] = updatedLoan;
  const updatedBook: Book = {
    ...book,
    available: true,
    loans: updatedLoans,
  };
  return { book: updatedBook, loan: updatedLoan };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const bookArb: fc.Arbitrary<Book> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  author: fc.string({ minLength: 1, maxLength: 30 }),
  synopsis: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  location: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
  coverUrl: fc.option(fc.webUrl(), { nil: undefined }),
  available: fc.constant(true), // Start with available book
  categoryId: fc.uuid(),
  category: fc.option(
    fc.record({ id: fc.uuid(), name: fc.string({ minLength: 1, maxLength: 20 }) }),
    { nil: undefined },
  ),
  loans: fc.constant([]), // Start with no loans
});

const userIdArb = fc.uuid();
const loanIdArb = fc.uuid();
const dateArb = fc.integer({
  min: new Date('2025-01-01').getTime(),
  max: new Date('2025-12-31').getTime(),
}).map(ts => new Date(ts).toISOString());

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 30: Book loan/return round-trip restores availability', () => {
  it('loaning an available book makes it unavailable', () => {
    fc.assert(
      fc.property(
        bookArb,
        userIdArb,
        loanIdArb,
        dateArb,
        (book, userId, loanId, loanDate) => {
          const result = loanBook(book, userId, loanId, loanDate);
          expect(result.book.available).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('returning a loaned book restores availability to true', () => {
    fc.assert(
      fc.property(
        bookArb,
        userIdArb,
        loanIdArb,
        dateArb,
        dateArb,
        (book, userId, loanId, loanDate, returnDate) => {
          const afterLoan = loanBook(book, userId, loanId, loanDate);
          const afterReturn = returnBook(afterLoan.book, loanId, returnDate);
          expect(afterReturn.book.available).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('loan history contains both the loan and return records after round-trip', () => {
    fc.assert(
      fc.property(
        bookArb,
        userIdArb,
        loanIdArb,
        dateArb,
        dateArb,
        (book, userId, loanId, loanDate, returnDate) => {
          const afterLoan = loanBook(book, userId, loanId, loanDate);
          const afterReturn = returnBook(afterLoan.book, loanId, returnDate);

          const loans = afterReturn.book.loans || [];
          expect(loans).toHaveLength(1);

          const loan = loans[0];
          expect(loan.id).toBe(loanId);
          expect(loan.bookId).toBe(book.id);
          expect(loan.userId).toBe(userId);
          expect(loan.loanDate).toBe(loanDate);
          expect(loan.returnDate).toBe(returnDate);
          expect(loan.status).toBe('RETURNED');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('loaning a book that is already loaned throws an error', () => {
    fc.assert(
      fc.property(
        bookArb,
        userIdArb,
        loanIdArb,
        fc.uuid(),
        dateArb,
        dateArb,
        (book, userId, loanId1, loanId2, date1, date2) => {
          const afterLoan = loanBook(book, userId, loanId1, date1);
          expect(() => loanBook(afterLoan.book, userId, loanId2, date2)).toThrow(
            'Book is not available for loan',
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  it('multiple loan/return cycles all restore availability', () => {
    fc.assert(
      fc.property(
        bookArb,
        fc.array(
          fc.tuple(userIdArb, loanIdArb, dateArb, dateArb),
          { minLength: 1, maxLength: 5 },
        ),
        (book, cycles) => {
          let currentBook = book;
          for (const [userId, loanId, loanDate, returnDate] of cycles) {
            const afterLoan = loanBook(currentBook, userId, loanId, loanDate);
            expect(afterLoan.book.available).toBe(false);
            const afterReturn = returnBook(afterLoan.book, loanId, returnDate);
            expect(afterReturn.book.available).toBe(true);
            currentBook = afterReturn.book;
          }
          // After all cycles, book should be available
          expect(currentBook.available).toBe(true);
          // Loan history should contain all cycles
          expect(currentBook.loans).toHaveLength(cycles.length);
        },
      ),
      { numRuns: 100 },
    );
  });
});
