import { createHmac, randomBytes } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import { SystemContext } from '#/common/contexts/system.context';
import type { IKakaoAdapter, KakaoAdapterResult, KakaoMessage } from '#/infra/notification/channels/kakao/kakao.interface';
import type { KakaoSolapiDetailsDto, NotificationConfigDto } from '#/modules/system-config/dto';

interface SolapiSendResponse {
  groupId?: string
  messageId?: string
  statusCode?: string
  statusMessage?: string
  errorCount?: number
  log?: Array<{
    message?: string
  }>
}

/**
 * 솔라피(Solapi) 카카오 알림톡 REST API 연동 어댑터
 *
 * HMAC-SHA256 인증 방식을 사용하여 Solapi v4 send API를 호출합니다.
 * @see https://developers.solapi.com/references/message-api
 */
@Injectable()
export class SolapiAlimtalkAdapter implements IKakaoAdapter {
  readonly providerName = 'solapi-alimtalk';
  private readonly logger = new Logger(SolapiAlimtalkAdapter.name);

  constructor(private readonly systemContext: SystemContext) {}

  async send(
    message: KakaoMessage,
    overrideConfig?: KakaoSolapiDetailsDto & { plusFriendId?: string, senderKey?: string },
  ): Promise<KakaoAdapterResult> {
    const config = overrideConfig ?? (await this.resolveConfig());
    if (!config?.apiKey || !config.apiSecret || !config.senderKey) {
      this.logger.warn('[Solapi Alimtalk] 설정이 없습니다. apiKey, apiSecret, senderKey를 구성해주세요.');
      return { success: false, error: 'Solapi Alimtalk configuration (apiKey, apiSecret, senderKey) is missing.' };
    }

    const cleanRecipient = message.recipientPhone.replace(/\D/g, '');

    try {
      this.logger.log(`[Solapi Alimtalk] 알림톡 발송 요청 (${cleanRecipient})`);
      const dateTime = new Date().toISOString().split('.')[0] + 'Z';
      const salt = randomBytes(16).toString('hex');
      const signature = createHmac('sha256', config.apiSecret)
        .update(dateTime + salt)
        .digest('hex');

      const authHeader = `HMAC-SHA256 apiKey=${config.apiKey}, date=${dateTime}, salt=${salt}, signature=${signature}`;

      const response = await fetch('https://api.solapi.com/messages/v4/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          message: {
            to: cleanRecipient,
            text: message.message,
            kakaoOptions: {
              pfId: config.senderKey,
              templateId: message.templateCode,
              variables: message.templateArgs,
            },
          },
        }),
      });

      const responseText = await response.text();
      let result: SolapiSendResponse;
      try {
        result = JSON.parse(responseText) as SolapiSendResponse;
      }
      catch {
        this.logger.error(`[Solapi Alimtalk] 응답 파싱 실패 (HTTP ${response.status}): ${responseText}`);
        return {
          success: false,
          error: `HTTP ${response.status}: Failed to parse response from Solapi API`,
        };
      }

      if (!response.ok || (result.errorCount && result.errorCount > 0)) {
        const errMsg = result.statusMessage || result.log?.[0]?.message || `HTTP ${response.status}`;
        this.logger.error(`[Solapi Alimtalk] 발송 실패: ${errMsg}`);
        return {
          success: false,
          error: `Solapi API Error [${result.statusCode || response.status}]: ${errMsg}`,
        };
      }

      const messageId = result.messageId || result.groupId || `solapi-alimtalk-${Date.now()}`;
      this.logger.log(`[Solapi Alimtalk] 알림톡 발송 성공 (${cleanRecipient}, messageId: ${messageId})`);

      return {
        success: true,
        messageId,
      };
    }
    catch (err) {
      const error = ApplicationError.from(err, 'KAKAO_SEND_FAILED').message;
      this.logger.error(`[Solapi Alimtalk] 발송 예외 발생: ${error}`);
      return { success: false, error };
    }
  }

  private async resolveConfig() {
    const cfg = await this.systemContext.getConfig<NotificationConfigDto>('notification');
    const kakao = cfg?.messenger?.kakao;
    const solapi = kakao?.solapi;

    if (!solapi?.apiKey || !solapi.apiSecret || !kakao?.senderKey) return null;
    return {
      apiKey: solapi.apiKey,
      apiSecret: solapi.apiSecret,
      senderKey: kakao.senderKey,
      plusFriendId: kakao.plusFriendId,
    };
  }
}
