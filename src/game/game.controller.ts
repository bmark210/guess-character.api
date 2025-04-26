import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { GameService } from './game.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { Book, CharacterType, Difficulty, HintLevel } from '@prisma/client';

@ApiTags('Game')
@Controller()
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('player')
  @ApiOperation({ summary: 'Create a new player or get existing one' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        avatarUrl: { type: 'string' },
        telegramId: { type: 'string' },
      },
      required: ['name', 'avatarUrl', 'telegramId'],
    },
  })
  async getPlayer(
    @Body()
    body: {
      name: string;
      avatarUrl: string;
      telegramId: string;
    },
  ) {
    let telegramId: string;
    try {
      telegramId = body.telegramId;
    } catch {
      throw new HttpException(
        'Invalid telegramId format',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existing = await this.gameService.getPlayerByTelegramId(telegramId);
    if (existing) return existing;

    return this.gameService.createPlayer(body.name, body.avatarUrl, telegramId);
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
  createSession(
    @Body()
    body: {
      creatorId: string;
      gameConfig: {
        difficulty: Difficulty;
        characterTypes: CharacterType[];
        books: Book[];
      };
    },
  ) {
    return this.gameService.createSession(body.creatorId, body.gameConfig);
  }

  @Post('sessions/:sessionCode/join')
  @ApiOperation({ summary: 'Join an existing game session' })
  @ApiParam({
    name: 'sessionCode',
    description: 'Code of the game session to join',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        playerId: { type: 'string' },
      },
      required: ['playerId'],
    },
  })
  @ApiResponse({ status: 200, description: 'Successfully joined the session' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async joinSession(
    @Param('sessionCode') sessionCode: string,
    @Body() body: { playerId: string },
  ) {
    try {
      return await this.gameService.joinSession(body.playerId, sessionCode);
    } catch (error) {
      if (error.message === 'Session not found') {
        throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // @Post('start-round')
  // @ApiOperation({ summary: 'Start a new round in the game session' })
  // @ApiBody({
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       sessionId: { type: 'string' },
  //     },
  //     required: ['sessionId'],
  //   },
  // })
  // startRound(@Body() body: { sessionId: string }) {
  //   return this.gameService.startRound(body.sessionId);
  // }

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

  @Post('take-guess')
  @ApiOperation({ summary: 'Take a guess in the game session' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sessionCode: { type: 'string' },
        playerId: { type: 'string' },
        guess: { type: 'string' },
      },
      required: ['sessionCode', 'playerId', 'guess'],
    },
  })
  takeGuess(
    @Body() body: { sessionCode: string; playerId: string; guess: string },
  ) {
    return this.gameService.takeGuess(
      body.sessionCode,
      body.playerId,
      body.guess,
    );
  }

  @Get('hints/:characterId')
  @ApiOperation({ summary: 'Get hints for a character' })
  @ApiParam({ name: 'characterId', description: 'ID of the character' })
  getHints(
    @Param('characterId') characterId: string,
    @Query('hintLevel') hintLevel: HintLevel,
    @Query('assignmentId') assignmentId: string,
  ) {
    return this.gameService.getHints(characterId, hintLevel, assignmentId);
  }

  @Get('has-related-character/:characterId')
  @ApiOperation({ summary: 'Check if a character has a related character' })
  @ApiParam({ name: 'characterId', description: 'ID of the character' })
  hasRelatedCharacter(@Param('characterId') characterId: string) {
    return this.gameService.hasRelatedCharacter(characterId);
  }
}
