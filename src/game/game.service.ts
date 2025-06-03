import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GameConfig } from 'src/dts/game-config.dto';
import { isGuessCloseEnough } from 'src/utils/is-guess-close';
import { CharacterType, HintLevel } from '@prisma/client';
import { calculatePlusRating } from 'src/utils/calcPlusReiting';
import { AwardsService } from 'src/awards/awards.service';
import { GameGateway } from './game.gateway';
import shuffle from 'lodash'; // Добавьте в начало файла, если используете lodash

@Injectable()
export class GameService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly awardsService: AwardsService,
    @Inject(forwardRef(() => GameGateway))
    private readonly gameGateway: GameGateway,
  ) {}

  private async generateCode(): Promise<string> {
    let code: string;
    let isUnique = false;

    while (!isUnique) {
      code = Math.floor(Math.random() * 9000 + 1000).toString();
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
    if (session.status === 'WAITING_FOR_PLAYERS') {
      await this.prisma.gameSession.update({
        where: { id: session.id },
        data: {
          players: { connect: { id: playerId } },
        },
      });
    }

    // 🔁 получаем обновлённую сессию с игроками
    // return await this.prisma.gameSession.findUnique({
    //   where: { code: sessionCode },
    //   include: {
    //     players: true,
    //     // assignments: { include: { character: true, player: true } },
    //   },
    // });

    return this.getSession(sessionCode);
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

    return this.prisma.assignment.findFirst({
      where: { sessionId },
    });
  }

  async createPlayer(name: string, avatarUrl: string, telegramId: string) {
    const player = await this.prisma.player.create({
      data: { name, avatarUrl, telegramId },
    });

    return player;
  }

  async getPlayerByTelegramId(telegramId: string) {
    if (!telegramId) throw new Error('Telegram ID is required');

    return this.prisma.player.findUnique({
      where: { telegramId: telegramId },
      include: {
        award: true,
      },
    });
  }

  async getPlayerById(playerId: string) {
    if (!playerId) throw new Error('Player ID is required');

    return this.prisma.player.findUnique({
      where: { id: playerId },
    });
  }

  async getSession(sessionCode: string) {
    if (!sessionCode) {
      throw new Error('Session code is required');
    }
    return this.prisma.gameSession.findUnique({
      where: { code: sessionCode },
      include: {
        players: true,
        assignments: {
          include: {
            player: { include: { award: true } },
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

  // async startSession(sessionCode: string) {
  //   try {
  //     const session = await this.getSession(sessionCode);
  //     if (!session) {
  //       throw new Error('Session not found');
  //     }

  //     await this.assignCharactersToPlayers(sessionCode);
  //     await this.updateGameStatus(sessionCode, 'IN_PROGRESS');
  //     await this.gameGateway.sendUpdatedSession(sessionCode);

  //     // return session;
  //   } catch (error) {
  //     console.error('Error starting session:', error);
  //     throw error;
  //   }
  // }

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

  async assignCharactersToPlayers(sessionCode: string) {
    // 1. Загрузить сессию с игроками
    const session = await this.prisma.gameSession.findUnique({
      where: { code: sessionCode },
      include: { players: true },
    });

    if (!session) throw new Error('Session not found');
    if (!session.players.length) throw new Error('No players in session');

    // 2. Получить подходящих персонажей
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

    if (characters.length < session.players.length) {
      throw new Error('Not enough characters for all players');
    }

    // 3. Перемешать персонажей
    const shuffled =
      typeof shuffle === 'function'
        ? shuffle(characters)
        : characters.sort(() => Math.random() - 0.5);

    // 4. Удалить старые назначения (если есть)
    await this.prisma.assignment.deleteMany({
      where: { sessionId: session.id },
    });

    // 5. Создать назначения для игроков (атомарно)
    await this.prisma.$transaction(
      session.players.map((player, idx) =>
        this.prisma.assignment.create({
          data: {
            sessionId: session.id,
            playerId: player.id,
            characterId: shuffled[idx].id,
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
        }),
      ),
    );
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

    // Get all assignments with their characters and players
    const assignments = await this.prisma.assignment.findMany({
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

    // Filter out the current player's assignment
    const otherPlayersAssignments = assignments
      .map((assignment) => {
        if (assignment.playerId === currentPlayerId) {
          return {
            player: {
              id: assignment.player.id,
              name: assignment.player.name,
              avatarUrl: assignment.player.avatarUrl,
              telegramId: assignment.player.telegramId,
              sessionId: assignment.player.sessionId,
              isWinner: assignment.isWinner,
              guess_tries: assignment.guess_tries,
            },
            character: {
              id: assignment.character.id,
              book: assignment.character.book,
              type: assignment.character.type,
            },
          };
        }

        return {
          ...assignment,
        };
      })
      .sort((a, b) => {
        if (a.player.id === currentPlayerId) return -1;
        if (b.player.id === currentPlayerId) return 1;
        return 0;
      });

    return otherPlayersAssignments;
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
      const assignment = this.prisma.assignment.findFirst({
        where: { playerId: player.id, sessionId: session.id },
      });

      return assignment;
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
      data: { guess_tries: assignment.guess_tries + 1 },
    });

    // Check if the guess is correct
    const isCorrect = isGuessCloseEnough(assignment.character.name, guess);

    // If guess is correct, mark player as winner and update rating
    if (isCorrect) {
      const currentPlayer = await this.prisma.player.findUnique({
        where: { id: playerId },
      });

      const ratingIncrease = calculatePlusRating(
        session.difficulty,
        assignment.hints as unknown as HintLevel[],
      );

      const award = await this.awardsService
        .getAwardByRating(currentPlayer.rating + ratingIncrease)
        .catch(() => null);

      await this.prisma.$transaction([
        this.prisma.assignment.update({
          where: { id: assignment.id },
          data: { isWinner: true },
        }),
        this.prisma.player.update({
          where: { id: playerId },
          data: {
            rating: currentPlayer.rating + ratingIncrease,
            awardId: award?.id,
          },
        }),
      ]);
    }

    const updatedSession = await this.getSession(sessionCode);
    this.gameGateway.server.to(sessionCode).emit('session_updated', {
      session: updatedSession,
    });

    return updatedSession;
  }

  async getHints(
    characterId: string,
    hintLevel: HintLevel,
    assignmentId: string,
  ) {
    // 1) fetch and guard
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) {
      throw new Error('Assignment not found');
    }
    if (assignment.characterId !== characterId) {
      throw new Error('Assignment does not match character');
    }

    // 2) load the character
    const character = await this.prisma.baseEntity.findUnique({
      where: { id: characterId },
      include: {
        person: true,
        entity: true,
        foodItem: true,
        objectItem: true,
        place: true,
      },
    });
    if (!character) {
      throw new Error('Character not found');
    }

    // 3) if this hint is new, persist it once
    if (!assignment.hints.includes(hintLevel)) {
      await this.prisma.assignment.update({
        where: { id: assignmentId },
        data: { hints: { push: hintLevel } },
      });
    }

    // 4) switch on level
    switch (hintLevel) {
      case HintLevel.ONE:
        // front-end expects { book, chapter, verse }
        return {
          book: character.book,
          chapter: character.chapter,
          verse: character.verse,
        };

      case HintLevel.TWO: {
        // front-end's Description interface is
        // { type: string; status: string; trait: string[]; material?: string; usage?: string }
        const base = {
          type: character.type,
          status: '',
          trait: [] as string[],
        };

        if (character.type === CharacterType.PERSON) {
          return {
            ...base,
            status: character.person.status,
            trait: character.person.traits,
          };
        }
        if (character.type === CharacterType.OBJECT) {
          return {
            ...base,
            material: character.objectItem.material,
            usage: character.objectItem.usage,
          };
        }
        if (character.type === CharacterType.FOOD) {
          return {
            ...base,
            // no `trait` or `status` on food, so leave them empty
            // but you could also push e.g. trait: [character.foodItem.foodType]
          };
        }
        if (character.type === CharacterType.ENTITY) {
          return {
            ...base,
            // again, defaulting material/usage off
            // optionally you could expose entity.entityType here
          };
        }
        if (character.type === CharacterType.PLACE) {
          return {
            ...base,
            // same as above
          };
        }

        // fallback
        return base;
      }

      case HintLevel.THREE:
        // front-end expects a Character-like object (with name, description, etc.)
        if (!character.relatedCharacterId) {
          return {};
        }
        return (
          (await this.prisma.baseEntity.findUnique({
            where: { id: character.relatedCharacterId },
          })) || {}
        );

      case HintLevel.FOUR:
        // front-end expects a plain string
        return { description: character.description };

      default:
        throw new Error(`Unknown hint level: ${hintLevel}`);
    }
  }

  async hasRelatedCharacter(characterId: string) {
    const character = await this.prisma.baseEntity
      .findUnique({
        where: { id: characterId },
      })
      .catch(() => null);
    return character?.relatedCharacterId !== null;
  }

  async getUserAssegnment(sessionCode: string, playerId: string) {
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
        player: {
          include: {
            award: true,
          },
        },
      },
    });

    return assignment;
  }

  async createNewAssignment(sessionCode: string, playerId: string) {
    // 1. Получить сессию
    const session = await this.prisma.gameSession.findUnique({
      where: { code: sessionCode },
      include: {
        players: true,
        assignments: {
          include: {
            character: true,
          },
        },
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // 2. Получить все уже назначенные персонажи в сессии
    const usedCharacterIds = session.assignments.map(
      (assignment) => assignment.characterId,
    );

    // 3. Найти доступных персонажей (исключая уже используемых)
    const availableCharacters = await this.prisma.baseEntity.findMany({
      where: {
        type: { in: session.characterTypes },
        level: session.difficulty,
        book: { in: session.books },
        id: { notIn: usedCharacterIds },
      },
      include: {
        person: true,
        entity: true,
        foodItem: true,
        objectItem: true,
        place: true,
      },
    });

    if (availableCharacters.length === 0) {
      throw new Error('No available characters for assignment');
    }

    // 4. Перемешать персонажей (как в assignCharactersToPlayers)
    const shuffled = availableCharacters.sort(() => Math.random() - 0.5);

    // 5. Выбрать первого персонажа из перемешанного списка
    const selectedCharacter = shuffled[0];

    // 6. Удалить старое назначение игрока (если есть)
    await this.prisma.assignment.deleteMany({
      where: {
        playerId,
        sessionId: session.id,
      },
    });

    // 7. Создать новое назначение
    const newAssignment = await this.prisma.assignment.create({
      data: {
        sessionId: session.id,
        playerId,
        characterId: selectedCharacter.id,
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
        player: {
          include: {
            award: true,
          },
        },
      },
    });
    console.log('newAssignment', newAssignment);
  }

  async removeWinnerStatus(sessionCode: string, playerId: string) {
    console.log('sessionCode', sessionCode);
    console.log('playerId', playerId);

    await this.prisma.gameSession.update({
      where: { code: sessionCode },
      data: {
        assignments: {
          updateMany: {
            where: { playerId, isWinner: true },
            data: { isWinner: false },
          },
        },
      },
    });
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
