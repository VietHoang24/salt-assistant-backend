import { Body, Controller, Headers, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from '@/auth/public.decorator';
import { TelegramWebhookService } from './telegram-webhook.service';

@Controller('telegram')
export class TelegramWebhookController {
  constructor(
    private readonly telegramWebhookService: TelegramWebhookService,
  ) {}

  @Post('webhook')
  @Public()
  async handleWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('x-telegram-bot-api-secret-token') secret: string,
    @Body() body: any,
  ) {
    // Verify secret token
    console.log('body', body);
    console.log('secret', secret);
    console.log(
      'process.env.TELEGRAM_SECRETE_BOT_TOKEN',
      process.env.TELEGRAM_SECRETE_BOT_TOKEN,
    );
    if (secret !== process.env.TELEGRAM_SECRETE_BOT_TOKEN) {
      return res.sendStatus(403);
    }

    try {
      await this.telegramWebhookService.handleUpdate(body);
      return res.sendStatus(200);
    } catch (error) {
      console.error('Error handling telegram webhook:', error);
      return res.sendStatus(200); // Still return 200 to Telegram to avoid retries
    }
  }
}
