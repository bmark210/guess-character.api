import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { BotService } from './bot/services/bot.service';
import fastifyCors from '@fastify/cors';

async function bootstrap() {
  const adapter = new FastifyAdapter({
    bodyLimit: 10485760, // Set body limit to 10MB (10 * 1024 * 1024 bytes)
  });
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
  );

  app.register(fastifyCors, {
    origin: '*',
  });

  const botService = app.get(BotService);
  await botService.setupWebhook(adapter.getInstance());

  await app.listen(Number(process.env.PORT || 3000), '0.0.0.0');
  console.log(
    `Server is running on http://localhost:${process.env.PORT || 3000}`,
  );
}

bootstrap();
