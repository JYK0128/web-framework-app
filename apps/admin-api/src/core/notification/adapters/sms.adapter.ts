import { createHmac, randomBytes } from 'node:crypto';

import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import type { SmsConfigDto } from '@pkg/shared/server';
import type { AxiosResponse } from 'axios';
import { z } from 'zod';

import { postNotificationForm, postNotificationJson } from '#/core/notification/notification.http';
import type { SmsMessage } from '#/core/notification/notification.interface';

const recordSchema = z.record(z.string(), z.unknown());

function parseNhnSmsResponse(response: AxiosResponse<unknown>): string | undefined {
  const parsed = recordSchema.safeParse(response.data);
  if (!parsed.success) throw new ApplicationError({ code: 'NOTIFICATION_SEND_FAILED', message: `SMS: Invalid provider response`, status: HttpStatus.BAD_GATEWAY });

  const data = parsed.data;
  const header = recordSchema.safeParse(data.header).data;
  const body = recordSchema.safeParse(data.body).data;
  const result = recordSchema.safeParse(data.result).data;
  const recipients = recordSchema.safeParse(body?.data).data;
  const sendResults = z.array(recordSchema).safeParse(recipients?.sendResultList).data;
  const recipientsAccepted = recipients?.sendResultList === undefined
    || (sendResults !== undefined && sendResults.length > 0 && sendResults.every((item) => item.resultCode === 0));
  const accepted = header?.isSuccessful === true && recipients?.statusCode !== '3' && recipientsAccepted;
  const failedRecipient = sendResults?.find((item) => item.resultCode !== 0);
  const rawId = data.messageId ?? data.name ?? recipients?.requestId ?? body?.requestId ?? result?.message_id;
  const rawError = failedRecipient?.resultMessage ?? (header?.isSuccessful === false ? header.resultMessage : undefined) ?? data.errorMessage ?? data.message ?? data.description ?? data.errmsg;

  const errorMessage = typeof rawError === 'string' ? rawError : `Provider rejected request (HTTP ${response.status})`;
  if ((response.status < 200 || response.status >= 300) || !accepted) throw ApplicationError.from(new Error(errorMessage), { code: 'NOTIFICATION_SEND_FAILED', status: HttpStatus.BAD_GATEWAY });
  return typeof rawId === 'string' || typeof rawId === 'number' ? String(rawId) : undefined;
}

function parseSolapiSmsResponse(response: AxiosResponse<unknown>): string | undefined {
  const parsed = recordSchema.safeParse(response.data);
  if (!parsed.success) throw new ApplicationError({ code: 'NOTIFICATION_SEND_FAILED', message: `SMS: Invalid provider response`, status: HttpStatus.BAD_GATEWAY });

  const data = parsed.data;
  const accepted = typeof data.messageId === 'string' && !data.errorCode && !(typeof data.errorCount === 'number' && data.errorCount > 0);
  const messageId = typeof data.messageId === 'string' ? data.messageId : undefined;
  const rawError = data.errorMessage ?? data.message ?? data.description ?? data.errmsg;

  const errorMessage = typeof rawError === 'string' ? rawError : `Provider rejected request (HTTP ${response.status})`;
  if ((response.status < 200 || response.status >= 300) || !accepted) throw ApplicationError.from(new Error(errorMessage), { code: 'NOTIFICATION_SEND_FAILED', status: HttpStatus.BAD_GATEWAY });
  return messageId;
}

@Injectable()
export class SmsAdapter {
  private async postProviderJson(url: string, headers: Record<string, string>, body: Record<string, unknown>): Promise<AxiosResponse<unknown>> {
    try {
      return await postNotificationJson(url, headers, body);
    }
    catch (error) {
      throw ApplicationError.from(error, { code: 'NOTIFICATION_SEND_FAILED', status: HttpStatus.BAD_GATEWAY });
    }
  }

  async send(message: SmsMessage, providerConfig?: SmsConfigDto): Promise<string | undefined> {
    if (!providerConfig?.enabled) throw new ApplicationError({ code: 'NOTIFICATION_SEND_FAILED', message: `SMS: 발송이 비활성화되어 있습니다.`, status: HttpStatus.BAD_GATEWAY });
    switch (providerConfig.provider) {
      case 'SOLAPI_SMS': return this.sendSolapi(message, providerConfig.solapi);
      case 'ALIGO_SMS': return this.sendAligo(message, providerConfig.aligo);
      case 'NHN_SMS': return this.sendNhn(message, providerConfig.nhn);
    }
  }

  private async sendNhn(message: SmsMessage, config?: SmsConfigDto['nhn']): Promise<string | undefined> {
    if (!config?.appKey || !config.secretKey || !(message.from ?? config.senderPhone)) throw new ApplicationError({ code: 'NOTIFICATION_SEND_FAILED', message: `NHN SMS: 설정과 발신번호가 필요합니다.`, status: HttpStatus.BAD_GATEWAY });
    const sender = message.from ?? config.senderPhone!;
    const result = await this.postProviderJson(`https://api-sms.cloud.toast.com/sms/v3.0/appKeys/${encodeURIComponent(config.appKey)}/sender/sms`, { 'X-Secret-Key': config.secretKey }, { body: message.body, sendNo: sender.replace(/\D/g, ''), recipientList: [{ recipientNo: message.to.replace(/\D/g, '') }] });
    return parseNhnSmsResponse(result);
  }

  private async sendSolapi(message: SmsMessage, config?: SmsConfigDto['solapi']): Promise<string | undefined> {
    if (!config?.apiKey || !config.apiSecret || !(message.from ?? config.senderPhone)) throw new ApplicationError({ code: 'NOTIFICATION_SEND_FAILED', message: `Solapi SMS: 설정과 발신번호가 필요합니다.`, status: HttpStatus.BAD_GATEWAY });
    const dateTime = new Date().toISOString().split('.')[0] + 'Z';
    const salt = randomBytes(16).toString('hex');
    const signature = createHmac('sha256', config.apiSecret).update(dateTime + salt).digest('hex');
    const sender = message.from ?? config.senderPhone!;
    const result = await this.postProviderJson('https://api.solapi.com/messages/v4/send', { Authorization: `HMAC-SHA256 apiKey=${config.apiKey}, date=${dateTime}, salt=${salt}, signature=${signature}` }, { message: { to: message.to.replace(/\D/g, ''), from: sender.replace(/\D/g, ''), text: message.body } });
    return parseSolapiSmsResponse(result);
  }

  private async sendAligo(message: SmsMessage, config?: SmsConfigDto['aligo']): Promise<string | undefined> {
    if (!config?.userId || !config.apiKey || !(message.from ?? config.sender)) throw new ApplicationError({ code: 'NOTIFICATION_SEND_FAILED', message: `Aligo SMS: 설정과 발신번호가 필요합니다.`, status: HttpStatus.BAD_GATEWAY });
    const sender = message.from ?? config.sender!;
    const body = new URLSearchParams({ key: config.apiKey, user_id: config.userId, sender: sender.replace(/\D/g, ''), receiver: message.to.replace(/\D/g, ''), msg: message.body });
    try {
      const response = await postNotificationForm<{ result_code?: string | number, message?: string, msg_id?: string | number }>('https://apis.aligo.in/send/', {}, body);
      const result = response.data;
      const errorMessage = result.message ?? `HTTP ${response.status}`;
      if (response.status < 200 || response.status >= 300 || String(result.result_code) !== '1') throw ApplicationError.from(new Error(errorMessage), { code: 'NOTIFICATION_SEND_FAILED', status: HttpStatus.BAD_GATEWAY });
      return String(result.msg_id ?? '');
    }
    catch (error) {
      throw ApplicationError.from(error, { code: 'NOTIFICATION_SEND_FAILED', status: HttpStatus.BAD_GATEWAY });
    }
  }
}
