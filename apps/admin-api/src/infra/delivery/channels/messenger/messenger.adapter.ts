import { Injectable } from '@nestjs/common';
import type { MessengerConfigDto } from '@pkg/shared/server';

import type { DeliveryResult, MessengerMessage } from '#/infra/delivery/delivery.interface';

@Injectable()
export class MessengerAdapter {
  async send(message: MessengerMessage, providerConfig?: MessengerConfigDto): Promise<DeliveryResult> {
    if (!providerConfig?.enabled) return { success: false, error: '메신저 발송이 비활성화되어 있습니다.' };
    switch (providerConfig.provider) {
      case 'LINE': {
        if (!providerConfig.line?.accessToken) return { success: false, error: 'LINE Access Token이 필요합니다.' };
        return this.sendProviderRequest('https://api.line.me/v2/bot/message/push', { Authorization: `Bearer ${providerConfig.line.accessToken}` }, { to: message.recipient, messages: [{ type: 'text', text: message.body }] });
      }
      case 'WHATSAPP': {
        if (!providerConfig.whatsapp?.phoneNumberId || !providerConfig.whatsapp.accessToken) return { success: false, error: 'WhatsApp 설정이 완전하지 않습니다.' };
        return this.sendProviderRequest(`https://graph.facebook.com/v20.0/${providerConfig.whatsapp.phoneNumberId}/messages`, { Authorization: `Bearer ${providerConfig.whatsapp.accessToken}` }, { messaging_product: 'whatsapp', to: message.recipient, type: 'text', text: { body: message.body } });
      }
      case 'TELEGRAM': {
        if (!providerConfig.telegram?.botToken) return { success: false, error: 'Telegram Bot Token이 필요합니다.' };
        return this.sendProviderRequest(`https://api.telegram.org/bot${providerConfig.telegram.botToken}/sendMessage`, {}, { chat_id: message.recipient || providerConfig.telegram.chatId, text: message.body });
      }
      case 'WECHAT': {
        if (!providerConfig.wechat?.appId || !providerConfig.wechat.appSecret) return { success: false, error: 'WeChat 설정이 완전하지 않습니다.' };
        const tokenResponse = await fetch(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${encodeURIComponent(providerConfig.wechat.appId)}&secret=${encodeURIComponent(providerConfig.wechat.appSecret)}`);
        const token = await tokenResponse.json() as { access_token?: string, errmsg?: string };
        if (!token.access_token) return { success: false, error: token.errmsg ?? 'WeChat access token 발급에 실패했습니다.' };
        return this.sendProviderRequest(`https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${token.access_token}`, {}, { touser: message.recipient, msgtype: 'text', text: { content: message.body } });
      }
      case 'KAKAO':
        return { success: false, error: '카카오 알림톡은 템플릿 코드가 필요하므로 일반 메신저 테스트 대상이 아닙니다.' };
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
