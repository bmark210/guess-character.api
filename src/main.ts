// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BotService } from './bot/services/bot.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const botService = app.get(BotService);
  await botService.setupWebhook(app);

  await app.listen(3000);
}
bootstrap();
