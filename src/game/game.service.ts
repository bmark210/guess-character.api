import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma.service';

@Injectable()
export class GameService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(creatorId: string) {
    return this.prisma.gameSession.create({
      data: {
        creatorId,
        code: this.generateCode(),
      },
    });
  }

  private generateCode(): string {
    return Math.random().toString(36).substring(2, 8); // короче и легче вводить
  }

  async joinSession(playerId: string, sessionId: string) {
    const session = await this.prisma.gameSession.findUnique({
      where: { code: sessionId },
      include: { players: true },
    });
    if (!session) throw new Error('Session not found');

    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
      include: { session: true },
    });
    if (player.sessionId && player.sessionId === session.id) {
      return session;
    }

    // If player is in a different session or no session, update their sessionId
    await this.prisma.player.update({
      where: { id: playerId },
      data: { sessionId: session.id },
    });

    return session;
  }

  async startRound(sessionId: string) {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new Error('Session not found');

    const players = await this.prisma.player.findMany({
      where: { sessionId },
    });
    if (!players.length) throw new Error('No players found');

    const characters = await this.prisma.baseEntity.findMany();
    if (!characters.length) throw new Error('No characters found');

    return this.prisma.round.create({
      data: {
        sessionId,
        playerId: players[0].id, // пока берём первого
        characterId: characters[0].id, // пока берём первого
      },
    });
  }

  async endRound(sessionId: string) {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new Error('Session not found');

    return this.prisma.round.findFirst({
      where: { sessionId },
    });
  }

  async createPlayer(name: string, avatarUrl: string, telegramId: number) {
    if (!telegramId) throw new Error('Telegram ID is required');

    return this.prisma.player.create({
      data: { name, avatarUrl, telegramId },
    });
  }

  async getPlayer(telegramId: number) {
    if (!telegramId) throw new Error('Telegram ID is required');

    return this.prisma.player.findUnique({
      where: { telegramId: telegramId },
    });
  }

  async getSession(sessionId: string) {
    return this.prisma.gameSession.findUnique({
      where: { id: sessionId },
    });
  }
}
