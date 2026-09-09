import { Injectable, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import { SystemContext } from '#/common/contexts/system.context';
import type { IKakaoAdapter, KakaoAdapterResult, KakaoMessage } from '#/infra/notification/channels/kakao/kakao.interface';
import type { KakaoNhnDetailsDto, NotificationConfigDto } from '#/modules/system-config/dto';

interface NhnAlimtalkResponse {
  header?: {
    isSuccessful: boolean
    resultCode: number
    resultMessage: string
  }
  message?: {
    requestId?: string
  }
}

/**
 * NHN Cloud 알림톡 REST API 연동 어댑터
 *
 * @see https://docs.nhncloud.com/ko/Notification/KakaoTalk%20Bizmessage/ko/alimtalk-api-guide/
 */
@Injectable()
export class NhnAlimtalkAdapter implements IKakaoAdapter {
  readonly providerName = 'nhn-alimtalk';
  private readonly logger = new Logger(NhnAlimtalkAdapter.name);

  constructor(private readonly systemContext: SystemContext) {}

  async send(
    message: KakaoMessage,
    overrideConfig?: KakaoNhnDetailsDto & { plusFriendId?: string, senderKey?: string },
  ): Promise<KakaoAdapterResult> {
    const config = overrideConfig ?? (await this.resolveConfig());
    if (!config?.appKey || !config.secretKey || !config.senderKey) {
      this.logger.warn('[NHN Alimtalk] 설정이 누락되었습니다. appKey, secretKey, senderKey를 확인해주세요.');
      return { success: false, error: 'NHN Alimtalk configuration (appKey, secretKey, senderKey) is missing.' };
    }

    const cleanRecipient = message.recipientPhone.replace(/\D/g, '');
    const endpoint = `https://api-alimtalk.cloud.toast.com/alimtalk/v2.2/appkeys/${config.appKey}/messages`;

    try {
      this.logger.log(`[NHN Alimtalk] 알림톡 발송 요청 (${cleanRecipient})`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'X-Secret-Key': config.secretKey,
        },
        body: JSON.stringify({
          plusFriendId: config.plusFriendId,
          senderKey: config.senderKey,
          templateCode: message.templateCode ?? 'TEST_TEMPLATE',
          recipientList: [
            {
              recipientNo: cleanRecipient,
              content: message.message,
              templateParameter: message.templateArgs,
            },
          ],
        }),
      });

      const responseText = await response.text();
      let result: NhnAlimtalkResponse;
      try {
        result = JSON.parse(responseText) as NhnAlimtalkResponse;
      }
      catch {
        this.logger.error(`[NHN Alimtalk] 응답 파싱 실패 (HTTP ${response.status}): ${responseText}`);
        return {
          success: false,
          error: `HTTP ${response.status}: Failed to parse response from NHN Alimtalk API`,
        };
      }

      if (!response.ok || !result.header?.isSuccessful) {
        const errMsg = result.header?.resultMessage || `HTTP ${response.status}`;
        this.logger.error(`[NHN Alimtalk] 발송 실패: ${errMsg}`);
        return {
          success: false,
          error: `NHN Alimtalk API Error [${result.header?.resultCode}]: ${errMsg}`,
        };
      }

      const requestId = result.message?.requestId || `nhn-alimtalk-${Date.now()}`;
      this.logger.log(`[NHN Alimtalk] 알림톡 발송 성공 (${cleanRecipient}, requestId: ${requestId})`);

      return {
        success: true,
        messageId: requestId,
      };
    }
    catch (err) {
      const error = ApplicationError.from(err, 'KAKAO_SEND_FAILED').message;
      this.logger.error(`[NHN Alimtalk] 발송 예외 발생: ${error}`);
      return { success: false, error };
    }
  }

  private async resolveConfig() {
    const cfg = await this.systemContext.getConfig<NotificationConfigDto>('notification');
    const kakao = cfg?.messenger?.kakao;
    const nhn = kakao?.nhn;
    const appKey = nhn?.appKey;
    const secretKey = nhn?.secretKey;

    if (!appKey || !secretKey || !kakao?.senderKey) return null;
    return {
      appKey,
      secretKey,
      senderKey: kakao.senderKey,
      plusFriendId: kakao.plusFriendId,
    };
  }
}
