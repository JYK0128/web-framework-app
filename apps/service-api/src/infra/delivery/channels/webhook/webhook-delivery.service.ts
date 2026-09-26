import { Injectable, Logger } from '@nestjs/common';
import { TimeUtil } from '@pkg/shared/common';

@Injectable()
export class WebhookDeliveryService {
  private readonly logger = new Logger(WebhookDeliveryService.name);

  async send(url: string, payload: Record<string, unknown>): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(TimeUtil.ms.second(5)),
      });
      if (!response.ok) {
        this.logger.warn(`Webhook delivery returned HTTP ${response.status}`);
        return false;
      }
      return true;
    }
    catch {
      this.logger.warn('Webhook delivery failed.');
      return false;
    }
  }
}
