import { Injectable, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import { SystemContext } from '#/common/contexts/system.context';
import type { ISmsAdapter, SmsAdapterResult, SmsMessage } from '#/infra/notification/channels/sms/sms.interface';
import type { NotificationConfigDto } from '#/modules/system-config/dto';

interface NhnSmsApiResponse {
  header: {
    isSuccessful: boolean
    resultCode: number
    resultMessage: string
  }
  body?: {
    data?: {
      requestId?: string
      statusCode?: string
      recipientList?: Array<{
        recipientNo: string
        resultCode: number
        resultMessage: string
        recipientSeq: number
      }>
    }
  }
}

/**
 * NHN Cloud Notification SMS v3.0 REST API 연동 어댑터
 *
 * @see https://docs.nhncloud.com/ko/Notification/SMS/ko/api-guide/
 */
@Injectable()
export class NhnSmsAdapter implements ISmsAdapter {
  readonly providerName = 'nhn-sms';
  private readonly logger = new Logger(NhnSmsAdapter.name);

  constructor(private readonly systemContext: SystemContext) {}

  async send(message: SmsMessage, overrideConfig?: NotificationConfigDto['sms']['nhn']): Promise<SmsAdapterResult> {
    const config = overrideConfig ?? (await this.resolveConfig());
    if (!config || !config.appKey || !config.secretKey) {
      this.logger.warn('[NHN Cloud SMS] 설정이 누락되었습니다. appKey와 secretKey를 확인해주세요.');
      return { success: false, error: 'NHN Cloud SMS configuration (appKey, secretKey) is missing.' };
    }

    const sendNo = message.from || config.senderPhone;
    if (!sendNo) {
      this.logger.warn('[NHN Cloud SMS] 발신번호(senderPhone)가 설정되지 않았습니다.');
      return { success: false, error: 'Sender phone number (sendNo) is required.' };
    }

    // 전화번호에서 하이픈 및 공백 제거
    const cleanRecipient = message.to.replace(/\D/g, '');
    const cleanSender = sendNo.replace(/\D/g, '');

    const endpoint = `https://api-sms.cloud.toast.com/sms/v3.0/appKeys/${config.appKey}/sender/sms`;

    try {
      this.logger.log(`[NHN Cloud SMS] SMS 발송 요청 (${cleanRecipient})`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'X-Secret-Key': config.secretKey,
        },
        body: JSON.stringify({
          body: message.body,
          sendNo: cleanSender,
          recipientList: [
            {
              recipientNo: cleanRecipient,
            },
          ],
        }),
      });

      const responseText = await response.text();
      let result: NhnSmsApiResponse;
      try {
        result = JSON.parse(responseText) as NhnSmsApiResponse;
      }
      catch {
        this.logger.error(`[NHN Cloud SMS] 응답 파싱 실패 (HTTP ${response.status}): ${responseText}`);
        return {
          success: false,
          error: `HTTP ${response.status}: Failed to parse response from NHN Cloud SMS API`,
        };
      }

      if (!response.ok || !result.header?.isSuccessful) {
        const errMsg = result.header?.resultMessage || `HTTP ${response.status}`;
        this.logger.error(`[NHN Cloud SMS] 발송 실패 (code: ${result.header?.resultCode}): ${errMsg}`);
        return {
          success: false,
          error: `NHN SMS API Error [${result.header?.resultCode}]: ${errMsg}`,
        };
      }

      const requestId = result.body?.data?.requestId || `nhn-${Date.now()}`;
      this.logger.log(`[NHN Cloud SMS] SMS 발송 성공 (${cleanRecipient}, requestId: ${requestId})`);

      return {
        success: true,
        messageId: requestId,
      };
    }
    catch (err) {
      const error = ApplicationError.from(err, 'SMS_SEND_FAILED').message;
      this.logger.error(`[NHN Cloud SMS] 네트워크 또는 전송 예외 발생: ${error}`);
      return { success: false, error };
    }
  }

  private async resolveConfig() {
    const cfg = await this.systemContext.getConfig<NotificationConfigDto>('notification');
    const nhn = cfg?.sms?.nhn;
    if (!nhn?.appKey || !nhn.secretKey) return null;
    return {
      appKey: nhn.appKey,
      secretKey: nhn.secretKey,
      senderPhone: nhn.senderPhone ?? '',
    };
  }
}
