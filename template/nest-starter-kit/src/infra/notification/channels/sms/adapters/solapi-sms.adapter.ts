import { createHmac, randomBytes } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import { SOLAPI_MESSAGE_API_URL } from '#/common/configs/communication.config';
import { SystemContext } from '#/common/contexts/system.context';
import type { ISmsAdapter, SmsAdapterResult, SmsMessage } from '#/infra/notification/channels/sms/sms.interface';
import type { NotificationConfigDto } from '#/modules/system-config/dto';

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
 * 솔라피(Solapi) SMS REST API 연동 어댑터
 *
 * HMAC-SHA256 인증 방식을 사용하여 Solapi v4 send API를 호출합니다.
 * @see https://developers.solapi.com/references/message-api
 */
@Injectable()
export class SolapiSmsAdapter implements ISmsAdapter {
  readonly providerName = 'solapi-sms';
  private readonly logger = new Logger(SolapiSmsAdapter.name);

  constructor(private readonly systemContext: SystemContext) {}

  async send(message: SmsMessage, overrideConfig?: NotificationConfigDto['sms']['solapi']): Promise<SmsAdapterResult> {
    const config = overrideConfig ?? (await this.resolveConfig());
    if (!config || !config.apiKey || !config.apiSecret) {
      this.logger.warn('[Solapi SMS] 설정이 없습니다. 시스템 설정에서 솔라피 SMS를 구성해주세요.');
      return { success: false, error: 'Solapi SMS configuration (apiKey, apiSecret) is missing.' };
    }

    const senderPhone = message.from || config.senderPhone;
    if (!senderPhone) {
      this.logger.warn('[Solapi SMS] 발신번호(senderPhone)가 설정되지 않았습니다.');
      return { success: false, error: 'Sender phone number is required.' };
    }

    const cleanRecipient = message.to.replace(/\D/g, '');
    const cleanSender = senderPhone.replace(/\D/g, '');

    try {
      this.logger.log(`[Solapi SMS] SMS 발송 요청 (${cleanRecipient})`);
      // Solapi HMAC-SHA256 Authorization Header 생성
      const dateTime = new Date().toISOString().split('.')[0] + 'Z';
      const salt = randomBytes(16).toString('hex');
      const signature = createHmac('sha256', config.apiSecret)
        .update(dateTime + salt)
        .digest('hex');

      const authHeader = `HMAC-SHA256 apiKey=${config.apiKey}, date=${dateTime}, salt=${salt}, signature=${signature}`;

      const response = await fetch(SOLAPI_MESSAGE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          message: {
            to: cleanRecipient,
            from: cleanSender,
            text: message.body,
          },
        }),
      });

      const responseText = await response.text();
      let result: SolapiSendResponse;
      try {
        result = JSON.parse(responseText) as SolapiSendResponse;
      }
      catch {
        this.logger.error(`[Solapi SMS] 응답 파싱 실패 (HTTP ${response.status}): ${responseText}`);
        return {
          success: false,
          error: `HTTP ${response.status}: Failed to parse response from Solapi API`,
        };
      }

      if (!response.ok || (result.errorCount && result.errorCount > 0)) {
        const errMsg = result.statusMessage || result.log?.[0]?.message || `HTTP ${response.status}`;
        this.logger.error(`[Solapi SMS] 발송 실패: ${errMsg}`);
        return {
          success: false,
          error: `Solapi API Error [${result.statusCode || response.status}]: ${errMsg}`,
        };
      }

      const messageId = result.messageId || result.groupId || `solapi-${Date.now()}`;
      this.logger.log(`[Solapi SMS] SMS 발송 성공 (${cleanRecipient}, messageId: ${messageId})`);

      return {
        success: true,
        messageId,
      };
    }
    catch (err) {
      const error = ApplicationError.from(err, 'SMS_SEND_FAILED').message;
      this.logger.error(`[Solapi SMS] 발송 예외 발생 to ${message.to}: ${error}`);
      return { success: false, error };
    }
  }

  private async resolveConfig() {
    const cfg = await this.systemContext.getConfig<NotificationConfigDto>('notification');
    const solapi = cfg?.sms?.solapi;
    if (!solapi?.apiKey || !solapi.apiSecret) return null;
    return {
      apiKey: solapi.apiKey,
      apiSecret: solapi.apiSecret,
      senderPhone: solapi.senderPhone ?? '',
    };
  }
}
