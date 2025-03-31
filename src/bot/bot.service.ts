import { Injectable, Logger } from '@nestjs/common';
import { Telegraf, Markup } from 'telegraf';
import { Express } from 'express';

@Injectable()
export class BotService {
  private readonly bot: Telegraf;
  private readonly logger = new Logger(BotService.name);

  constructor() {
    const token = process.env.BOT_TOKEN;
    if (!token) {
      this.logger.error('BOT_TOKEN is missing!');
      throw new Error('BOT_TOKEN is missing!');
    }
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

    // Add error handling
    this.bot.catch((err) => {
      this.logger.error('Bot error:', err);
    });
  }

  /**
   * Setup webhook for Telegram bot using Express
   * @param expressApp Express instance
   */
  async setupWebhook(expressApp: Express) {
    try {
      const token = process.env.BOT_TOKEN;
      const domain = process.env.BOT_WEBHOOK_DOMAIN;
      if (!token || !domain) {
        this.logger.error(
          'Missing required environment variables for webhook setup',
        );
        throw new Error(
          'Missing required environment variables for webhook setup',
        );
      }

      const path = `/bot${token}`;
      const fullUrl = `${domain}${path}`;

      this.logger.log(`Setting up webhook at ${fullUrl}`);

      // Delete existing webhook first
      await this.bot.telegram.deleteWebhook();

      // Set new webhook
      await this.bot.telegram.setWebhook(fullUrl);

      // Verify webhook is set
      const webhookInfo = await this.bot.telegram.getWebhookInfo();
      this.logger.log('Webhook info:', webhookInfo);

      // Setup Express middleware - use the exact same path as the webhook
      expressApp.use(path, this.bot.webhookCallback());

      this.logger.log(`✅ Telegram Webhook is set at ${fullUrl}`);
    } catch (error) {
      this.logger.error('Failed to setup webhook:', error);
      throw error;
    }
  }

  getBotInstance() {
    return this.bot;
  }
}
