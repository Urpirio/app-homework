import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoanStatus } from '@prisma/client';

@Injectable()
export class LibraryService {
  constructor(private prisma: PrismaService) {}

  async findAll(institutionId: string, query: { search?: string; category?: string }) {
    return this.prisma.book.findMany({
      where: {
        institutionId,
        AND: [
          query.search ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { author: { contains: query.search, mode: 'insensitive' } },
            ],
          } : {},
          query.category && query.category !== 'Todos' ? {
            category: { name: query.category }
          } : {},
        ]
      },
      include: { category: true },
      orderBy: { title: 'asc' }
    });
  }

  async findOne(id: string) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: { category: true }
    });
    if (!book) throw new NotFoundException('Libro no encontrado');
    return book;
  }

  async getCategories() {
    return this.prisma.bookCategory.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async loanBook(bookId: string, userId: string) {
    const book = await this.prisma.book.findUnique({ where: { id: bookId } });
    if (!book) throw new NotFoundException('Libro no encontrado');
    if (!book.available) throw new ConflictException('El libro no está disponible');

    return this.prisma.$transaction(async (tx) => {
      await tx.book.update({
        where: { id: bookId },
        data: { available: false }
      });

      return tx.bookLoan.create({
        data: {
          bookId,
          userId,
          status: LoanStatus.ACTIVE
        }
      });
    });
  }

  async returnBook(loanId: string) {
    const loan = await this.prisma.bookLoan.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Préstamo no encontrado');

    return this.prisma.$transaction(async (tx) => {
      await tx.book.update({
        where: { id: loan.bookId },
        data: { available: true }
      });

      return tx.bookLoan.update({
        where: { id: loanId },
        data: { 
          status: LoanStatus.RETURNED,
          returnDate: new Date()
        }
      });
    });
  }
}
