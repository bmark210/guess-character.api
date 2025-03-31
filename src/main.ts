import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { BotService } from './bot/bot.service';
import * as express from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  try {
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.use(express.json());

    // Configure CORS with specific options
    app.enableCors({
      origin: true, // Allow all origins
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      allowedHeaders: 'Content-Type, Accept, Authorization',
    });

    // Swagger configuration
    const config = new DocumentBuilder()
      .setTitle('Guess Character API')
      .setDescription('API for the Guess Character game')
      .setVersion('1.0')
      .addServer('http://localhost:3000', 'Local development server')
      .addServer('ws://localhost:3000', 'WebSocket server')
      .addTag('Game', 'Game management endpoints')
      .addTag('Characters', 'Character management endpoints')
      .addTag('WebSocket', 'Real-time game events')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    // Add WebSocket documentation
    document.components = document.components || {};
    document.components.schemas = document.components.schemas || {};
    document.components.schemas['WebSocketEvent'] = {
      type: 'object',
      properties: {
        event: {
          type: 'string',
          enum: [
            'join_game',
            'leave_game',
            'start_round',
            'end_round',
            'make_guess',
            'round_result',
          ],
        },
        data: {
          type: 'object',
          description: 'Event-specific data',
        },
      },
    };

    // Save Swagger JSON file
    const outputPath = path.resolve(process.cwd(), 'swagger.json');
    fs.writeFileSync(outputPath, JSON.stringify(document, null, 2), {
      encoding: 'utf8',
    });
    logger.log(`📝 Swagger JSON saved to ${outputPath}`);

    // Setup Swagger UI with custom options
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        filter: true,
        displayRequestDuration: true,
        docExpansion: 'none',
        defaultModelsExpandDepth: -1,
        defaultModelExpandDepth: 1,
      },
      customSiteTitle: 'Guess Character API Documentation',
      customCss: '.swagger-ui .topbar { display: none }',
      customJs: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      ],
      customCssUrl: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
      ],
    });

    // Add endpoint to serve Swagger JSON with proper headers
    expressApp.get('/api-json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.json(document);
    });

    const botService = app.get(BotService);
    await botService.setupWebhook(expressApp);

    const port = process.env.PORT || 3000;
    await app.listen(port);
    logger.log(`🚀 Server running on http://localhost:${port}`);
    logger.log(
      `📚 Swagger documentation available at http://localhost:${port}/api`,
    );
    logger.log(
      `📝 Swagger JSON available at http://localhost:${port}/api-json`,
    );
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}
bootstrap();
