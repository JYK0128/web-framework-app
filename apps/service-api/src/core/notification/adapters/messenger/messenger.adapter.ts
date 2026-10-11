import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';
import type { AlimtalkMessageDto, MessengerConfigDto } from '@pkg/shared/server';

import { SECURITY_CONFIG } from '#/app.config';
import { sendProviderRequest } from '#/core/notification/adapters/provider-request';
import type { MessengerMessage } from '#/core/notification/notification.interface';

import { AlimtalkAdapter } from './alimtalk.adapter';

@Injectable()
export class MessengerAdapter {
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
        return sendProviderRequest('LINE', 'https://api.line.me/v2/bot/message/push', { Authorization: `Bearer ${providerConfig.line.accessToken}` }, { to: message.recipient, messages: [{ type: 'text', text: message.body }] });
      }
      case 'WHATSAPP': {
        if (!providerConfig.whatsapp?.phoneNumberId || !providerConfig.whatsapp.accessToken) throw new ApplicationError({ code: 'NOTIFICATION_DELIVERY_FAILED', message: `WhatsApp: 설정이 완전하지 않습니다.`, status: HttpStatus.BAD_GATEWAY });
        return sendProviderRequest('WHATSAPP', `https://graph.facebook.com/v20.0/${providerConfig.whatsapp.phoneNumberId}/messages`, { Authorization: `Bearer ${providerConfig.whatsapp.accessToken}` }, { messaging_product: 'whatsapp', to: message.recipient, type: 'text', text: { body: message.body } });
      }
      case 'TELEGRAM': {
        if (!providerConfig.telegram?.botToken) throw new ApplicationError({ code: 'NOTIFICATION_DELIVERY_FAILED', message: `Telegram: Bot Token이 필요합니다.`, status: HttpStatus.BAD_GATEWAY });
        return sendProviderRequest('TELEGRAM', `https://api.telegram.org/bot${providerConfig.telegram.botToken}/sendMessage`, {}, { chat_id: message.recipient || providerConfig.telegram.chatId, text: message.body });
      }
      case 'WECHAT': {
        if (!providerConfig.wechat?.appId || !providerConfig.wechat.appSecret) throw new ApplicationError({ code: 'NOTIFICATION_DELIVERY_FAILED', message: `WeChat: 설정이 완전하지 않습니다.`, status: HttpStatus.BAD_GATEWAY });
        try {
          const tokenResponse = await fetch(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${encodeURIComponent(providerConfig.wechat.appId)}&secret=${encodeURIComponent(providerConfig.wechat.appSecret)}`, { signal: AbortSignal.timeout(TimeUtil.ms.second(SECURITY_CONFIG.integrations.deliveryProviderRequestTimeoutSeconds)) });
          const token = await tokenResponse.json() as { access_token?: string, errmsg?: string };
          const errorMessage = token.errmsg ?? `access token 발급에 실패했습니다. HTTP ${tokenResponse.status}`;
          if (!tokenResponse.ok || !token.access_token) throw ApplicationError.from(new Error(errorMessage), { code: 'NOTIFICATION_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
          return sendProviderRequest('WECHAT', `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${encodeURIComponent(token.access_token)}`, {}, { touser: message.recipient, msgtype: 'text', text: { content: message.body } });
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
