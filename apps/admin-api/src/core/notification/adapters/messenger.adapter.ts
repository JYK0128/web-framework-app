import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import type { AlimtalkMessageDto, MessengerConfigDto } from '@pkg/shared/server';
import type { AxiosResponse } from 'axios';
import { z } from 'zod';

import { getNotification, postNotificationJson } from '#/core/notification/notification.http';
import type { MessengerMessage } from '#/core/notification/notification.interface';

import { AlimtalkAdapter } from './alimtalk.adapter';

type MessengerProvider = 'LINE' | 'WHATSAPP' | 'TELEGRAM' | 'WECHAT';

const recordSchema = z.record(z.string(), z.unknown());

function parseMessengerResponse(provider: MessengerProvider, response: AxiosResponse<unknown>): string | undefined {
  const parsed = recordSchema.safeParse(response.data);
  if (!parsed.success) throw new ApplicationError({ code: 'NOTIFICATION_DELIVERY_FAILED', message: `${provider}: Invalid provider response`, status: HttpStatus.BAD_GATEWAY });

  const data = parsed.data;
  let accepted: boolean;
  switch (provider) {
    case 'LINE': accepted = !data.error && !data.message;
      break;
    case 'WHATSAPP': accepted = Array.isArray(data.messages) && data.messages.length > 0 && !data.error;
      break;
    case 'TELEGRAM': accepted = data.ok === true;
      break;
    case 'WECHAT': accepted = data.errcode === 0;
      break;
  }

  const body = recordSchema.safeParse(data.body).data;
  const bodyData = recordSchema.safeParse(body?.data).data;
  const result = recordSchema.safeParse(data.result).data;
  const recipients = recordSchema.safeParse(body?.data).data;
  const sendResults = recipients?.sendResultList;
  const recipientResults = z.array(recordSchema).safeParse(sendResults).data;
  const failedRecipient = recipientResults?.find((item) => item.resultCode !== 0);
  const header = recordSchema.safeParse(data.header).data;
  const rawId = data.messageId ?? data.name ?? bodyData?.requestId ?? recipients?.requestId ?? body?.requestId ?? result?.message_id;
  const messageId = typeof rawId === 'string' || typeof rawId === 'number' ? String(rawId) : undefined;
  const rawError = failedRecipient?.resultMessage ?? (header?.isSuccessful === false ? header.resultMessage : undefined) ?? data.errorMessage ?? data.message ?? data.description ?? data.errmsg;

  const errorMessage = typeof rawError === 'string' ? rawError : `Provider rejected request (HTTP ${response.status})`;
  if ((response.status < 200 || response.status >= 300) || !accepted) throw ApplicationError.from(new Error(errorMessage), { code: 'NOTIFICATION_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
  return messageId;
}

@Injectable()
export class MessengerAdapter {
  private async postProviderJson(url: string, headers: Record<string, string>, body: Record<string, unknown>): Promise<AxiosResponse<unknown>> {
    try {
      return await postNotificationJson(url, headers, body);
    }
    catch (error) {
      throw ApplicationError.from(error, { code: 'NOTIFICATION_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
    }
  }

  constructor(private readonly alimtalk: AlimtalkAdapter) {}

  sendAlimtalk(message: AlimtalkMessageDto & { recipient: string }, config?: MessengerConfigDto): Promise<string | undefined> {
    return this.alimtalk.send(message, config);
  }

  // Provider-specific payloads are intentionally dispatched in one place.

  async send(message: MessengerMessage, providerConfig?: MessengerConfigDto): Promise<string | undefined> {
    if (!providerConfig?.enabled) throw new ApplicationError({ code: 'NOTIFICATION_DELIVERY_FAILED', message: `메신저: 발송이 비활성화되어 있습니다.`, status: HttpStatus.BAD_GATEWAY });
    switch (providerConfig.provider) {
      case 'LINE': {
        if (!providerConfig.line?.accessToken) throw new ApplicationError({ code: 'NOTIFICATION_DELIVERY_FAILED', message: `LINE: Access Token이 필요합니다.`, status: HttpStatus.BAD_GATEWAY });
        const result = await this.postProviderJson('https://api.line.me/v2/bot/message/push', { Authorization: `Bearer ${providerConfig.line.accessToken}` }, { to: message.recipient, messages: [{ type: 'text', text: message.body }] });
        return parseMessengerResponse('LINE', result);
      }
      case 'WHATSAPP': {
        if (!providerConfig.whatsapp?.phoneNumberId || !providerConfig.whatsapp.accessToken) throw new ApplicationError({ code: 'NOTIFICATION_DELIVERY_FAILED', message: `WhatsApp: 설정이 완전하지 않습니다.`, status: HttpStatus.BAD_GATEWAY });
        const result = await this.postProviderJson(`https://graph.facebook.com/v20.0/${providerConfig.whatsapp.phoneNumberId}/messages`, { Authorization: `Bearer ${providerConfig.whatsapp.accessToken}` }, { messaging_product: 'whatsapp', to: message.recipient, type: 'text', text: { body: message.body } });
        return parseMessengerResponse('WHATSAPP', result);
      }
      case 'TELEGRAM': {
        if (!providerConfig.telegram?.botToken) throw new ApplicationError({ code: 'NOTIFICATION_DELIVERY_FAILED', message: `Telegram: Bot Token이 필요합니다.`, status: HttpStatus.BAD_GATEWAY });
        const result = await this.postProviderJson(`https://api.telegram.org/bot${providerConfig.telegram.botToken}/sendMessage`, {}, { chat_id: message.recipient || providerConfig.telegram.chatId, text: message.body });
        return parseMessengerResponse('TELEGRAM', result);
      }
      case 'WECHAT': {
        if (!providerConfig.wechat?.appId || !providerConfig.wechat.appSecret) throw new ApplicationError({ code: 'NOTIFICATION_DELIVERY_FAILED', message: `WeChat: 설정이 완전하지 않습니다.`, status: HttpStatus.BAD_GATEWAY });
        try {
          const tokenResponse = await getNotification<{ access_token?: string, errmsg?: string }>(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${encodeURIComponent(providerConfig.wechat.appId)}&secret=${encodeURIComponent(providerConfig.wechat.appSecret)}`);
          const token = tokenResponse.data;
          const errorMessage = token.errmsg ?? `access token 발급에 실패했습니다. HTTP ${tokenResponse.status}`;
          if (tokenResponse.status < 200 || tokenResponse.status >= 300 || !token.access_token) throw ApplicationError.from(new Error(errorMessage), { code: 'NOTIFICATION_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
          const result = await this.postProviderJson(`https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${encodeURIComponent(token.access_token)}`, {}, { touser: message.recipient, msgtype: 'text', text: { content: message.body } });
          return parseMessengerResponse('WECHAT', result);
        }
        catch (error) {
          throw ApplicationError.from(error, { code: 'NOTIFICATION_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
        }
      }
      case 'KAKAO':
        throw new ApplicationError({ code: 'NOTIFICATION_DELIVERY_FAILED', message: `카카오 알림톡: 승인 템플릿 발송은 alimtalk 채널을 사용해야 합니다.`, status: HttpStatus.BAD_GATEWAY });
    }
  }
}
