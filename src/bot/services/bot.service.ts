// bot.service.ts
import { Injectable, INestApplication } from '@nestjs/common';
import { Telegraf } from 'telegraf';

@Injectable()
export class BotService {
  private bot: Telegraf;

  constructor() {
    const token = process.env.BOT_TOKEN;
    if (!token) throw new Error('BOT_TOKEN is missing!');
    this.bot = new Telegraf(token);

    this.bot.start((ctx) => {
      ctx.reply('Привет от NestJS бота!');
    });
  }

  async setupWebhook(app: INestApplication) {
    const token = process.env.BOT_TOKEN;
    const domain = process.env.BOT_WEBHOOK_DOMAIN;
    const path = `/bot/${token}`;
    const fullUrl = `${domain}${path}`;

    await this.bot.telegram.setWebhook(fullUrl); // 👈 Telegram узнаёт, куда слать запросы
    app.use(path, this.bot.webhookCallback(path)); // 👈 NestJS принимает запросы
    console.log(`✅ Webhook установлен: ${fullUrl}`);
  }
}
