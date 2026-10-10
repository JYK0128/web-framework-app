import { Injectable } from '@nestjs/common';
import { TimeUtil } from '@pkg/shared/common';

import { SECURITY_CONFIG } from '#/app.config';
import type { DeliveryResult, IWebhookAdapter, WebhookMessage } from '#/infra/notification/notification.interface';

@Injectable()
export class WebhookAdapter implements IWebhookAdapter {
  async send(message: WebhookMessage): Promise<DeliveryResult> {
    try {
      const response = await fetch(message.url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(message.payload),
        signal: AbortSignal.timeout(TimeUtil.ms.second(SECURITY_CONFIG.integrations.webhookRequestTimeoutSeconds)),
      });

      return response.ok
        ? { success: true }
        : { success: false, error: `HTTP ${response.status}` };
    }
    catch {
      return { success: false, error: '웹훅 대상 서비스에 연결할 수 없습니다.' };
    }
  }
}
