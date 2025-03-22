import { Injectable } from '@nestjs/common';
import { Telegraf, Markup } from 'telegraf';
import { FastifyInstance } from 'fastify';

@Injectable()
export class BotService {
  private readonly bot: Telegraf;

  constructor() {
    const token = process.env.BOT_TOKEN;
    if (!token) throw new Error('BOT_TOKEN is missing!');
    this.bot = new Telegraf(token);

    this.bot.start((ctx) => {
      const username = ctx.from?.first_name || 'User';
      ctx.reply(
        `Привет, ${username}! 👋\n\nНажми кнопку ниже, чтобы начать игру!`,
        Markup.inlineKeyboard([
          Markup.button.webApp(
            'Начать игру',
            'https://guess-bible-character.vercel.app',
          ),
        ]),
      );
    });
  }

  async setupWebhook(server: FastifyInstance) {
    const token = process.env.BOT_TOKEN;
    const domain = process.env.BOT_WEBHOOK_DOMAIN;
    const path = `/bot${token}`;
    const fullUrl = `${domain}${path}`;

    await this.bot.telegram.setWebhook(fullUrl);

    server.post(path, async (request, reply) => {
      await this.bot.handleUpdate(request.body as any, reply.raw);
      reply.send();
    });

    console.log(`🚀 Webhook registered at ${fullUrl}`);
  }
}
