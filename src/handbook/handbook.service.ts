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
    const [data, totalCount] = await Promise.all([
      this.prisma.baseEntity.findMany({
        where: {
          book: {
            in: book,
          },
          type: {
            in: type,
          },
          level: {
            in: level,
          },
        },
        orderBy: [{ book: 'asc' }, { chapter: 'asc' }, { verse: 'asc' }],
        include: {
          person: true,
          entity: true,
          foodItem: true,
          objectItem: true,
          place: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.baseEntity.count({
        where: {
          book: {
            in: book,
          },
          type: {
            in: type,
          },
          level: {
            in: level,
          },
        },
      }),
    ]);

    return { data, totalCount };
  }
}
