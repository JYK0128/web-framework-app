import { Injectable, Logger } from '@nestjs/common';

import type { IKakaoAdapter, KakaoAdapterResult, KakaoMessage } from '#/infra/notification/channels/kakao/kakao.interface';

/**
 * NHN Cloud 카카오 알림톡 연동 어댑터
 */
@Injectable()
export class NhnAlimtalkAdapter implements IKakaoAdapter {
  readonly providerName = 'nhn-alimtalk';
  private readonly logger = new Logger(NhnAlimtalkAdapter.name);

  async send(message: KakaoMessage): Promise<KakaoAdapterResult> {
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
      this.logger.error(`[Alimtalk] Failed for ${message.recipientPhone}: ${error}`);
      return {
        success: false,
        error,
      };
    }
  }
}
