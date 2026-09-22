import { createHmac, randomBytes } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { importPKCS8, SignJWT } from 'jose';

import type { MessengerConfigDto, PushConfigDto, SmsConfigDto } from '#/modules/system-config/dto/notification-config.dto';

import type { MessengerMessage, NotificationResult, PushMessage, SmsMessage } from './notification.interface';

@Injectable()
export class ProviderNotificationService {
  async sendSms(message: SmsMessage, config?: SmsConfigDto): Promise<NotificationResult> {
    if (!config?.enabled) return { success: false, error: 'SMS 발송이 비활성화되어 있습니다.' };
    switch (config.provider) {
      case 'SOLAPI_SMS': return this.sendSolapiSms(message, config.solapi);
      case 'ALIGO_SMS': return this.sendAligoSms(message, config.aligo);
      case 'NHN_SMS': return this.sendNhnSms(message, config.nhn);
    }
  }

  async sendPush(message: PushMessage, config?: PushConfigDto): Promise<NotificationResult> {
    if (!config?.enabled) return { success: false, error: '푸시 발송이 비활성화되어 있습니다.' };
    if (config.provider === 'NHN_PUSH') {
      const detail = config.nhn;
      if (!detail?.appKey || !detail.userAccessKeyId || !detail.secretAccessKey) {
        return { success: false, error: 'NHN Push 설정이 완전하지 않습니다.' };
      }
      return this.postJson(`https://api-push.cloud.toast.com/push/v2.2/appkeys/${encodeURIComponent(detail.appKey)}/messages`, {
        'X-User-Access-Key-ID': detail.userAccessKeyId,
        'X-Secret-Access-Key': detail.secretAccessKey,
      }, {
        target: { type: 'UID', to: [message.token] },
        content: { default: { title: message.title, body: message.body } },
        messageType: 'AD',
        timeToLiveMinute: 60,
      });
    }
    const detail = config.fcm;
    if (!detail?.projectId || !detail.clientEmail || !detail.privateKey) {
      return { success: false, error: 'FCM projectId, clientEmail, privateKey 설정이 필요합니다.' };
    }
    try {
      const key = await importPKCS8(detail.privateKey.replace(/\\n/g, '\n'), 'RS256');
      const assertion = await new SignJWT({ scope: 'https://www.googleapis.com/auth/firebase.messaging' })
        .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
        .setIssuer(detail.clientEmail)
        .setAudience('https://oauth2.googleapis.com/token')
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(key);
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
      });
      const token = await tokenResponse.json() as { access_token?: string, error_description?: string };
      if (!tokenResponse.ok || !token.access_token) return { success: false, error: token.error_description ?? 'FCM access token 발급에 실패했습니다.' };
      return this.postJson(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(detail.projectId)}/messages:send`, { Authorization: `Bearer ${token.access_token}` }, { message: { token: message.token, notification: { title: message.title, body: message.body } } });
    }
    catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'FCM 발송에 실패했습니다.' };
    }
  }

  async sendMessenger(message: MessengerMessage, config?: MessengerConfigDto): Promise<NotificationResult> {
    if (!config?.enabled) return { success: false, error: '메신저 발송이 비활성화되어 있습니다.' };
    switch (config.provider) {
      case 'LINE': {
        if (!config.line?.accessToken) return { success: false, error: 'LINE Access Token이 필요합니다.' };
        return this.postJson('https://api.line.me/v2/bot/message/push', { Authorization: `Bearer ${config.line.accessToken}` }, { to: message.recipient, messages: [{ type: 'text', text: message.body }] });
      }
      case 'WHATSAPP': {
        if (!config.whatsapp?.phoneNumberId || !config.whatsapp.accessToken) return { success: false, error: 'WhatsApp 설정이 완전하지 않습니다.' };
        return this.postJson(`https://graph.facebook.com/v20.0/${config.whatsapp.phoneNumberId}/messages`, { Authorization: `Bearer ${config.whatsapp.accessToken}` }, { messaging_product: 'whatsapp', to: message.recipient, type: 'text', text: { body: message.body } });
      }
      case 'TELEGRAM': {
        if (!config.telegram?.botToken) return { success: false, error: 'Telegram Bot Token이 필요합니다.' };
        return this.postJson(`https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`, {}, { chat_id: message.recipient || config.telegram.chatId, text: message.body });
      }
      case 'WECHAT': {
        if (!config.wechat?.appId || !config.wechat.appSecret) return { success: false, error: 'WeChat 설정이 완전하지 않습니다.' };
        const tokenResponse = await fetch(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${encodeURIComponent(config.wechat.appId)}&secret=${encodeURIComponent(config.wechat.appSecret)}`);
        const token = await tokenResponse.json() as { access_token?: string, errmsg?: string };
        if (!token.access_token) return { success: false, error: token.errmsg ?? 'WeChat access token 발급에 실패했습니다.' };
        return this.postJson(`https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${token.access_token}`, {}, { touser: message.recipient, msgtype: 'text', text: { content: message.body } });
      }
      case 'KAKAO':
        return { success: false, error: '카카오 알림톡은 템플릿 코드가 필요하므로 일반 메신저 테스트 대상이 아닙니다.' };
    }
  }

  private async sendNhnSms(message: SmsMessage, config?: SmsConfigDto['nhn']): Promise<NotificationResult> {
    if (!config?.appKey || !config.secretKey || !(message.from ?? config.senderPhone)) return { success: false, error: 'NHN SMS 설정과 발신번호가 필요합니다.' };
    const sender = message.from ?? config.senderPhone!;
    return this.postJson(`https://api-sms.cloud.toast.com/sms/v3.0/appKeys/${encodeURIComponent(config.appKey)}/sender/sms`, { 'X-Secret-Key': config.secretKey }, { body: message.body, sendNo: sender.replace(/\D/g, ''), recipientList: [{ recipientNo: message.to.replace(/\D/g, '') }] });
  }

  private async sendSolapiSms(message: SmsMessage, config?: SmsConfigDto['solapi']): Promise<NotificationResult> {
    if (!config?.apiKey || !config.apiSecret || !(message.from ?? config.senderPhone)) return { success: false, error: 'Solapi SMS 설정과 발신번호가 필요합니다.' };
    const dateTime = new Date().toISOString().split('.')[0] + 'Z';
    const salt = randomBytes(16).toString('hex');
    const signature = createHmac('sha256', config.apiSecret).update(dateTime + salt).digest('hex');
    const sender = message.from ?? config.senderPhone!;
    return this.postJson('https://api.solapi.com/messages/v4/send', { Authorization: `HMAC-SHA256 apiKey=${config.apiKey}, date=${dateTime}, salt=${salt}, signature=${signature}` }, { message: { to: message.to.replace(/\D/g, ''), from: sender.replace(/\D/g, ''), text: message.body } });
  }

  private async sendAligoSms(message: SmsMessage, config?: SmsConfigDto['aligo']): Promise<NotificationResult> {
    if (!config?.userId || !config.apiKey || !(message.from ?? config.sender)) return { success: false, error: 'Aligo SMS 설정과 발신번호가 필요합니다.' };
    const sender = message.from ?? config.sender!;
    const body = new URLSearchParams({ key: config.apiKey, user_id: config.userId, sender: sender.replace(/\D/g, ''), receiver: message.to.replace(/\D/g, ''), msg: message.body });
    try {
      const response = await fetch('https://apis.aligo.in/send/', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body });
      const result = await response.json() as { result_code?: string | number, message?: string, msg_id?: string | number };
      return response.ok && String(result.result_code) === '1' ? { success: true, messageId: String(result.msg_id ?? '') } : { success: false, error: result.message ?? `HTTP ${response.status}` };
    }
    catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Aligo SMS 발송에 실패했습니다.' }; }
  }

  private async postJson(url: string, auth: Record<string, string>, body: Record<string, unknown>): Promise<NotificationResult> {
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
    catch (error) { return { success: false, error: error instanceof Error ? error.message : '외부 provider 호출에 실패했습니다.' }; }
  }
}
