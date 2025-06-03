import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { Logger, Inject, forwardRef } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('GameGateway');

  constructor(
    @Inject(forwardRef(() => GameService))
    private readonly gameService: GameService,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    const sessionCode = client.data.sessionCode;
    const playerId = client.data.playerId;

    if (!sessionCode || !playerId) return;

    // Optionally update your session in DB (e.g., remove the player)
    // await this.gameService.removePlayerFromSession(playerId);

    // const session = await this.gameService.getSession(sessionCode, playerId);

    // this.server.to(sessionCode).emit('session_updated', {
    //   session,
    //   message: `Player ${playerId} disconnected`,
    // });
  }

  async startGameSession(sessionCode: string) {
    try {
      this.logger.log(`Starting game session: ${sessionCode}`);
      const session = await this.gameService.getSession(sessionCode);
      if (!session) {
        throw new Error('Session not found');
      }
      if (session.status !== 'WAITING_FOR_PLAYERS') {
        throw new Error('Session is not in a state to start the game');
      }
      // Update game status to IN_PROGRESS
      await this.gameService.updateGameStatus(sessionCode, 'IN_PROGRESS');
      // Assign characters to all players
      await this.gameService.assignCharactersToPlayers(sessionCode);
      // Notify all players in the session
      const updatedSession = await this.gameService.getSession(sessionCode);
      this.server.to(sessionCode).emit('session_updated', {
        session: updatedSession,
        message: 'Игра началась',
      });
    } catch (err) {
      this.logger.error(`Error starting game session: ${err.message}`);
      this.server.to(sessionCode).emit('error', {
        message: err.message,
      });
    }
  }

  @SubscribeMessage('join_session')
  async handleJoinSession(
    client: Socket,
    data: { sessionCode: string; playerId: string },
  ) {
    try {
      client.data.sessionCode = data.sessionCode;
      client.data.playerId = data.playerId;

      await client.join(data.sessionCode);

      let fullSession = await this.gameService.getSession(data.sessionCode);

      if (fullSession.status === 'WAITING_FOR_PLAYERS') {
        await this.gameService.joinSession(data.playerId, data.sessionCode);
        fullSession = await this.gameService.getSession(data.sessionCode);
      }

      const sockets = await this.server.in(data.sessionCode).fetchSockets();

      for (const player of fullSession.players) {
        const session = await this.gameService.getSession(data.sessionCode);
        const playerSocket = sockets.find(
          (socket) => socket.data.playerId === player.id,
        );
        if (playerSocket) {
          playerSocket.emit('session_updated', { session });
        } else {
          this.logger.warn(`Socket not found for player ${player.id}`);
        }
      }
    } catch (err) {
      this.logger.error(`Error joining session: ${err.message}`);
      client.emit('error', { message: err.message });
    }
  }

  @SubscribeMessage('update_game')
  async handleUpdateGame(data: { sessionCode: string }) {
    const session = await this.gameService.getSession(data.sessionCode);
    this.server.to(data.sessionCode).emit('session_updated', {
      session,
    });
  }

  @SubscribeMessage('start_game')
  async handleStartGame(
    client: Socket,
    data: { sessionCode: string; playerId: string },
  ) {
    try {
      const session = await this.gameService.getSession(data.sessionCode);
      if (!session) {
        throw new Error('Session not found');
      }

      // Проверяем, является ли игрок создателем игры
      if (session.creatorId !== data.playerId) {
        throw new Error('Only the game creator can start the game');
      }

      // Update game status to IN_PROGRESS
      await this.gameService.updateGameStatus(data.sessionCode, 'IN_PROGRESS');

      // Assign characters to all players
      await this.gameService.assignCharactersToPlayers(data.sessionCode);

      // Get updated session
      const updatedSession = await this.gameService.getSession(
        data.sessionCode,
      );

      // Get all sockets in the session room
      const sockets = await this.server.in(data.sessionCode).fetchSockets();

      // Send assignments to each player in the session
      for (const player of updatedSession.players) {
        const assignments = await this.gameService.getPlayersAssignments(
          data.sessionCode,
          player.id,
        );

        // Find the socket for this player
        const playerSocket = sockets.find(
          (socket) => socket.data.playerId === player.id,
        );

        if (playerSocket) {
          playerSocket.emit('character_assignments', {
            assignments,
            session: updatedSession,
          });
        } else {
          this.logger.warn(`Socket not found for player ${player.id}`);
        }
      }

      // Notify all players in the session
      this.server.to(data.sessionCode).emit('session_updated', {
        session: updatedSession,
        message: 'Игра началась',
      });
    } catch (err) {
      this.logger.error(`Error starting game: ${err.message}`);
      client.emit('error', { message: err.message });
    }
  }

  @SubscribeMessage('leave_session')
  async handleLeaveSession(
    client: Socket,
    data: { sessionCode: string; playerId: string },
  ) {
    try {
      this.logger.log(
        `Client ${client.id} leaving session ${data.sessionCode}`,
      );

      // Проверяем, существует ли сессия
      const session = await this.gameService.getSession(data.sessionCode);
      if (!session) {
        throw new Error('Session not found');
      }

      // Проверяем, есть ли игрок в сессии
      const playerInSession = session.players.some(
        (player) => player.id == data.playerId,
      );
      console.log('playerInSession:', playerInSession);
      if (!playerInSession) {
        throw new Error('Player not found in session');
      }

      // Удаляем игрока из сессии
      await this.gameService.removePlayerFromSession(data.playerId);

      // Покидаем комнату socket.io
      await client.leave(data.sessionCode);

      // Получаем обновлённую сессию
      const updatedSession = await this.gameService.getSession(
        data.sessionCode,
      );

      // Оповещаем всех клиентов в комнате
      this.server.to(data.sessionCode).emit('session_updated', {
        session: updatedSession,
        message: `Player ${data.playerId} left the session`,
      });
    } catch (err) {
      this.logger.error(`Error leaving session: ${err.message}`);
      client.emit('error', { message: err.message });
    }
  }

  async sendUpdatedSession(sessionCode: string) {
    try {
      const session = await this.gameService.getSession(sessionCode);
      this.server.to(sessionCode).emit('session_updated', { session });
    } catch (err) {
      this.logger.error(`Error fetching session: ${err.message}`);
      this.server.to(sessionCode).emit('error', { message: err.message });
    }
  }

  @SubscribeMessage('get_new_character')
  async handleGetNewCharacter(
    client: Socket,
    { playerId, sessionCode }: { playerId: string; sessionCode: string },
  ) {
    try {
      console.log('sessionCode', sessionCode);
      console.log('playerId', playerId);

      // Убеждаемся, что клиент присоединен к комнате
      if (!client.data.sessionCode || client.data.sessionCode !== sessionCode) {
        await client.join(sessionCode);
        client.data.sessionCode = sessionCode;
        client.data.playerId = playerId;
      }

      await this.gameService.removeWinnerStatus(sessionCode, playerId);
      const updatedSession = await this.gameService.createNewAssignment(
        sessionCode,
        playerId,
      );

      if (!updatedSession) {
        throw new Error('Failed to create new assignment - session is null');
      }

      // Добавляем логирование для отладки
      this.logger.log(
        `About to emit session_updated to sessionCode: ${sessionCode}`,
      );
      this.logger.log(
        `UpdatedSession is: ${updatedSession ? 'not null' : 'null'}`,
      );

      // // Получаем все сокеты в комнате сессии
      // const sockets = await this.server.in(sessionCode).fetchSockets();
      // this.logger.log(`Found ${sockets.length} sockets in room ${sessionCode}`);

      // // Отправляем обновление каждому игроку в сессии
      // for (const player of updatedSession.players) {
      //   const playerSocket = sockets.find(
      //     (socket) => socket.data.playerId === player.id,
      //   );
      //   if (playerSocket) {
      //     playerSocket.emit('session_updated', {
      //       session: updatedSession,
      //       message: 'Новый персонаж получен',
      //     });
      //   } else {
      //     this.logger.warn(`Socket not found for player ${player.id}`);
      //   }
      // }

      // Также отправляем общее сообщение в комнату
      this.server.to(sessionCode).emit('session_updated', {
        session: updatedSession,
        message: 'Новый персонаж получен',
      });

      this.logger.log(`Successfully emitted session_updated to ${sessionCode}`);
    } catch (err) {
      this.logger.error(`Error getting new character: ${err.message}`);
      client.emit('error', { message: err.message });
    }
  }
}
