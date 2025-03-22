// src/bot/services/bot.service.ts
import { Injectable } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import Fastify from 'fastify';

@Injectable()
export class BotService {
  private readonly bot: Telegraf;

  constructor() {
    const token = process.env.BOT_TOKEN;
    if (!token) throw new Error('BOT_TOKEN is missing!');
    this.bot = new Telegraf(token);

    this.bot.start((ctx) => ctx.reply('Привет от Fastify!'));
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
