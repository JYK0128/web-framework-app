import { createHmac, randomBytes } from 'node:crypto';

import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';
import type { SmsConfigDto } from '@pkg/shared/server';

import { SECURITY_CONFIG } from '#/app.config';
import { sendProviderRequest } from '#/core/notification/adapters/provider-request';
import type { SmsMessage } from '#/core/notification/notification.interface';

@Injectable()
export class SmsAdapter {
  async send(message: SmsMessage, providerConfig?: SmsConfigDto): Promise<string | undefined> {
    if (!providerConfig?.enabled) throw new ApplicationError({ code: 'NOTIFICATION_DELIVERY_FAILED', message: `SMS: 발송이 비활성화되어 있습니다.`, status: HttpStatus.BAD_GATEWAY });
    switch (providerConfig.provider) {
      case 'SOLAPI_SMS': return this.sendSolapi(message, providerConfig.solapi);
      case 'ALIGO_SMS': return this.sendAligo(message, providerConfig.aligo);
      case 'NHN_SMS': return this.sendNhn(message, providerConfig.nhn);
    }
  }

  private async sendNhn(message: SmsMessage, config?: SmsConfigDto['nhn']): Promise<string | undefined> {
    if (!config?.appKey || !config.secretKey || !(message.from ?? config.senderPhone)) throw new ApplicationError({ code: 'NOTIFICATION_DELIVERY_FAILED', message: `NHN SMS: 설정과 발신번호가 필요합니다.`, status: HttpStatus.BAD_GATEWAY });
    const sender = message.from ?? config.senderPhone!;
    return sendProviderRequest('NHN', `https://api-sms.cloud.toast.com/sms/v3.0/appKeys/${encodeURIComponent(config.appKey)}/sender/sms`, { 'X-Secret-Key': config.secretKey }, { body: message.body, sendNo: sender.replace(/\D/g, ''), recipientList: [{ recipientNo: message.to.replace(/\D/g, '') }] });
  }

  private async sendSolapi(message: SmsMessage, config?: SmsConfigDto['solapi']): Promise<string | undefined> {
    if (!config?.apiKey || !config.apiSecret || !(message.from ?? config.senderPhone)) throw new ApplicationError({ code: 'NOTIFICATION_DELIVERY_FAILED', message: `Solapi SMS: 설정과 발신번호가 필요합니다.`, status: HttpStatus.BAD_GATEWAY });
    const dateTime = new Date().toISOString().split('.')[0] + 'Z';
    const salt = randomBytes(16).toString('hex');
    const signature = createHmac('sha256', config.apiSecret).update(dateTime + salt).digest('hex');
    const sender = message.from ?? config.senderPhone!;
    return sendProviderRequest('SOLAPI', 'https://api.solapi.com/messages/v4/send', { Authorization: `HMAC-SHA256 apiKey=${config.apiKey}, date=${dateTime}, salt=${salt}, signature=${signature}` }, { message: { to: message.to.replace(/\D/g, ''), from: sender.replace(/\D/g, ''), text: message.body } });
  }

  private async sendAligo(message: SmsMessage, config?: SmsConfigDto['aligo']): Promise<string | undefined> {
    if (!config?.userId || !config.apiKey || !(message.from ?? config.sender)) throw new ApplicationError({ code: 'NOTIFICATION_DELIVERY_FAILED', message: `Aligo SMS: 설정과 발신번호가 필요합니다.`, status: HttpStatus.BAD_GATEWAY });
    const sender = message.from ?? config.sender!;
    const body = new URLSearchParams({ key: config.apiKey, user_id: config.userId, sender: sender.replace(/\D/g, ''), receiver: message.to.replace(/\D/g, ''), msg: message.body });
    try {
      const response = await fetch('https://apis.aligo.in/send/', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body, signal: AbortSignal.timeout(TimeUtil.ms.second(SECURITY_CONFIG.integrations.deliveryProviderRequestTimeoutSeconds)) });
      const result = await response.json() as { result_code?: string | number, message?: string, msg_id?: string | number };
      const errorMessage = result.message ?? `HTTP ${response.status}`;
      if (!response.ok || String(result.result_code) !== '1') throw ApplicationError.from(new Error(errorMessage), { code: 'NOTIFICATION_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
      return String(result.msg_id ?? '');
    }
    catch (error) {
      throw ApplicationError.from(error, { code: 'NOTIFICATION_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
    }
  }
}
