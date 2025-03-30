import { Module } from '@nestjs/common';
import { CharacterModule } from '../character/character.module';
import { PrismaModule } from '../core/prisma.module';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';

@Module({
  imports: [CharacterModule, PrismaModule],
  controllers: [GameController],
  providers: [GameService, GameGateway],
  exports: [GameService],
})
export class GameModule {}
