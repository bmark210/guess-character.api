import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { BotService } from './bot/bot.service';
import * as express from 'express';
import * as cors from 'cors';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  try {
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.use(express.json());
    expressApp.use(cors());

    const botService = app.get(BotService);
    await botService.setupWebhook(expressApp);

    const port = process.env.PORT || 3000;
    await app.listen(port);
    logger.log(`🚀 Server running on http://localhost:${port}`);
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}
bootstrap();
