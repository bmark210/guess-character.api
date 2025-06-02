import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HandBookBody } from 'src/dts/handbook';
import {
  BaseEntity,
  HandbookBook,
  HandbookCharacterType,
  HandbookDifficulty,
} from '@prisma/client';

@Injectable()
export class HandbookService {
  constructor(private readonly prisma: PrismaService) {}

  createBook(book: HandbookBook) {
    return this.prisma.handbookBook.create({
      data: book,
    });
  }

  createCharacterType(characterType: HandbookCharacterType) {
    return this.prisma.handbookCharacterType.create({
      data: characterType,
    });
  }

  createDifficulty(difficulty: HandbookDifficulty) {
    return this.prisma.handbookDifficulty.create({
      data: difficulty,
    });
  }

  getBooks() {
    return this.prisma.handbookBook.findMany();
  }

  getCharacterTypes() {
    return this.prisma.handbookCharacterType.findMany();
  }

  getDifficulties() {
    return this.prisma.handbookDifficulty.findMany();
  }

  async getHandbookCharacters(
    handBookBody: HandBookBody,
  ): Promise<{ data: BaseEntity[]; totalCount: number }> {
    const { book, type, level, page, pageSize } = handBookBody;

    // Validate input parameters
    if (!book?.length || !type?.length || !level?.length) {
      return { data: [], totalCount: 0 };
    }

    // Ensure page and pageSize are valid numbers
    const validPage = Math.max(1, page || 1);
    const validPageSize = Math.max(1, Math.min(100, pageSize || 10));

    const whereClause = {
      book: {
        in: book,
      },
      type: {
        in: type,
      },
      level: {
        in: level,
      },
    };

    try {
      const [data, totalCount] = await Promise.all([
        this.prisma.baseEntity.findMany({
          where: whereClause,
          orderBy: [{ book: 'asc' }, { chapter: 'asc' }, { verse: 'asc' }],
          include: {
            person: true,
            entity: true,
            foodItem: true,
            objectItem: true,
            place: true,
          },
          skip: (validPage - 1) * validPageSize,
          take: validPageSize,
        }),
        this.prisma.baseEntity.count({
          where: whereClause,
        }),
      ]);

      return { data, totalCount };
    } catch (error) {
      console.error('Error in getHandbookCharacters:', error);
      return { data: [], totalCount: 0 };
    }
  }
}
