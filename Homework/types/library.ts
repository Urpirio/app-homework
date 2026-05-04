/**
 * Library Type Definitions
 *
 * Matches the backend Prisma Book, BookCategory, and BookLoan models
 * and API response contracts.
 *
 * Validates: Requirements 4.8, 9.1
 */

export type LoanStatus = 'ACTIVE' | 'RETURNED' | 'OVERDUE';

export interface BookLoan {
  id: string;
  bookId: string;
  userId: string;
  loanDate: string;
  returnDate?: string;
  status: LoanStatus;
}

export interface BookCategory {
  id: string;
  name: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  synopsis?: string;
  location?: string;
  coverUrl?: string;
  available: boolean;
  categoryId: string;
  category?: BookCategory;
  loans?: BookLoan[];
}
