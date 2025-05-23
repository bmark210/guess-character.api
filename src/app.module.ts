import { Module } from '@nestjs/common';
import { BotModule } from './bot/bot.module';
import { CharacterModule } from './character/character.module';
import { PrismaModule } from './prisma/prisma.module';
import { GameModule } from './game/game.module';
import { AwardsModule } from './awards/awards.module';
import { HandbookModule } from './handbook/handbook.module';

@Module({
  imports: [
    CharacterModule,
    PrismaModule,
    BotModule,
    GameModule,
    HandbookModule,
    AwardsModule,
  ],
})
export class AppModule {}
