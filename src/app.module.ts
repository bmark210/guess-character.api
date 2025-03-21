import { Module } from '@nestjs/common';
import { BotModule } from './bot/bot.module';
import { CharacterModule } from './character/character.module';
import { PrismaModule } from './core/prisma.module';

@Module({
  imports: [CharacterModule, PrismaModule, BotModule],
})
export class AppModule {}
