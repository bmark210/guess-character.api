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

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    const sessionCode = client.data.sessionCode;
    const playerId = client.data.playerId;

    if (!sessionCode || !playerId) return;

    // Optionally update your session in DB (e.g., remove the player)
    await this.gameService.removePlayerFromSession(playerId);

    const session = await this.gameService.getSession(sessionCode);

    this.server.to(sessionCode).emit('session_updated', {
      session,
      message: `Player ${playerId} disconnected`,
    });
  }

  @SubscribeMessage('join_session')
  async handleJoinSession(
    client: Socket,
    data: { sessionCode: string; playerId: string },
  ) {
    try {
      const session = await this.gameService.joinSession(
        data.playerId,
        data.sessionCode,
      );

      client.data.sessionCode = data.sessionCode;
      client.data.playerId = data.playerId;

      await client.join(data.sessionCode);

      this.server.to(data.sessionCode).emit('session_updated', {
        session,
        message: 'Session state updated',
      });
    } catch (err) {
      this.logger.error(`Error joining session: ${err.message}`);
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

      const sessionCode = client.data.sessionCode;
      const playerId = client.data.playerId;

      if (!sessionCode || !playerId) return;

      await this.gameService.removePlayerFromSession(playerId);

      const session = await this.gameService.getSession(sessionCode);

      this.server.to(sessionCode).emit('session_updated', {
        session,
        message: `Player ${playerId} disconnected`,
      });
    } catch (err) {
      this.logger.error(`Error leaving session: ${err.message}`);
      client.emit('error', { message: err.message });
    }
  }
}
