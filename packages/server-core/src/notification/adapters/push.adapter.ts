import { createHash } from 'node:crypto';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';
import axios from 'axios';
import { importPKCS8, SignJWT } from 'jose';
import { z } from 'zod';

import type { PushConfigDto } from '#notification/dto';
import { NOTIFICATION_MODULE_OPTIONS, type NotificationModuleOptions, type PushMessage } from '#notification/notification.interface';
import { type NotificationProvider, parseNotificationResult } from '#notification/provider-response';

@Injectable()
export class PushAdapter {
  constructor(@Inject(NOTIFICATION_MODULE_OPTIONS) private readonly options: NotificationModuleOptions) {}

  private async sendProviderRequest(provider: NotificationProvider, url: string, headers: Record<string, string>, body: Record<string, unknown>): Promise<string | undefined> {
    try {
      const response = await this.client.post<unknown>(url, body, { headers, timeout: TimeUtil.ms.second(this.options.requestTimeoutSeconds) });
      return parseNotificationResult(provider, { ok: response.status >= 200 && response.status < 300, status: response.status, body: response.data });
    }
    catch (error) {
      throw ApplicationError.from(error, { code: 'NOTIFICATION_SEND_FAILED', status: HttpStatus.BAD_GATEWAY });
    }
  }

  private readonly client = axios.create({ validateStatus: () => true });

  private cachedToken?: { fingerprint: string, token: string, expiresAt: number };
  private pendingToken?: { fingerprint: string, promise: Promise<string> };

  async send(message: PushMessage, providerConfig?: PushConfigDto): Promise<string | undefined> {
    if (!providerConfig?.enabled) throw new ApplicationError({ code: 'NOTIFICATION_SEND_FAILED', message: `푸시: 발송이 비활성화되어 있습니다.`, status: HttpStatus.BAD_GATEWAY });
    const ttlSeconds = TimeUtil.s.minute(this.options.pushMessageTtlMinutes);
    if (providerConfig.provider === 'NHN_PUSH') {
      const detail = providerConfig.nhn;
      if (!detail?.appKey || !detail.userAccessKeyId || !detail.secretAccessKey) {
        throw new ApplicationError({ code: 'NOTIFICATION_SEND_FAILED', message: `NHN Push: 설정이 완전하지 않습니다.`, status: HttpStatus.BAD_GATEWAY });
      }
      return this.sendProviderRequest('NHN', `https://api-push.cloud.toast.com/push/v2.2/appkeys/${encodeURIComponent(detail.appKey)}/messages`, {
        'X-User-Access-Key-ID': detail.userAccessKeyId,
        'X-Secret-Access-Key': detail.secretAccessKey,
      }, {
        target: { type: 'UID', to: [message.token] },
        content: { default: { title: message.title, body: message.body } },
        messageType: 'AD',
        timeToLiveMinute: this.options.pushMessageTtlMinutes,
      });
    }

    const detail = providerConfig.fcm;
    if (!detail?.projectId || !detail.clientEmail || !detail.privateKey) {
      throw new ApplicationError({ code: 'NOTIFICATION_SEND_FAILED', message: `FCM Push: projectId, clientEmail, privateKey 설정이 필요합니다.`, status: HttpStatus.BAD_GATEWAY });
    }
    try {
      const accessToken = await this.getAccessToken({ projectId: detail.projectId, clientEmail: detail.clientEmail, privateKey: detail.privateKey });
      return this.sendProviderRequest('FCM', `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(detail.projectId)}/messages:send`, { Authorization: `Bearer ${accessToken}` }, {
        message: {
          token: message.token,
          notification: { title: message.title, body: message.body },
          android: { ttl: `${ttlSeconds}s` },
          webpush: { headers: { TTL: String(ttlSeconds) } },
          apns: { headers: { 'apns-expiration': String(Math.floor(Date.now() / 1000) + ttlSeconds) } },
        },
      });
    }
    catch (error) {
      throw ApplicationError.from(error, { code: 'NOTIFICATION_SEND_FAILED', status: HttpStatus.BAD_GATEWAY });
    }
  }

  private async getAccessToken(detail: { projectId: string, clientEmail: string, privateKey: string }): Promise<string> {
    const fingerprint = createHash('sha256').update(JSON.stringify([detail.projectId, detail.clientEmail, detail.privateKey])).digest('hex');
    if (this.cachedToken?.fingerprint === fingerprint && this.cachedToken.expiresAt > Date.now()) return this.cachedToken.token;
    if (this.pendingToken?.fingerprint === fingerprint) return this.pendingToken.promise;
    const promise = (async () => {
      const key = await importPKCS8(detail.privateKey.replace(/\\n/g, '\n'), 'RS256');
      const assertion = await new SignJWT({ scope: 'https://www.googleapis.com/auth/firebase.messaging' })
        .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
        .setIssuer(detail.clientEmail)
        .setAudience('https://oauth2.googleapis.com/token')
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(key);
      const tokenResponse = await this.client.post<unknown>('https://oauth2.googleapis.com/token', new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }), {
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        timeout: TimeUtil.ms.second(this.options.requestTimeoutSeconds),
      });
      const token = z.object({ access_token: z.string().min(1), expires_in: z.number().positive() }).parse(tokenResponse.data);
      if (tokenResponse.status < 200 || tokenResponse.status >= 300) throw new Error('FCM access token 발급에 실패했습니다.');
      this.cachedToken = { fingerprint, token: token.access_token, expiresAt: Date.now() + Math.max(0, token.expires_in - 60) * 1000 };
      return token.access_token;
    })();
    this.pendingToken = { fingerprint, promise };
    try {
      return await promise;
    }
    finally {
      if (this.pendingToken?.promise === promise) this.pendingToken = undefined;
    }
  }
}
