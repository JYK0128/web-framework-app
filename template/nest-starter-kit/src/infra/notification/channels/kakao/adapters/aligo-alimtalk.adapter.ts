import { Injectable, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import { SystemContext } from '#/common/contexts/system.context';
import type { IKakaoAdapter, KakaoAdapterResult, KakaoMessage } from '#/infra/notification/channels/kakao/kakao.interface';
import type { KakaoAligoDetailsDto, NotificationConfigDto } from '#/modules/system-config/dto';

interface AligoAlimtalkResponse {
  code?: number
  message?: string
  info?: {
    mid?: number
    type?: string
  }
}

/**
 * 알리고(Aligo) 카카오 알림톡 REST API 연동 어댑터
 *
 * @see https://smartsms.aligo.in/admin/api/spec.html
 */
@Injectable()
export class AligoAlimtalkAdapter implements IKakaoAdapter {
  readonly providerName = 'aligo-alimtalk';
  private readonly logger = new Logger(AligoAlimtalkAdapter.name);

  constructor(private readonly systemContext: SystemContext) {}

  async send(
    message: KakaoMessage,
    overrideConfig?: KakaoAligoDetailsDto & { plusFriendId?: string, senderKey?: string },
  ): Promise<KakaoAdapterResult> {
    const config = overrideConfig ?? (await this.resolveConfig());
    if (!config?.userId || !config.apiKey || !config.senderKey) {
      this.logger.warn('[Aligo Alimtalk] 설정이 없습니다. userId, apiKey, senderKey를 구성해주세요.');
      return { success: false, error: 'Aligo Alimtalk configuration (userId, apiKey, senderKey) is missing.' };
    }

    const cleanReceiver = message.recipientPhone.replace(/\D/g, '');

    try {
      this.logger.log(`[Aligo Alimtalk] 알림톡 발송 요청 (${cleanReceiver})`);
      const formData = new URLSearchParams();
      formData.append('apikey', config.apiKey);
      formData.append('userid', config.userId);
      formData.append('senderkey', config.senderKey);
      formData.append('tpl_code', message.templateCode ?? 'DEFAULT');
      formData.append('receiver_1', cleanReceiver);
      formData.append('message_1', message.message);
      if (message.title) {
        formData.append('subject_1', message.title);
      }

      const response = await fetch('https://kakaoapi.aligo.in/akv10/alimtalk/send/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const responseText = await response.text();
      let result: AligoAlimtalkResponse;
      try {
        result = JSON.parse(responseText) as AligoAlimtalkResponse;
      }
      catch {
        this.logger.error(`[Aligo Alimtalk] 응답 파싱 실패 (HTTP ${response.status}): ${responseText}`);
        return {
          success: false,
          error: `HTTP ${response.status}: Failed to parse response from Aligo Alimtalk API`,
        };
      }

      // 알리고 알림톡은 code === 0 이 정상 발송
      if (!response.ok || result.code !== 0) {
        const errMsg = result.message || `HTTP ${response.status}`;
        this.logger.error(`[Aligo Alimtalk] 발송 실패 (code: ${result.code}): ${errMsg}`);
        return {
          success: false,
          error: `Aligo Alimtalk API Error [${result.code}]: ${errMsg}`,
        };
      }

      const messageId = String(result.info?.mid || `aligo-alimtalk-${Date.now()}`);
      this.logger.log(`[Aligo Alimtalk] 알림톡 발송 성공 (${cleanReceiver}, messageId: ${messageId})`);

      return {
        success: true,
        messageId,
      };
    }
    catch (err) {
      const error = ApplicationError.from(err, 'KAKAO_SEND_FAILED').message;
      this.logger.error(`[Aligo Alimtalk] 발송 예외 발생: ${error}`);
      return { success: false, error };
    }
  }

  private async resolveConfig() {
    const cfg = await this.systemContext.getConfig<NotificationConfigDto>('notification');
    const kakao = cfg?.messenger?.kakao;
    const aligo = kakao?.aligo;

    if (!aligo?.userId || !aligo.apiKey || !kakao?.senderKey) return null;
    return {
      userId: aligo.userId,
      apiKey: aligo.apiKey,
      senderKey: kakao.senderKey,
      plusFriendId: kakao.plusFriendId,
    };
  }
}
