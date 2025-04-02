import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma.service';
import { CharacterType } from '@prisma/client';
import { Difficulty } from '@prisma/client';

@Injectable()
export class GameService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateCode(): Promise<string> {
    let code: string;
    let isUnique = false;

    while (!isUnique) {
      code = Math.floor(Math.random() * 900 + 100).toString();
      const existingSession = await this.prisma.gameSession.findUnique({
        where: { code },
      });
      if (!existingSession) {
        isUnique = true;
      }
    }

    return code;
  }

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
        code: await this.generateCode(),
        difficulty: gameConfig.difficulty,
        characterTypes: [gameConfig.characterType],
        mentionType: gameConfig.mention,
      },
    });
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

  // async startRound(sessionId: string) {
  //   const session = await this.prisma.gameSession.findUnique({
  //     where: { id: sessionId },
  //     include: { players: true },
  //   });
  //   if (!session) throw new Error('Session not found');
  //   if (!session.players.length) throw new Error('No players found');

  //   // Update game status to IN_PROGRESS
  //   await this.prisma.gameSession.update({
  //     where: { id: sessionId },
  //     data: { status: 'IN_PROGRESS' },
  //   });

  //   // Получаем последний раунд для определения следующего игрока
  //   const lastRound = await this.prisma.round.findFirst({
  //     where: { sessionId },
  //   });

  //   // Определяем следующего игрока
  //   const currentPlayerIndex = lastRound
  //     ? session.players.findIndex((p) => p.id === lastRound.playerId)
  //     : -1;

  //   const nextPlayerIndex = (currentPlayerIndex + 1) % session.players.length;
  //   const nextPlayer = session.players[nextPlayerIndex];

  //   // Получаем персонажей, подходящих под настройки сессии
  //   const characters = await this.prisma.baseEntity.findMany({
  //     where: {
  //       type: { in: session.characterTypes },
  //       level: session.difficulty,
  //     },
  //   });
  //   if (!characters.length) throw new Error('No suitable characters found');

  //   // Проверяем, какие персонажи уже были использованы в этой сессии
  //   const usedCharacters = await this.prisma.round.findMany({
  //     where: { sessionId },
  //     select: { characterId: true },
  //   });
  //   const usedCharacterIds = usedCharacters.map((rc) => rc.characterId);

  //   // Фильтруем персонажей, исключая уже использованные
  //   const availableCharacters = characters.filter(
  //     (char) => !usedCharacterIds.includes(char.id),
  //   );

  //   if (!availableCharacters.length) {
  //     throw new Error('No available characters left for this session');
  //   }

  //   // Выбираем случайного персонажа из доступных
  //   const randomCharacter =
  //     availableCharacters[
  //       Math.floor(Math.random() * availableCharacters.length)
  //     ];

  //   // Создаем новый раунд
  //   return this.prisma.round.create({
  //     data: {
  //       sessionId,
  //       playerId: nextPlayer.id,
  //       characterId: randomCharacter.id,
  //     },
  //     include: {
  //       character: true,
  //       player: true,
  //     },
  //   });
  // }

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

  async getSession(sessionCode: string) {
    return this.prisma.gameSession.findUnique({
      where: { code: sessionCode },
      include: {
        players: true,
      },
    });
  }

  async updateSession(sessionCode: string, update: any) {
    return this.prisma.gameSession.update({
      where: { code: sessionCode },
      data: update,
    });
  }

  async updateGameStatus(
    sessionCode: string,
    status: 'WAITING_FOR_PLAYERS' | 'IN_PROGRESS' | 'FINISHED',
  ) {
    return this.prisma.gameSession.update({
      where: { code: sessionCode },
      data: { status },
    });
  }

  async removePlayerFromSession(playerId: string) {
    // First, get the player to find their session
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
      include: { session: true },
    });

    if (!player) {
      throw new Error('Player not found');
    }

    // Update the player to remove their session reference
    return this.prisma.player.update({
      where: { id: playerId },
      data: { sessionId: null },
    });
  }

  async assignCharactersToPlayers(sessionCode: string) {
    const session = await this.prisma.gameSession.findUnique({
      where: { code: sessionCode },
      include: { players: true },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Get available characters based on session settings
    const characters = await this.prisma.baseEntity.findMany({
      where: {
        type: { in: session.characterTypes },
        level: session.difficulty,
        mention: session.mentionType,
      },
      include: {
        person: true,
        entity: true,
        foodItem: true,
        objectItem: true,
        place: true,
      },
    });

    if (!characters.length) {
      throw new Error('No suitable characters found');
    }

    // Shuffle characters array
    const shuffledCharacters = [...characters].sort(() => Math.random() - 0.5);

    // Assign characters to players
    const assignments = await Promise.all(
      session.players.map(async (player, index) => {
        const character = shuffledCharacters[index % shuffledCharacters.length];
        return this.prisma.round.create({
          data: {
            sessionId: session.id,
            playerId: player.id,
            characterId: character.id,
          },
          include: {
            character: {
              include: {
                person: true,
                entity: true,
                foodItem: true,
                objectItem: true,
                place: true,
              },
            },
            player: true,
          },
        });
      }),
    );

    return assignments;
  }

  async getPlayerAssignments(sessionCode: string) {
    const session = await this.prisma.gameSession.findUnique({
      where: { code: sessionCode },
      include: { players: true },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Get all rounds with their characters and players
    const rounds = await this.prisma.round.findMany({
      where: { sessionId: session.id },
      include: {
        character: {
          include: {
            person: true,
            entity: true,
            foodItem: true,
            objectItem: true,
            place: true,
          },
        },
        player: true,
      },
    });

    // Shuffle the rounds array to randomize assignments
    const shuffledRounds = [...rounds].sort(() => Math.random() - 0.5);

    // Create an array with length equal to number of players
    const assignments = new Array(session.players.length).fill(null);

    // Fill the array with shuffled rounds
    shuffledRounds.forEach((round) => {
      const playerIndex = session.players.findIndex(
        (player) => player.id === round.playerId,
      );
      if (playerIndex !== -1) {
        assignments[playerIndex] = round;
      }
    });

    return assignments;
  }
}
