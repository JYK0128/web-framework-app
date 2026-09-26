import { createHmac, randomBytes } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import type { SmsConfigDto } from '@pkg/shared/server';

import type { DeliveryResult, SmsMessage } from '#/infra/delivery/delivery.interface';

@Injectable()
export class SmsAdapter {
  async send(message: SmsMessage, providerConfig?: SmsConfigDto): Promise<DeliveryResult> {
    if (!providerConfig?.enabled) return { success: false, error: 'SMS 발송이 비활성화되어 있습니다.' };
    switch (providerConfig.provider) {
      case 'SOLAPI_SMS': return this.sendSolapi(message, providerConfig.solapi);
      case 'ALIGO_SMS': return this.sendAligo(message, providerConfig.aligo);
      case 'NHN_SMS': return this.sendNhn(message, providerConfig.nhn);
    }
  }

  private async sendNhn(message: SmsMessage, config?: SmsConfigDto['nhn']): Promise<DeliveryResult> {
    if (!config?.appKey || !config.secretKey || !(message.from ?? config.senderPhone)) return { success: false, error: 'NHN SMS 설정과 발신번호가 필요합니다.' };
    const sender = message.from ?? config.senderPhone!;
    return this.sendProviderRequest(`https://api-sms.cloud.toast.com/sms/v3.0/appKeys/${encodeURIComponent(config.appKey)}/sender/sms`, { 'X-Secret-Key': config.secretKey }, { body: message.body, sendNo: sender.replace(/\D/g, ''), recipientList: [{ recipientNo: message.to.replace(/\D/g, '') }] });
  }

  private async sendSolapi(message: SmsMessage, config?: SmsConfigDto['solapi']): Promise<DeliveryResult> {
    if (!config?.apiKey || !config.apiSecret || !(message.from ?? config.senderPhone)) return { success: false, error: 'Solapi SMS 설정과 발신번호가 필요합니다.' };
    const dateTime = new Date().toISOString().split('.')[0] + 'Z';
    const salt = randomBytes(16).toString('hex');
    const signature = createHmac('sha256', config.apiSecret).update(dateTime + salt).digest('hex');
    const sender = message.from ?? config.senderPhone!;
    return this.sendProviderRequest('https://api.solapi.com/messages/v4/send', { Authorization: `HMAC-SHA256 apiKey=${config.apiKey}, date=${dateTime}, salt=${salt}, signature=${signature}` }, { message: { to: message.to.replace(/\D/g, ''), from: sender.replace(/\D/g, ''), text: message.body } });
  }

  private async sendAligo(message: SmsMessage, config?: SmsConfigDto['aligo']): Promise<DeliveryResult> {
    if (!config?.userId || !config.apiKey || !(message.from ?? config.sender)) return { success: false, error: 'Aligo SMS 설정과 발신번호가 필요합니다.' };
    const sender = message.from ?? config.sender!;
    const body = new URLSearchParams({ key: config.apiKey, user_id: config.userId, sender: sender.replace(/\D/g, ''), receiver: message.to.replace(/\D/g, ''), msg: message.body });
    try {
      const response = await fetch('https://apis.aligo.in/send/', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body });
      const result = await response.json() as { result_code?: string | number, message?: string, msg_id?: string | number };
      return response.ok && String(result.result_code) === '1' ? { success: true, messageId: String(result.msg_id ?? '') } : { success: false, error: result.message ?? `HTTP ${response.status}` };
    }
    catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Aligo SMS 발송에 실패했습니다.' };
    }
  }

  private async sendProviderRequest(url: string, auth: Record<string, string>, body: Record<string, unknown>): Promise<DeliveryResult> {
    try {
      const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...auth }, body: JSON.stringify(body) });
      const result = await response.json().catch(() => ({})) as Record<string, unknown>;
      const success = response.ok && result.errorCount === undefined && result.header !== undefined ? (result.header as { isSuccessful?: boolean }).isSuccessful !== false : response.ok;
      const rawId = result.messageId ?? result.message_id ?? result.id;
      const messageId = typeof rawId === 'string' || typeof rawId === 'number' ? String(rawId) : undefined;
      const rawError = result.message ?? result.description;
      const error = typeof rawError === 'string' ? rawError : `HTTP ${response.status}`;
      return success ? { success: true, messageId } : { success: false, error };
    }
    catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '외부 provider 호출에 실패했습니다.' };
    }
  }
}
