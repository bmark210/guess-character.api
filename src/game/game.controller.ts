import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { GameService } from './game.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Game')
@Controller()
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('create-player')
  @ApiOperation({ summary: 'Create a new player or get existing one' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        avatarUrl: { type: 'string' },
        telegramId: { type: 'number' },
      },
      required: ['name', 'avatarUrl', 'telegramId'],
    },
  })
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
  @ApiOperation({ summary: 'Create a new game session' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        creatorId: { type: 'string' },
      },
      required: ['creatorId'],
    },
  })
  createSession(@Body() body: { creatorId: string }) {
    return this.gameService.createSession(body.creatorId);
  }

  @Post('join-session')
  @ApiOperation({ summary: 'Join an existing game session' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        playerId: { type: 'string' },
        sessionId: { type: 'string' },
      },
      required: ['playerId', 'sessionId'],
    },
  })
  joinSession(@Body() body: { playerId: string; sessionId: string }) {
    return this.gameService.joinSession(body.playerId, body.sessionId);
  }

  @Post('start-round')
  @ApiOperation({ summary: 'Start a new round in the game session' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
      },
      required: ['sessionId'],
    },
  })
  startRound(@Body() body: { sessionId: string }) {
    return this.gameService.startRound(body.sessionId);
  }

  @Post('end-round')
  @ApiOperation({ summary: 'End the current round in the game session' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
      },
      required: ['sessionId'],
    },
  })
  endRound(@Body() body: { sessionId: string }) {
    return this.gameService.endRound(body.sessionId);
  }

  @Get('session/:sessionId')
  @ApiOperation({ summary: 'Get game session by ID' })
  @ApiResponse({ status: 200, description: 'Returns the game session' })
  getSession(@Param('sessionId') sessionId: string) {
    return this.gameService.getSession(sessionId);
  }
}
