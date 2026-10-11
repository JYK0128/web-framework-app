import { createHmac, randomBytes } from 'node:crypto';

import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import type { AlimtalkMessageDto, MessengerConfigDto } from '@pkg/shared/server';
import axios from 'axios';

import { SECURITY_CONFIG } from '#/app.config';

type Message = AlimtalkMessageDto & { recipient: string };
type ProviderResponse = {
  header?: { isSuccessful?: boolean, resultMessage?: string }
  message?: { requestId?: string, sendResults?: Array<{ resultCode?: number, resultMessage?: string }> } | string
  failedMessageList?: Array<{ statusMessage?: string }>
  messageList?: Array<{ messageId?: string, statusCode?: string, statusMessage?: string }>
  code?: number
  info?: { mid?: string | number, scnt?: number, fcnt?: number }
  errorMessage?: string
};

@Injectable()
export class AlimtalkAdapter {
  private readonly client = axios.create({ validateStatus: () => true });

  async send(message: Message, config?: MessengerConfigDto): Promise<string | undefined> {
    if (!config?.enabled || config.provider !== 'KAKAO') throw new ApplicationError({ code: 'NOTIFICATION_DELIVERY_FAILED', message: `카카오 알림톡: 발송 설정이 비활성화되었거나 유효하지 않습니다.`, status: HttpStatus.BAD_GATEWAY });
    try {
      const rendered = this.prepareMessage(message);
      switch (config.kakao?.agency) {
        case 'NHN_CLOUD': return await this.sendNhn(rendered, config);
        case 'SOLAPI': return await this.sendSolapi(rendered, config);
        case 'ALIGO': return await this.sendAligo(rendered, config);
        default: throw new ApplicationError({ code: 'NOTIFICATION_DELIVERY_FAILED', status: HttpStatus.SERVICE_UNAVAILABLE });
      }
    }
    catch (error) {
      if (error instanceof ApplicationError) throw error;
      throw ApplicationError.from(error, { code: 'NOTIFICATION_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
    }
  }

  private prepareMessage(message: Message): Message {
    if (!message.templateCode.trim() || !message.content.trim()) throw new ApplicationError({ code: 'BAD_REQUEST', status: HttpStatus.BAD_REQUEST });
    if (!/^\+?\d{8,15}$/.test(message.recipient)) throw new ApplicationError({ code: 'BAD_REQUEST', status: HttpStatus.BAD_REQUEST });
    if (message.variables && Object.values(message.variables).some((value) => typeof value !== 'string')) throw new ApplicationError({ code: 'BAD_REQUEST', status: HttpStatus.BAD_REQUEST });
    const content = this.renderTemplate(message.content, message.variables);
    if (content.length > 1000) throw new ApplicationError({ code: 'BAD_REQUEST', status: HttpStatus.BAD_REQUEST });
    if ((message.buttons?.length ?? 0) > 5) throw new ApplicationError({ code: 'BAD_REQUEST', status: HttpStatus.BAD_REQUEST });
    const buttons = message.buttons?.map((button) => ({
      ...button,
      name: this.renderTemplate(button.name, message.variables),
      linkMo: button.linkMo === undefined ? undefined : this.renderTemplate(button.linkMo, message.variables),
      linkPc: button.linkPc === undefined ? undefined : this.renderTemplate(button.linkPc, message.variables),
      schemeIos: button.schemeIos === undefined ? undefined : this.renderTemplate(button.schemeIos, message.variables),
      schemeAndroid: button.schemeAndroid === undefined ? undefined : this.renderTemplate(button.schemeAndroid, message.variables),
    }));
    for (const button of buttons ?? []) {
      if (!button.name.trim() || button.name.length > 28) throw new ApplicationError({ code: 'BAD_REQUEST', status: HttpStatus.BAD_REQUEST });
      if (button.type === 'WL' && !button.linkMo?.trim()) throw new ApplicationError({ code: 'BAD_REQUEST', status: HttpStatus.BAD_REQUEST });
      if (button.type === 'AL' && (!button.schemeIos?.trim() || !button.schemeAndroid?.trim())) throw new ApplicationError({ code: 'BAD_REQUEST', status: HttpStatus.BAD_REQUEST });
    }
    return { ...message, content, buttons };
  }

  private renderTemplate(template: string, variables: Record<string, string> = {}): string {
    return template.replace(/#\{([^{}]+)\}/g, (_match: string, key: string) => {
      if (!Object.hasOwn(variables, key) || typeof variables[key] !== 'string') throw new ApplicationError({ code: 'BAD_REQUEST', status: HttpStatus.BAD_REQUEST });
      return variables[key];
    });
  }

  private async request(url: string, headers: Record<string, string>, body: string): Promise<ProviderResponse> {
    const response = await this.client.post<ProviderResponse>(url, body, { headers, timeout: SECURITY_CONFIG.integrations.deliveryProviderRequestTimeoutSeconds * 1000 });
    if (response.status < 200 || response.status >= 300) throw ApplicationError.from(new Error(`Alimtalk provider responded with HTTP ${response.status}`), { code: 'NOTIFICATION_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
    return response.data;
  }

  private async sendNhn(message: Message, config: MessengerConfigDto): Promise<string | undefined> {
    const kakao = config.kakao;
    if (!kakao?.nhn?.appKey || !kakao.nhn.secretKey || !kakao.senderKey) throw new ApplicationError({ code: 'NOTIFICATION_DELIVERY_FAILED', status: HttpStatus.SERVICE_UNAVAILABLE });
    const data = await this.request(`https://kakaotalk-bizmessage.api.nhncloudservice.com/alimtalk/v2.2/appkeys/${encodeURIComponent(kakao.nhn.appKey)}/raw-messages`, { 'Content-Type': 'application/json', 'X-Secret-Key': kakao.nhn.secretKey }, JSON.stringify({
      senderKey: kakao.senderKey,
      templateCode: message.templateCode,
      recipientList: [{ recipientNo: message.recipient, content: message.content, buttons: message.buttons?.map((button, index) => ({ ...button, ordering: index + 1 })), resendParameter: { isResend: false } }],
    }));
    const response = typeof data.message === 'object' ? data.message : undefined;
    const sent = response?.sendResults?.[0];
    if (!data.header?.isSuccessful || sent?.resultCode !== 0 || !response?.requestId) {
      const errorMessage = sent?.resultMessage ?? data.header?.resultMessage ?? 'Provider rejected Alimtalk delivery';
      throw ApplicationError.from(new Error(errorMessage), { code: 'NOTIFICATION_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
    }
    return response.requestId;
  }

  private async sendSolapi(message: Message, config: MessengerConfigDto): Promise<string | undefined> {
    const kakao = config.kakao;
    if (!kakao?.solapi?.apiKey || !kakao.solapi.apiSecret || (!message.pfId && !kakao.senderKey)) throw new ApplicationError({ code: 'NOTIFICATION_DELIVERY_FAILED', status: HttpStatus.SERVICE_UNAVAILABLE });
    const date = new Date().toISOString();
    const salt = randomBytes(16).toString('hex');
    const signature = createHmac('sha256', kakao.solapi.apiSecret).update(date + salt).digest('hex');
    const data = await this.request('https://api.solapi.com/messages/v4/send-many/detail', { 'Content-Type': 'application/json', 'Authorization': `HMAC-SHA256 apiKey=${kakao.solapi.apiKey}, date=${date}, salt=${salt}, signature=${signature}` }, JSON.stringify({
      messages: [{
        to: message.recipient,
        type: 'ATA',
        text: message.content,
        kakaoOptions: {
          ...(message.pfId ? { pfId: message.pfId } : { senderKey: kakao.senderKey }),
          templateId: message.templateCode,
          disableSms: true,
          variables: Object.fromEntries(Object.entries(message.variables ?? {}).map(([key, value]) => [`#{${key}}`, value])),
          buttons: message.buttons?.map(({ type, name, ...links }) => ({ buttonType: type, buttonName: name, ...links })),
        },
      }],
      strict: true,
      showMessageList: true,
    }));
    const sent = data.messageList?.[0];
    if (data.failedMessageList?.length || sent?.statusCode !== '2000' || !sent.messageId) {
      const errorMessage = data.failedMessageList?.[0]?.statusMessage ?? sent?.statusMessage ?? data.errorMessage ?? 'Provider rejected Alimtalk delivery';
      throw ApplicationError.from(new Error(errorMessage), { code: 'NOTIFICATION_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
    }
    return sent.messageId;
  }

  private async sendAligo(message: Message, config: MessengerConfigDto): Promise<string | undefined> {
    const kakao = config.kakao;
    if (!kakao?.aligo?.userId || !kakao.aligo.apiKey || !kakao.senderKey || !message.sender?.trim() || !message.title?.trim()) throw new ApplicationError({ code: 'NOTIFICATION_DELIVERY_FAILED', status: HttpStatus.SERVICE_UNAVAILABLE });
    const body = new URLSearchParams({ apikey: kakao.aligo.apiKey, userid: kakao.aligo.userId, senderkey: kakao.senderKey, tpl_code: message.templateCode, sender: message.sender, receiver_1: message.recipient, subject_1: message.title, message_1: message.content, failover: 'N' });
    if (message.buttons?.length) body.set('button_1', JSON.stringify({ button: message.buttons.map(({ type, name, schemeIos, schemeAndroid, ...links }) => ({ name, linkType: type, linkTypeName: { WL: '웹링크', AL: '앱링크', DS: '배송조회', BK: '봇키워드', MD: '메시지전달', AC: '채널 추가' }[type], ...links, linkIos: schemeIos, linkAnd: schemeAndroid })) }));
    const data = await this.request('https://kakaoapi.aligo.in/akv10/alimtalk/send/', { 'Content-Type': 'application/x-www-form-urlencoded' }, body.toString());
    if (data.code !== 0 || !data.info?.mid || data.info.scnt !== 1 || data.info.fcnt !== 0) {
      const errorMessage = typeof data.message === 'string' ? data.message : 'Provider rejected Alimtalk delivery';
      throw ApplicationError.from(new Error(errorMessage), { code: 'NOTIFICATION_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
    }
    return String(data.info.mid);
  }
}
