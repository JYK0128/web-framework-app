import { Injectable } from '@nestjs/common';
import type { PushConfigDto } from '@pkg/shared/server';
import { importPKCS8, SignJWT } from 'jose';

import type { DeliveryResult, PushMessage } from '#/infra/delivery/delivery.interface';

@Injectable()
export class PushAdapter {
  async send(message: PushMessage, providerConfig?: PushConfigDto): Promise<DeliveryResult> {
    if (!providerConfig?.enabled) return { success: false, error: '푸시 발송이 비활성화되어 있습니다.' };
    if (providerConfig.provider === 'NHN_PUSH') {
      const detail = providerConfig.nhn;
      if (!detail?.appKey || !detail.userAccessKeyId || !detail.secretAccessKey) {
        return { success: false, error: 'NHN Push 설정이 완전하지 않습니다.' };
      }
      return this.sendProviderRequest(`https://api-push.cloud.toast.com/push/v2.2/appkeys/${encodeURIComponent(detail.appKey)}/messages`, {
        'X-User-Access-Key-ID': detail.userAccessKeyId,
        'X-Secret-Access-Key': detail.secretAccessKey,
      }, {
        target: { type: 'UID', to: [message.token] },
        content: { default: { title: message.title, body: message.body } },
        messageType: 'AD',
        timeToLiveMinute: 60,
      });
    }

    const detail = providerConfig.fcm;
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
      return this.sendProviderRequest(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(detail.projectId)}/messages:send`, { Authorization: `Bearer ${token.access_token}` }, { message: { token: message.token, notification: { title: message.title, body: message.body } } });
    }
    catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'FCM 발송에 실패했습니다.' };
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
