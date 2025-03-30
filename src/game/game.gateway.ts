import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameService: GameService) {}

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-session')
  async handleJoinSession(client: Socket, sessionCode: string) {
    try {
      const session = await this.gameService.getSession(sessionCode);
      if (!session) {
        client.emit('error', { message: 'Session not found' });
        return;
      }

      // Get all players in the session
      const players = await this.gameService.getSessionPlayers(sessionCode);

      // Join the socket room
      client.join(sessionCode);

      // Emit session joined event with full session data
      client.emit('session-joined', {
        ...session,
        players,
      });

      // Notify other players in the session about the new player
      this.server.to(sessionCode).emit('player-joined', {
        id: client.id,
        name: 'Anonymous Player', // You might want to get the actual player name
        avatarUrl:
          'https://api.dicebear.com/7.x/avataaars/svg?seed=' + client.id,
        telegramId: parseInt(client.id.split('-')[0], 16),
      });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('leave-session')
  handleLeaveSession(client: Socket, sessionCode: string) {
    client.leave(sessionCode);
    this.server.to(sessionCode).emit('player-left', {
      id: client.id,
      sessionId: sessionCode,
    });
  }

  @SubscribeMessage('start-game')
  async handleStartGame(client: Socket, sessionCode: string) {
    try {
      const round = await this.gameService.startRound(sessionCode);
      this.server.to(sessionCode).emit('game-started', round);
    } catch (error) {
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
