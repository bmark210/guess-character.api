import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { GameService } from './game.service';

@Controller()
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('create-player')
  async createPlayer(
    @Body() body: { name: string; avatarUrl: string; telegramId: number },
  ) {
    const player = await this.gameService.getPlayerByTelegramId(
      body.telegramId,
    );
    if (player) {
      return player;
    }

    return this.gameService.createPlayer(
      body.name,
      body.avatarUrl,
      body.telegramId,
    );
  }

  @Post('sessions')
  createSession(@Body() body: { creatorId: string }) {
    return this.gameService.createSession(body.creatorId);
  }

  @Post('join-session')
  joinSession(@Body() body: { playerId: string; sessionId: string }) {
    return this.gameService.joinSession(body.playerId, body.sessionId);
  }

  @Post('start-round')
  startRound(@Body() body: { sessionId: string }) {
    return this.gameService.startRound(body.sessionId);
  }

  @Post('end-round')
  endRound(@Body() body: { sessionId: string }) {
    return this.gameService.endRound(body.sessionId);
  }

  @Get('session/:sessionId')
  getSession(@Param('sessionId') sessionId: string) {
    return this.gameService.getSession(sessionId);
  }
}
