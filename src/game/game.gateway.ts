import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { Logger } from '@nestjs/common';

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

  constructor(private readonly gameService: GameService) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-session')
  async handleJoinSession(
    client: Socket,
    data: { sessionCode: string; playerId: string },
  ) {
    try {
      this.logger.log(`Join session request: ${JSON.stringify(data)}`);
      const session = await this.gameService.joinSession(
        data.playerId,
        data.sessionCode,
      );

      // Get player info
      const player = await this.gameService.getPlayerById(data.playerId);
      if (!player) {
        throw new Error('Player not found');
      }

      // Join the socket room
      await client.join(data.sessionCode);

      // Emit to the client that joined
      client.emit('session-joined', { session });
      this.logger.log(`Session joined emitted to client ${client.id}`);

      // Emit to all other clients in the room with full player data
      client.to(data.sessionCode).emit('player-joined', {
        id: player.id,
        name: player.name,
        avatarUrl: player.avatarUrl,
        telegramId: player.telegramId,
      });
      this.logger.log(`Player joined emitted to room ${data.sessionCode}`);
    } catch (error) {
      this.logger.error(`Error joining session: ${error.message}`);
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('leave-session')
  handleLeaveSession(client: Socket, sessionCode: string) {
    this.logger.log(`Client ${client.id} leaving session ${sessionCode}`);
    client.leave(sessionCode);
    this.server.to(sessionCode).emit('player-left', {
      id: client.id,
      sessionCode,
    });
  }

  @SubscribeMessage('start-game')
  async handleStartGame(client: Socket, sessionCode: string) {
    try {
      this.logger.log(`Starting game for session: ${sessionCode}`);
      const round = await this.gameService.startRound(sessionCode);
      this.server.to(sessionCode).emit('game-started', round);
    } catch (error) {
      this.logger.error(`Error starting game: ${error.message}`);
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('end-round')
  async handleEndRound(client: Socket, sessionCode: string) {
    try {
      const round = await this.gameService.endRound(sessionCode);
      this.server.to(sessionCode).emit('round-ended', round);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }
}
