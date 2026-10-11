import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';

import { SECURITY_CONFIG } from '#/app.config';
import type { IWebhookAdapter, WebhookMessage } from '#/core/notification/notification.interface';

@Injectable()
export class WebhookAdapter implements IWebhookAdapter {
  async send(message: WebhookMessage): Promise<void> {
    let response: Response;
    try {
      response = await fetch(message.url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(message.payload),
        signal: AbortSignal.timeout(TimeUtil.ms.second(SECURITY_CONFIG.integrations.webhookRequestTimeoutSeconds)),
      });
    }
    catch {
      throw new ApplicationError({ code: 'WEBHOOK_DELIVERY_FAILED', message: 'Webhook request failed', status: HttpStatus.BAD_GATEWAY });
    }

    if (!response.ok) throw new ApplicationError({ code: 'WEBHOOK_DELIVERY_FAILED', message: `HTTP ${response.status}`, status: HttpStatus.BAD_GATEWAY });
  }
}
