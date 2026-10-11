import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';
import axios from 'axios';

import { SECURITY_CONFIG } from '#/app.config';
import type { IWebhookAdapter, WebhookMessage } from '#/core/notification/notification.interface';

@Injectable()
export class WebhookAdapter implements IWebhookAdapter {
  private readonly client = axios.create({ validateStatus: () => true });

  async send(message: WebhookMessage): Promise<void> {
    try {
      const response = await this.client.post(message.url, message.payload, { timeout: TimeUtil.ms.second(SECURITY_CONFIG.integrations.webhookRequestTimeoutSeconds) });
      if (response.status < 200 || response.status >= 300) throw new ApplicationError({ code: 'WEBHOOK_DELIVERY_FAILED', message: `HTTP ${response.status}`, status: HttpStatus.BAD_GATEWAY });
    }
    catch (error) {
      if (error instanceof ApplicationError) throw error;
      throw new ApplicationError({ code: 'WEBHOOK_DELIVERY_FAILED', message: 'Webhook request failed', status: HttpStatus.BAD_GATEWAY });
    }
  }
}
