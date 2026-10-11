import { createHmac, randomBytes } from 'node:crypto';

import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import type { AlimtalkMessageDto, MessengerConfigDto } from '@pkg/shared/server';
import axios from 'axios';

import { SECURITY_CONFIG } from '#/app.config';
import { MessageTemplateService } from '#/core/notification/message-template.service';

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

  constructor(private readonly templates: MessageTemplateService) {}

  async send(message: Message, config?: MessengerConfigDto): Promise<string | undefined> {
    if (!config?.enabled || config.provider !== 'KAKAO') throw new ApplicationError({ code: 'NOTIFICATION_DELIVERY_FAILED', message: `카카오 알림톡: 발송 설정이 비활성화되었거나 유효하지 않습니다.`, status: HttpStatus.BAD_GATEWAY });
    try {
      const rendered = this.prepareMessage(message);
      switch (config.kakao?.agency) {
        case 'NHN_CLOUD': return await this.sendNhn(rendered, config);
        case 'SOLAPI': return await this.sendSolapi(rendered, config);
        case 'ALIGO': return await this.sendAligo(rendered, config);
        default: throw new Error('알림톡 대행사를 선택해 주세요.');
      }
    }
    catch (error) {
      throw ApplicationError.from(error, { code: 'NOTIFICATION_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
    }
  }

  private prepareMessage(message: Message): Message {
    if (!message.templateCode.trim() || !message.content.trim()) throw new Error('승인된 알림톡 템플릿 코드와 본문이 필요합니다.');
    if (!/^\+?\d{8,15}$/.test(message.recipient)) throw new Error('알림톡 수신 전화번호 형식이 올바르지 않습니다.');
    if (message.variables && Object.values(message.variables).some((value) => typeof value !== 'string')) throw new Error('알림톡 변수 값은 문자열이어야 합니다.');
    const content = this.templates.renderAlimtalk(message.content, message.variables);
    if (content.length > 1000) throw new Error('알림톡 본문은 변수 치환 후 1,000자 이하여야 합니다.');
    if ((message.buttons?.length ?? 0) > 5) throw new Error('알림톡 버튼은 최대 5개입니다.');
    const buttons = message.buttons?.map((button) => ({
      ...button,
      name: this.templates.renderAlimtalk(button.name, message.variables),
      linkMo: button.linkMo === undefined ? undefined : this.templates.renderAlimtalk(button.linkMo, message.variables),
      linkPc: button.linkPc === undefined ? undefined : this.templates.renderAlimtalk(button.linkPc, message.variables),
      schemeIos: button.schemeIos === undefined ? undefined : this.templates.renderAlimtalk(button.schemeIos, message.variables),
      schemeAndroid: button.schemeAndroid === undefined ? undefined : this.templates.renderAlimtalk(button.schemeAndroid, message.variables),
    }));
    for (const button of buttons ?? []) {
      if (!button.name.trim() || button.name.length > 28) throw new Error('알림톡 버튼 이름은 1~28자여야 합니다.');
      if (button.type === 'WL' && !button.linkMo?.trim()) throw new Error('웹링크 버튼에는 모바일 링크가 필요합니다.');
      if (button.type === 'AL' && (!button.schemeIos?.trim() || !button.schemeAndroid?.trim())) throw new Error('앱링크 버튼에는 iOS와 Android 링크가 필요합니다.');
    }
    return { ...message, content, buttons };
  }

  private async request(url: string, headers: Record<string, string>, body: string): Promise<ProviderResponse> {
    const response = await this.client.post<ProviderResponse>(url, body, { headers, timeout: SECURITY_CONFIG.integrations.deliveryProviderRequestTimeoutSeconds * 1000 });
    if (response.status < 200 || response.status >= 300) throw new Error(`알림톡 요청 실패: HTTP ${response.status}`);
    return response.data;
  }

  private async sendNhn(message: Message, config: MessengerConfigDto): Promise<string | undefined> {
    const kakao = config.kakao;
    if (!kakao?.nhn?.appKey || !kakao.nhn.secretKey || !kakao.senderKey) throw new Error('NHN 알림톡 AppKey, SecretKey, 발신 프로필 키가 필요합니다.');
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
    if (!kakao?.solapi?.apiKey || !kakao.solapi.apiSecret || (!message.pfId && !kakao.senderKey)) throw new Error('SOLAPI API Key, API Secret, pfId 또는 발신 프로필 키가 필요합니다.');
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
    if (!kakao?.aligo?.userId || !kakao.aligo.apiKey || !kakao.senderKey || !message.sender?.trim() || !message.title?.trim()) throw new Error('알리고 사용자 ID, API Key, 발신 프로필 키, 발신번호, 제목이 필요합니다.');
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
