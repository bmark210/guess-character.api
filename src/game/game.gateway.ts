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
    try {
      this.logger.log(`Client disconnected: ${client.id}`);

      // Get all rooms the client was in
      const rooms = Array.from(client.rooms);

      // For each room, notify other clients
      for (const room of rooms) {
        if (room === client.id) continue; // Skip the default room

        // Get player info before disconnecting
        const player = await this.gameService.getPlayerById(client.id);

        // Get updated room state
        const updatedSession = await this.gameService.getSession(room);

        // Notify all remaining players in the room
        this.server.to(room).emit('player_disconnected', {
          id: client.id,
          playerId: player?.id,
          name: player?.name,
          sessionCode: room,
          timestamp: new Date().toISOString(),
          reason: 'disconnected',
        });
        this.logger.log(
          `Player disconnected event broadcasted to room ${room}`,
        );

        // Update room state for all remaining players
        this.server.to(room).emit('room_updated', {
          session: updatedSession,
          message: 'Room state updated after player disconnected',
        });
        this.logger.log(`Room updated event broadcasted to room ${room}`);

        // Get remaining clients count
        const roomClients = this.server.sockets.adapter.rooms.get(room);
        const remainingClients = roomClients ? roomClients.size : 0;
        this.logger.log(
          `Remaining clients in room ${room}: ${remainingClients}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error handling disconnect: ${error.message}`);
    }
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

      await client.join(data.sessionCode);
      // const player = await this.gameService.getPlayerById(data.playerId);

      // this.server.to(data.sessionCode).emit('session_joined', {
      //   session,
      //   message: `${player.name} Successfully joined the session`,
      // });

      // const updatedSession = await this.gameService.getSession(
      //   data.sessionCode,
      // );
      this.server.to(data.sessionCode).emit('session_updated', {
        session: session,
        message: 'Session state has been updated',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Error joining session: ${error.message}`);
      client.emit('error', {
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('leave_session')
  async handleLeaveSession(
    client: Socket,
    data: { playerId: string; sessionCode: string },
  ) {
    try {
      this.logger.log(
        `Client ${client.id} leaving session ${data.sessionCode}`,
      );

      // Get player info before leaving
      const player = await this.gameService.getPlayerById(data.playerId);
      if (!player) {
        throw new Error('Player not found');
      }

      // Remove player from session in database
      await this.gameService.removePlayerFromSession(data.playerId);

      // Leave the socket room
      client.leave(data.sessionCode);

      // Get updated session with remaining players
      const updatedSession = await this.gameService.getSession(
        data.sessionCode,
      );

      // Notify all remaining players in the room
      this.server.to(data.sessionCode).emit('player_left', {
        id: client.id,
        playerId: player.id,
        name: player.name,
        sessionCode: data.sessionCode,
        timestamp: new Date().toISOString(),
      });
      this.logger.log(
        `Player left event broadcasted to room ${data.sessionCode}`,
      );

      // Update room state for all remaining players
      this.server.to(data.sessionCode).emit('room_updated', {
        session: updatedSession,
        message: 'Room state updated after player left',
      });
      this.logger.log(
        `Room updated event broadcasted to room ${data.sessionCode}`,
      );

      // Also emit session_updated to match client expectations
      this.server.to(data.sessionCode).emit('session_updated', {
        session: updatedSession,
        message: 'Session state has been updated',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Error handling leave session: ${error.message}`);
      client.emit('error', {
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Helper method to broadcast session updates to all connected users
  private async broadcastSessionUpdate(sessionCode: string, message: string) {
    try {
      // Get updated session data
      const updatedSession = await this.gameService.getSession(sessionCode);

      // Get all clients in the room
      const room = this.server.sockets.adapter.rooms.get(sessionCode);
      if (!room) {
        this.logger.warn(`No clients found in room ${sessionCode}`);
        return;
      }

      // Broadcast session update to all clients in the room
      this.server.to(sessionCode).emit('session_updated', {
        session: updatedSession,
        message,
        timestamp: new Date().toISOString(),
      });

      // Also broadcast room update
      this.server.to(sessionCode).emit('room_updated', {
        session: updatedSession,
        message: 'Room state has been updated',
      });

      this.logger.log(`Session update broadcasted to room ${sessionCode}`);
    } catch (error) {
      this.logger.error(`Error broadcasting session update: ${error.message}`);
    }
  }

  // Method to handle session updates
  @SubscribeMessage('update_session')
  async handleSessionUpdate(
    client: Socket,
    data: { sessionCode: string; update: any },
  ) {
    try {
      // Update the session in the database
      await this.gameService.updateSession(data.sessionCode, data.update);

      // Broadcast the update to all connected users
      await this.broadcastSessionUpdate(
        data.sessionCode,
        'Session has been updated',
      );

      // Emit success to the client that initiated the update
      client.emit('session_update_success', {
        message: 'Session updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Error updating session: ${error.message}`);
      client.emit('error', {
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('player_joined')
  async handlePlayerJoined(
    client: Socket,
    data: { sessionCode: string; playerId: string },
  ) {
    try {
      // Get player info
      const player = await this.gameService.getPlayerById(data.playerId);

      this.server.to(data.sessionCode).emit('player_has_joined', {
        id: player.id,
        name: player.name,
        avatarUrl: player.avatarUrl,
        telegramId: player.telegramId,
      });
    } catch (error) {
      this.logger.error(`Error handling player joined: ${error.message}`);
      client.emit('error', {
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
