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
    const rooms = Array.from(client.rooms);

    for (const roomId of rooms) {
      if (roomId === client.id) continue;

      // Attempt to find the player by socket ID or similar logic
      const player = await this.gameService.getPlayerById(client.id);

      // Let others know
      this.server.to(roomId).emit('player_disconnected', {
        playerId: player?.id,
        name: player?.name,
      });

      // Optionally do a session update:
      const session = await this.gameService.getSession(roomId);
      this.server.to(roomId).emit('session_updated', {
        session,
        message: 'Session updated after disconnect',
      });
    }
  }

  @SubscribeMessage('join_session')
  async handleJoinSession(
    client: Socket,
    data: { sessionCode: string; playerId: string },
  ) {
    try {
      // Attempt to join in DB
      const session = await this.gameService.joinSession(
        data.playerId,
        data.sessionCode,
      );

      // Join socket room
      await client.join(data.sessionCode);

      // Find full player info
      // const player = await this.gameService.getPlayerById(data.playerId);

      // Let the joining client know
      // client.emit('session_joined', {
      //   session,
      //   message: 'Successfully joined session',
      // });

      // Broadcast to others
      // this.server.to(data.sessionCode).emit('player_has_joined', {
      //   id: player.id,
      //   name: player.name,
      //   avatarUrl: player.avatarUrl,
      //   telegramId: player.telegramId,
      // });

      // Let all players see updated session
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

      const player = await this.gameService.getPlayerById(data.playerId);
      if (!player) {
        throw new Error('Player not found');
      }

      // Leave socket room
      client.leave(data.sessionCode);

      // Get updated session
      const updatedSession = await this.gameService.getSession(
        data.sessionCode,
      );

      // Notify others
      this.server.to(data.sessionCode).emit('player_left', {
        id: player.id,
        playerId: data.playerId,
        name: player.name,
        sessionCode: data.sessionCode,
        timestamp: new Date().toISOString(),
      });

      // Send updated session to all players
      this.server.to(data.sessionCode).emit('session_updated', {
        session: updatedSession,
        message: 'Session updated after player left',
      });
    } catch (err) {
      this.logger.error(`Error leaving session: ${err.message}`);
      client.emit('error', { message: err.message });
    }
  }
}
