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
        raiting: award.raiting,
        color: award.color,
      },
    });
  }

  async findAll() {
    return this.prisma.award.findMany();
  }

  // raiting is 100
  // in the table of awards is one item with raiting 100 but it is not given to the player
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
