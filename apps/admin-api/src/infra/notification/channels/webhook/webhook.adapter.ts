import { Injectable } from '@nestjs/common';

import type { NotificationResult, WebhookAdapter, WebhookMessage } from '#/infra/notification/notification.interface';

@Injectable()
export class HttpWebhookAdapter implements WebhookAdapter {
  async send(message: WebhookMessage): Promise<NotificationResult> {
    try {
      const response = await fetch(message.url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(message.payload),
        signal: AbortSignal.timeout(10_000),
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
