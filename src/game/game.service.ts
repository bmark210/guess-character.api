import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma.service';
import { CharacterType } from '@prisma/client';
import { Difficulty } from '@prisma/client';

@Injectable()
export class GameService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(
    creatorId: string,
    gameConfig: {
      difficulty: Difficulty;
      characterType: CharacterType;
      mention: string;
    },
  ) {
    return this.prisma.gameSession.create({
      data: {
        creatorId,
        code: this.generateCode(),
        difficulty: gameConfig.difficulty,
        characterTypes: [gameConfig.characterType],
        mentionType: gameConfig.mention,
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
      include: { players: true },
    });
    if (!session) throw new Error('Session not found');
    if (!session.players.length) throw new Error('No players found');

    // Получаем последний раунд для определения следующего игрока
    const lastRound = await this.prisma.round.findFirst({
      where: { sessionId },
    });

    // Определяем следующего игрока
    const currentPlayerIndex = lastRound
      ? session.players.findIndex((p) => p.id === lastRound.playerId)
      : -1;

    const nextPlayerIndex = (currentPlayerIndex + 1) % session.players.length;
    const nextPlayer = session.players[nextPlayerIndex];

    // Получаем персонажей, подходящих под настройки сессии
    const characters = await this.prisma.baseEntity.findMany({
      where: {
        type: { in: session.characterTypes },
        level: session.difficulty,
      },
    });
    if (!characters.length) throw new Error('No suitable characters found');

    // Проверяем, какие персонажи уже были использованы в этой сессии
    const usedCharacters = await this.prisma.round.findMany({
      where: { sessionId },
      select: { characterId: true },
    });
    const usedCharacterIds = usedCharacters.map((rc) => rc.characterId);

    // Фильтруем персонажей, исключая уже использованные
    const availableCharacters = characters.filter(
      (char) => !usedCharacterIds.includes(char.id),
    );

    if (!availableCharacters.length) {
      throw new Error('No available characters left for this session');
    }

    // Выбираем случайного персонажа из доступных
    const randomCharacter =
      availableCharacters[
        Math.floor(Math.random() * availableCharacters.length)
      ];

    // Создаем новый раунд
    return this.prisma.round.create({
      data: {
        sessionId,
        playerId: nextPlayer.id,
        characterId: randomCharacter.id,
      },
      include: {
        character: true,
        player: true,
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

  async createPlayer(name: string, avatarUrl: string, telegramId: string) {
    return this.prisma.player.create({
      data: { name, avatarUrl, telegramId },
    });
  }

  async getPlayerByTelegramId(telegramId: string) {
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
