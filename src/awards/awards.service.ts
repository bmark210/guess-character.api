import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Award } from '@prisma/client';
@Injectable()
export class AwardsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(award: Award) {
    return this.prisma.award.create({
      data: {
        ...award,
      },
    });
  }

  async findAll() {
    return this.prisma.award.findMany();
  }

  async getAwardByRating(rating: number) {
    return this.prisma.award.findFirst({
      where: {
        raiting: {
          lte: rating,
        },
      },
      orderBy: {
        raiting: 'desc',
      },
    });
  }
}
