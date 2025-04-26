import { Module } from '@nestjs/common';
import { CharacterModule } from '../character/character.module';
import { PrismaModule } from '../prisma/prisma.module';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { AwardsModule } from '../awards/awards.module';
import { AwardsService } from '../awards/awards.service';
@Module({
  imports: [CharacterModule, PrismaModule, AwardsModule],
  controllers: [GameController],
  providers: [GameService, GameGateway, AwardsService],
  exports: [GameService],
})
export class GameModule {}
