import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma.service';
import { CreateCharacterDto } from '../dts/create-character.dto';

@Injectable()
export class CharacterService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateCharacterDto) {
    return this.prisma.character.create({ data });
  }

  findAll() {
    return this.prisma.character.findMany();
  }

  findOne(id: string) {
    return this.prisma.character.findUnique({ where: { id } });
  }

  update(id: string, data: CreateCharacterDto) {
    return this.prisma.character.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.character.delete({ where: { id } });
  }
}
