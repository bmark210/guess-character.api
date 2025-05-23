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

  @SubscribeMessage('join_session')
  async handleJoinSession(
    client: Socket,
    data: { sessionCode: string; playerId: string },
  ) {
    try {
      // await this.gameService.joinSession(data.playerId, data.sessionCode);

      client.data.sessionCode = data.sessionCode;
      client.data.playerId = data.playerId;

      await client.join(data.sessionCode);

      const fullSession = await this.gameService.getSession(data.sessionCode);

      if (fullSession.status === 'IN_PROGRESS') {
        const sockets = await this.server.in(data.sessionCode).fetchSockets();

        // todo: this is a hack to get the assignments to the new player
        for (const player of fullSession.players) {
          const session = await this.gameService.getSession(
            data.sessionCode,
            player.id,
          );

          // Find the socket for this player
          const playerSocket = sockets.find(
            (socket) => socket.data.playerId === player.id,
          );
          if (playerSocket) {
            playerSocket?.emit('session_updated', {
              session,
            });
          } else {
            this.logger.warn(`Socket not found for player ${player.id}`);
          }
        }
      }

      if (fullSession.status === 'WAITING_FOR_PLAYERS') {
        this.server.to(data.sessionCode).emit('session_updated', {
          session: fullSession,
          message: 'Waiting for players',
        });
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
  async handleStartGame(client: Socket, data: { sessionCode: string }) {
    try {
      const session = await this.gameService.getSession(data.sessionCode);
      if (!session) {
        throw new Error('Session not found');
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
      // const sockets = await this.server.in(data.sessionCode).fetchSockets();

      // Send assignments to each player in the session
      // for (const assignment of session.assignments) {
      // const assignments = await this.gameService.getPlayersAssignments(
      //   data.sessionCode,
      //   assignment.playerId,
      // );

      // // Find the socket for this player
      // const playerSocket = sockets.find(
      //   (socket) => socket.data.playerId === assignment.playerId,
      // );

      //   if (playerSocket) {
      //     playerSocket.emit('character_assignments', {
      //       session,
      //     });
      //   } else {
      //     this.logger.warn(`Socket not found for player`);
      //   }
      // }

      // Notify all players in the session
      this.server.to(data.sessionCode).emit('session_updated', {
        session: updatedSession,
        message: 'Game started',
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
      //   const sessionCode = client.data.sessionCode;
      //   const playerId = client.data.playerId;
      //   if (!sessionCode || !playerId) return;
      //   await this.gameService.removePlayerFromSession(playerId);
      //   const session = await this.gameService.getSession(sessionCode);
      //   this.server.to(sessionCode).emit('session_updated', {
      //     session,
      //     message: `Player ${playerId} disconnected`,
      //   });
    } catch (err) {
      //   this.logger.error(`Error leaving session: ${err.message}`);
      //   client.emit('error', { message: err.message });
    }
  }
}
