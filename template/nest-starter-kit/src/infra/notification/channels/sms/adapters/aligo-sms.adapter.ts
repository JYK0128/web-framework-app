import { Injectable, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import { ALIGO_SMS_API_URL } from '#/common/configs/communication.config';
import { SystemContext } from '#/common/contexts/system.context';
import type { ISmsAdapter, SmsAdapterResult, SmsMessage } from '#/infra/notification/channels/sms/sms.interface';
import type { NotificationConfigDto } from '#/modules/system-config/dto';

interface AligoSendResponse {
  result_code?: string | number
  message?: string
  msg_id?: string | number
  success_cnt?: number
  error_cnt?: number
}

/**
 * 알리고(Aligo) SMS REST API 연동 어댑터
 *
 * DB 기반 동적 설정을 사용하며 알리고 전송 API(https://apis.aligo.in/send/)를 직접 호출합니다.
 * @see https://smartsms.aligo.in/admin/api/spec.html
 */
@Injectable()
export class AligoSmsAdapter implements ISmsAdapter {
  readonly providerName = 'aligo-sms';
  private readonly logger = new Logger(AligoSmsAdapter.name);

  constructor(private readonly systemContext: SystemContext) {}

  async send(message: SmsMessage, overrideConfig?: NotificationConfigDto['sms']['aligo']): Promise<SmsAdapterResult> {
    const config = overrideConfig ?? (await this.resolveConfig());
    if (!config || !config.userId || !config.apiKey) {
      this.logger.warn('[Aligo SMS] 설정이 없습니다. 시스템 설정에서 알리고 SMS를 구성해주세요.');
      return { success: false, error: 'Aligo SMS configuration (userId, apiKey) is missing.' };
    }

    const sender = message.from || config.sender;
    if (!sender) {
      this.logger.warn('[Aligo SMS] 발신번호(sender)가 설정되지 않았습니다.');
      return { success: false, error: 'Sender phone number is required.' };
    }

    const cleanReceiver = message.to.replace(/\D/g, '');
    const cleanSender = sender.replace(/\D/g, '');

    try {
      this.logger.log(`[Aligo SMS] SMS 발송 요청 (${cleanReceiver})`);
      const formData = new URLSearchParams();
      formData.append('key', config.apiKey);
      formData.append('user_id', config.userId);
      formData.append('sender', cleanSender);
      formData.append('receiver', cleanReceiver);
      formData.append('msg', message.body);

      const response = await fetch(ALIGO_SMS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const responseText = await response.text();
      let result: AligoSendResponse;
      try {
        result = JSON.parse(responseText) as AligoSendResponse;
      }
      catch {
        this.logger.error(`[Aligo SMS] 응답 파싱 실패 (HTTP ${response.status}): ${responseText}`);
        return {
          success: false,
          error: `HTTP ${response.status}: Failed to parse response from Aligo SMS API`,
        };
      }

      // 알리고는 result_code가 1 또는 '1'인 경우 정상 전송으로 간주
      const isSuccess = String(result.result_code) === '1' && (result.error_cnt === undefined || result.error_cnt === 0);

      if (!response.ok || !isSuccess) {
        const errMsg = result.message || `HTTP ${response.status}`;
        this.logger.error(`[Aligo SMS] 발송 실패 (code: ${result.result_code}): ${errMsg}`);
        return {
          success: false,
          error: `Aligo SMS API Error [${result.result_code}]: ${errMsg}`,
        };
      }

      const messageId = String(result.msg_id || `aligo-${Date.now()}`);
      this.logger.log(`[Aligo SMS] SMS 발송 성공 (${cleanReceiver}, messageId: ${messageId})`);

      return {
        success: true,
        messageId,
      };
    }
    catch (err) {
      const error = ApplicationError.from(err, 'SMS_SEND_FAILED').message;
      this.logger.error(`[Aligo SMS] 발송 실패 to ${message.to}: ${error}`);
      return { success: false, error };
    }
  }

  private async resolveConfig() {
    const cfg = await this.systemContext.getConfig<NotificationConfigDto>('notification');
    const aligo = cfg?.sms?.aligo;
    if (!aligo?.userId || !aligo.apiKey) return null;
    return {
      userId: aligo.userId,
      apiKey: aligo.apiKey,
      sender: aligo.sender ?? '',
    };
  }
}
