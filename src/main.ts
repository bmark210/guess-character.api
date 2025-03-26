import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { BotService } from './bot/services/bot.service';
import fastifyCors from '@fastify/cors';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  try {
    const adapter = new FastifyAdapter({
      bodyLimit: 10485760, // Set body limit to 10MB (10 * 1024 * 1024 bytes)
    });
    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      adapter,
    );

    // Enable validation pipes
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    app.register(fastifyCors, {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    const botService = app.get(BotService);
    await botService.setupWebhook(adapter.getInstance());

    const port = Number(process.env.PORT || 3000);
    await app.listen(port, '0.0.0.0');
    console.log(`Server is running on http://localhost:${port}`);
  } catch (error) {
    console.error('Failed to start the application:', error);
    process.exit(1);
  }
}

bootstrap();
