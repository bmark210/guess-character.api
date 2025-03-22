import { Injectable } from '@nestjs/common';
import { Telegraf, Markup } from 'telegraf';
import Fastify from 'fastify';

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

  async setupWebhook() {
    const fastify = Fastify();

    const webhookPath = `/bot${process.env.BOT_TOKEN}`;
    const webhookUrl = `${process.env.BOT_WEBHOOK_DOMAIN}${webhookPath}`;

    await this.bot.telegram.setWebhook(webhookUrl);

    fastify.post(webhookPath, async (request, reply) => {
      await this.bot.handleUpdate(request.body as any, reply.raw);
      return '';
    });

    fastify.listen({ port: 3001 }, () => {
      console.log(`🚀 Webhook running at ${webhookUrl}`);
    });
  }
}
