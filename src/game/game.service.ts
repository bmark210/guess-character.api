import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GameConfig } from 'src/dts/game-config.dto';
import { isGuessCloseEnough } from 'src/utils/is-guess-close';

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

  async createSession(creatorId: string, gameConfig: GameConfig) {
    try {
      const code = await this.generateCode();

      if (!creatorId) {
        throw new Error('Creator ID is required');
      }

      if (!gameConfig) {
        throw new Error('Game configuration is required');
      }

      if (!gameConfig.difficulty) {
        throw new Error('Difficulty is required');
      }

      if (!gameConfig.characterTypes.length) {
        throw new Error('Character types are required');
      }

      if (!gameConfig.books.length) {
        throw new Error('Books are required');
      }

      return this.prisma.gameSession.create({
        data: {
          creatorId,
          code,
          difficulty: gameConfig.difficulty,
          characterTypes: gameConfig.characterTypes,
          books: gameConfig.books,
          status: 'WAITING_FOR_PLAYERS',
        },
      });
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async joinSession(playerId: string, sessionCode: string) {
    const session = await this.getSession(sessionCode);
    if (!session) throw new Error('Session not found');

    const player = await this.getPlayerById(playerId);

    if (player.sessionId !== session.id) {
      await this.prisma.player.update({
        where: { id: playerId },
        data: { sessionId: session.id },
      });
    }

    await this.prisma.gameSession.update({
      where: { id: session.id },
      data: {
        players: { connect: { id: playerId } },
      },
    });

    // 🔁 получаем обновлённую сессию с игроками
    return await this.prisma.gameSession.findUnique({
      where: { code: sessionCode },
      include: {
        players: true,
        // assignments: { include: { character: true, player: true } },
      },
    });

    // return this.getSession(sessionCode, playerId);
  }

  async getSessionPlayers(sessionCode: string) {
    const session = await this.prisma.gameSession.findUnique({
      where: { code: sessionCode },
      include: { players: true },
    });
    if (!session) throw new Error('Session not found');
    return session.players;
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

  async getSession(sessionCode: string, currentPlayerId?: string) {
    // A) load *all* assignments with full character
    const raw = await this.prisma.gameSession.findUnique({
      where: { code: sessionCode },
      include: {
        players: true,
        assignments: {
          include: {
            player: true,
            character: {
              include: {
                person: true,
                entity: true,
                foodItem: true,
                objectItem: true,
                place: true,
              },
            },
          },
        },
      },
    });

    if (!raw) throw new Error('Session not found');

    //no playerId ⇒ return everything
    // if (!currentPlayerId) {
    //   console.log('is currentPlayerId', currentPlayerId);
    //   return raw;
    // }

    // B) mask out _other_ players’ character payloads
    const assignments = raw.assignments.map((a) => {
      const {
        id,
        sessionId,
        playerId,
        characterId,
        tries,
        isWinner,
        player,
        character,
      } = a;

      // expose full `character` only to its owner; everyone else just gets an { id }
      return {
        id,
        sessionId,
        playerId,
        characterId,
        tries,
        isWinner,
        player,
        character:
          playerId === currentPlayerId
            ? {
                id: character.id,
                type: character.type,
                book: character.book,
                level: character.level,
              }
            : character,
      };
    });

    // C) override the assignments and return
    return {
      ...raw,
      assignments,
    };
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
    return this.prisma.gameSession.update({
      where: { id: player.sessionId },
      data: { players: { disconnect: { id: playerId } } },
    });
  }

  // async assignCharactersToPlayers(sessionCode: string) {
  //   const session = await this.prisma.gameSession.findUnique({
  //     where: { code: sessionCode },
  //     include: { players: true },
  //   });

  //   if (!session) {
  //     throw new Error('Session not found');
  //   }

  //   const characters = await this.prisma.baseEntity.findMany({
  //     where: {
  //       type: { in: session.characterTypes },
  //       level: session.difficulty,
  //       book: { in: session.books },
  //     },
  //     include: {
  //       person: true,
  //       entity: true,
  //       foodItem: true,
  //       objectItem: true,
  //       place: true,
  //     },
  //   });

  //   if (!characters.length) {
  //     throw new Error('No suitable characters found');
  //   }

  //   // Shuffle characters array
  //   const shuffledCharacters = [...characters].sort(() => Math.random() - 0.5);

  //   // Assign characters to players
  //   const assignments = await Promise.all(
  //     session.players.map(async (player, index) => {
  //       const character = shuffledCharacters[index % shuffledCharacters.length];
  //       return this.prisma.round.create({
  //         data: {
  //           sessionId: session.id,
  //           playerId: player.id,
  //           characterId: character.id,
  //         },
  //         include: {
  //           character: {
  //             include: {
  //               person: true,
  //               entity: true,
  //               foodItem: true,
  //               objectItem: true,
  //               place: true,
  //             },
  //           },
  //           player: true,
  //         },
  //       });
  //     }),
  //   );

  //   return assignments;
  // }

  async assignCharactersToPlayers(sessionCode: string) {
    // 1. Load session with its players
    const session = await this.prisma.gameSession.findUnique({
      where: { code: sessionCode },
      include: { players: true },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // 2. Pick all BaseEntity records matching the session's filters
    const characters = await this.prisma.baseEntity.findMany({
      where: {
        type: { in: session.characterTypes },
        level: session.difficulty,
        book: { in: session.books },
      },
      include: {
        person: true,
        entity: true,
        foodItem: true,
        objectItem: true,
        place: true,
      },
    });

    if (characters.length === 0) {
      throw new Error('No suitable characters found');
    }

    // 3. Shuffle the pool
    const shuffled = characters.sort(() => Math.random() - 0.5);

    // 4. Create one Assignment per player
    const assignments = await Promise.all(
      session.players.map((player, idx) => {
        const character = shuffled[idx % shuffled.length];
        return this.prisma.assignment.create({
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

  async getPlayersAssignments(sessionCode: string, currentPlayerId: string) {
    const session = await this.prisma.gameSession.findUnique({
      where: { code: sessionCode },
      include: {
        players: true,
        assignments: {
          include: { character: true, player: true },
        },
      },
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

    // Filter out the current player's round
    const otherPlayersRounds = rounds
      .map((round) => {
        if (round.playerId === currentPlayerId) {
          return {
            player: {
              id: round.player.id,
              name: round.player.name,
              avatarUrl: round.player.avatarUrl,
              telegramId: round.player.telegramId,
              sessionId: round.player.sessionId,
              isWinner: round.isWinner,
              tries: round.tries,
            },
            character: {
              id: round.character.id,
              book: round.character.book,
              type: round.character.type,
            },
          };
        }

        return {
          ...round,
        };
      })
      .sort((a, b) => {
        if (a.player.id === currentPlayerId) return -1;
        if (b.player.id === currentPlayerId) return 1;
        return 0;
      });

    // // Shuffle the remaining rounds
    // const shuffledRounds = [...otherPlayersRounds].sort(
    //   () => Math.random() - 0.5,
    // );

    return otherPlayersRounds;
  }

  async getCurrentAssignments(sessionCode: string) {
    const session = await this.prisma.gameSession.findUnique({
      where: { code: sessionCode },
      include: { players: true },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    const currentAssignments = session.players.map((player) => {
      const round = this.prisma.round.findFirst({
        where: { playerId: player.id, sessionId: session.id },
      });

      return round;
    });

    return currentAssignments;
  }

  async takeGuess(sessionCode: string, playerId: string, guess: string) {
    const session = await this.prisma.gameSession.findUnique({
      where: { code: sessionCode },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    const assignment = await this.prisma.assignment.findFirst({
      where: {
        playerId,
        sessionId: session.id,
      },
      include: {
        character: true,
      },
    });

    if (!assignment) {
      throw new Error(
        'No character assigned to you yet. Please wait for the game to start.',
      );
    }

    // Update the number of tries
    await this.prisma.assignment.update({
      where: { id: assignment.id },
      data: { tries: assignment.tries + 1 },
    });

    // Check if the guess is correct
    const isCorrect = isGuessCloseEnough(assignment.character.name, guess);

    // If guess is correct, mark player as winner
    if (isCorrect) {
      await this.prisma.assignment.update({
        where: { id: assignment.id },
        data: { isWinner: true },
      });
    }

    return {
      isCorrect,
      character: assignment.character,
      tries: assignment.tries + 1,
    };
  }

  // async generatePlayerAssignmentsForNewPlayer(
  // sessionCode: string,
  // playerId: string,
  // ) {
  // const session = await this.prisma.gameSession.findUnique({
  //   where: { code: sessionCode },
  //   include: { players: true },
  // });
  // if (!session) {
  //   throw new Error('Session not found');
  // }
  // const currentAssignments = await this.getCurrentAssignments(sessionCode);
  // const newPlayerAssignments = currentAssignments.filter(
  //   (assignment) => assignment.playerId !== playerId,
  // );
  // return newPlayerAssignments;
  // }
}
