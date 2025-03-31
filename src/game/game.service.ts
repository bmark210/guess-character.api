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
    return Math.floor(Math.random() * 900 + 100).toString();
  }

  async joinSession(playerId: string, sessionCode: string) {
    const session = await this.prisma.gameSession.findUnique({
      where: { code: sessionCode },
      include: { players: true },
    });
    if (!session) throw new Error('Session not found');

    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
    });

    if (player.sessionId !== session.id) {
      await this.prisma.player.update({
        where: { id: playerId },
        data: { sessionId: session.id },
      });
    }

    // 🔁 получаем обновлённую сессию с игроками
    const updatedSession = await this.prisma.gameSession.findUnique({
      where: { code: sessionCode },
      include: { players: true },
    });

    return updatedSession;
  }

  async getSessionPlayers(sessionCode: string) {
    const session = await this.prisma.gameSession.findUnique({
      where: { code: sessionCode },
      include: { players: true },
    });
    if (!session) throw new Error('Session not found');
    return session.players;
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

  async getPlayerByTelegramId(telegramId: number) {
    if (!telegramId) throw new Error('Telegram ID is required');

    return this.prisma.player.findUnique({
      where: { telegramId: telegramId },
    });
  }

  async getPlayerById(playerId: string) {
    if (!playerId) throw new Error('Player ID is required');

    return this.prisma.player.findUnique({
      where: { id: playerId },
    });
  }

  async getSession(sessionId: string) {
    return this.prisma.gameSession.findUnique({
      where: { id: sessionId },
    });
  }

  async updateSession(sessionCode: string, update: any) {
    return this.prisma.gameSession.update({
      where: { code: sessionCode },
      data: update,
    });
  }

  async removePlayerFromSession(playerId: string) {
    return this.prisma.player.update({
      where: { id: playerId },
      data: { sessionId: null },
    });
  }
}
