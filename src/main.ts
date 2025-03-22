// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BotService } from './bot/services/bot.service';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // отключаем встроенный парсер
  });

  // до app.listen
  app.use(bodyParser.json({ limit: '5mb' })); // 💡 можно до 10mb, если надо
  app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));

  app.enableCors();

  const botService = app.get(BotService);
  await botService.setupWebhook();

  await app.listen(Number(process.env.PORT || 3000));
}
bootstrap();
