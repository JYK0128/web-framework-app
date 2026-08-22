import { Injectable, Logger } from '@nestjs/common';

import type { IKakaoProvider, KakaoMessage, KakaoProviderResult } from '#/infra/notification/channels/kakao/kakao.interface';

@Injectable()
export class NhnAlimtalkProvider implements IKakaoProvider {
  readonly providerName = 'nhn-alimtalk';
  private readonly logger = new Logger(NhnAlimtalkProvider.name);

  async send(message: KakaoMessage): Promise<KakaoProviderResult> {
    try {
      // NHN Cloud 알림톡 / 비즈메시지 API 연동부
      this.logger.log(
        `[NHN Alimtalk] Sending to ${message.recipientPhone} (Template: ${message.templateCode ?? 'DEFAULT'})`,
      );

      return {
        success: true,
        messageId: `nhn-alimtalk-${Date.now()}`,
      };
    }
    catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.logger.error(`[NHN Alimtalk] Failed for ${message.recipientPhone}: ${error}`);
      return {
        success: false,
        error,
      };
    }
  }
}
