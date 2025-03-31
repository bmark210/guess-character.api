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
        this.server.to(room).emit('player-disconnected', {
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
        this.server.to(room).emit('room-updated', {
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

  @SubscribeMessage('join-session')
  async handleJoinSession(
    client: Socket,
    data: { sessionCode: string; playerId: string },
  ) {
    try {
      this.logger.log(
        `Join session request from client ${client.id}: ${JSON.stringify(data.playerId + ' + ' + data.sessionCode)}`,
      );

      // Join the session
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
      this.logger.log(`Client ${client.id} joined room ${data.sessionCode}`);

      // Get all clients in the room
      const room = this.server.sockets.adapter.rooms.get(data.sessionCode);
      const clientsInRoom = room ? room.size : 0;
      this.logger.log(
        `Number of clients in room ${data.sessionCode}: ${clientsInRoom}`,
      );

      // Emit to the client that joined
      client.emit('session-joined', {
        session,
        message: 'Successfully joined the session',
      });
      this.logger.log(`Session joined event emitted to client ${client.id}`);

      // Emit to all other clients in the room with full player data
      const playerData = {
        id: player.id,
        name: player.name,
        avatarUrl: player.avatarUrl,
        telegramId: player.telegramId,
        joinedAt: new Date().toISOString(),
      };

      // Broadcast to all clients in the room except the sender
      client.to(data.sessionCode).emit('player-joined', playerData);
      this.logger.log(
        `Player joined event broadcasted to room ${data.sessionCode}: ${JSON.stringify(playerData)}`,
      );

      // Also emit a room update event to all clients
      const updatedSession = await this.gameService.getSession(
        data.sessionCode,
      );
      // Notify all users in the room about the session update
      this.server.to(data.sessionCode).emit('session-updated', {
        session: updatedSession,
        message: 'Session state has been updated',
        timestamp: new Date().toISOString(),
      });
      this.logger.log(
        `Session updated event broadcasted to room ${data.sessionCode}`,
      );
      this.server.to(data.sessionCode).emit('room-updated', {
        session: updatedSession,
        message: 'Room state updated',
      });
      this.logger.log(
        `Room updated event broadcasted to room ${data.sessionCode}`,
      );
    } catch (error) {
      this.logger.error(`Error joining session: ${error.message}`);
      client.emit('error', {
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('leave-session')
  async handleLeaveSession(client: Socket, sessionCode: string) {
    try {
      this.logger.log(`Client ${client.id} leaving session ${sessionCode}`);

      // Get player info before leaving
      const player = await this.gameService.getPlayerById(client.id);

      // Leave the socket room
      client.leave(sessionCode);
      this.logger.log(`Client ${client.id} left room ${sessionCode}`);

      // Get updated room state
      const updatedSession = await this.gameService.getSession(sessionCode);

      // Notify all remaining players in the room
      this.server.to(sessionCode).emit('player-left', {
        id: client.id,
        playerId: player?.id,
        name: player?.name,
        sessionCode,
        timestamp: new Date().toISOString(),
      });
      this.logger.log(`Player left event broadcasted to room ${sessionCode}`);

      // Update room state for all remaining players
      this.server.to(sessionCode).emit('room-updated', {
        session: updatedSession,
        message: 'Room state updated after player left',
      });
      this.logger.log(`Room updated event broadcasted to room ${sessionCode}`);

      // Get remaining clients count
      const room = this.server.sockets.adapter.rooms.get(sessionCode);
      const remainingClients = room ? room.size : 0;
      this.logger.log(
        `Remaining clients in room ${sessionCode}: ${remainingClients}`,
      );
    } catch (error) {
      this.logger.error(`Error handling leave session: ${error.message}`);
      client.emit('error', {
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
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
