import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HandbookController } from './handbook.controller';
import { HandbookService } from './handbook.service';

@Module({
  imports: [PrismaModule],
  controllers: [HandbookController],
  providers: [HandbookService],
})
export class HandbookModule {}
