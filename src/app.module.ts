import { Module } from '@nestjs/common';
import { BotModule } from './bot/bot.module';
import { CharacterModule } from './character/character.module';
import { PrismaModule } from './prisma/prisma.module';
import { GameModule } from './game/game.module';

@Module({
  imports: [CharacterModule, PrismaModule, BotModule, GameModule],
  // imports: [CharacterModule, PrismaModule, GameModule],
})
export class AppModule {}
