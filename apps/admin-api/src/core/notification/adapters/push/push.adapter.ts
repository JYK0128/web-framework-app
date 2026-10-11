import { createHash } from 'node:crypto';

import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';
import type { PushConfigDto } from '@pkg/shared/server';
import { importPKCS8, SignJWT } from 'jose';
import { z } from 'zod';

import { SECURITY_CONFIG } from '#/app.config';
import { postProviderJson, type ProviderHttpResponse } from '#/core/notification/adapters/provider-http';
import type { PushMessage } from '#/core/notification/notification.interface';

const recordSchema = z.record(z.string(), z.unknown());

function parseNhnPushResponse(response: ProviderHttpResponse): string | undefined {
  const parsed = recordSchema.safeParse(response.body);
  if (!parsed.success) throw new ApplicationError({ code: 'NOTIFICATION_DELIVERY_FAILED', message: `NHN Push: Invalid provider response`, status: HttpStatus.BAD_GATEWAY });

  const data = parsed.data;
  const header = recordSchema.safeParse(data.header).data;
  const body = recordSchema.safeParse(data.body).data;
  const bodyData = recordSchema.safeParse(body?.data).data;
  const result = recordSchema.safeParse(data.result).data;
  const results = z.array(recordSchema).safeParse(bodyData?.sendResultList).data;
  const recipientsAccepted = bodyData?.sendResultList === undefined
    || (results !== undefined && results.length > 0 && results.every((item) => item.resultCode === 0));
  const accepted = header?.isSuccessful === true && bodyData?.statusCode !== '3' && recipientsAccepted;
  const failedRecipient = results?.find((item) => item.resultCode !== 0);
  const rawId = data.messageId ?? data.name ?? bodyData?.requestId ?? body?.requestId ?? result?.message_id;
  const rawError = failedRecipient?.resultMessage ?? (header?.isSuccessful === false ? header.resultMessage : undefined) ?? data.errorMessage ?? data.message ?? data.description ?? data.errmsg;

  const errorMessage = typeof rawError === 'string' ? rawError : `Provider rejected request (HTTP ${response.status})`;
  if (!response.ok || !accepted) throw ApplicationError.from(new Error(errorMessage), { code: 'NOTIFICATION_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
  return typeof rawId === 'string' || typeof rawId === 'number' ? String(rawId) : undefined;
}

function parseFcmResponse(response: ProviderHttpResponse): string | undefined {
  const parsed = recordSchema.safeParse(response.body);
  if (!parsed.success) throw new ApplicationError({ code: 'NOTIFICATION_DELIVERY_FAILED', message: `FCM Push: Invalid provider response`, status: HttpStatus.BAD_GATEWAY });

  const data = parsed.data;
  const rawError = [data.error, data.message, data.description, data.errmsg].find((value): value is string => typeof value === 'string');
  const errorMessage = rawError ?? `Provider rejected request (HTTP ${response.status})`;
  if (!response.ok || typeof data.name !== 'string' || data.error) throw ApplicationError.from(new Error(errorMessage), { code: 'NOTIFICATION_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
  return data.name;
}

@Injectable()
export class PushAdapter {
  private cachedToken?: { fingerprint: string, token: string, expiresAt: number };
  private pendingToken?: { fingerprint: string, promise: Promise<string> };

  async send(message: PushMessage, providerConfig?: PushConfigDto): Promise<string | undefined> {
    if (!providerConfig?.enabled) throw new ApplicationError({ code: 'NOTIFICATION_DELIVERY_FAILED', message: `푸시: 발송이 비활성화되어 있습니다.`, status: HttpStatus.BAD_GATEWAY });
    const ttlSeconds = TimeUtil.s.minute(SECURITY_CONFIG.integrations.pushMessageTtlMinutes);
    if (providerConfig.provider === 'NHN_PUSH') {
      const detail = providerConfig.nhn;
      if (!detail?.appKey || !detail.userAccessKeyId || !detail.secretAccessKey) {
        throw new ApplicationError({ code: 'NOTIFICATION_DELIVERY_FAILED', message: `NHN Push: 설정이 완전하지 않습니다.`, status: HttpStatus.BAD_GATEWAY });
      }
      const result = await postProviderJson(`https://api-push.cloud.toast.com/push/v2.2/appkeys/${encodeURIComponent(detail.appKey)}/messages`, {
        'X-User-Access-Key-ID': detail.userAccessKeyId,
        'X-Secret-Access-Key': detail.secretAccessKey,
      }, {
        target: { type: 'UID', to: [message.token] },
        content: { default: { title: message.title, body: message.body } },
        messageType: 'AD',
        timeToLiveMinute: SECURITY_CONFIG.integrations.pushMessageTtlMinutes,
      });
      return parseNhnPushResponse(result.response);
    }

    const detail = providerConfig.fcm;
    if (!detail?.projectId || !detail.clientEmail || !detail.privateKey) {
      throw new ApplicationError({ code: 'NOTIFICATION_DELIVERY_FAILED', message: `FCM Push: projectId, clientEmail, privateKey 설정이 필요합니다.`, status: HttpStatus.BAD_GATEWAY });
    }
    try {
      const accessToken = await this.getAccessToken({ projectId: detail.projectId, clientEmail: detail.clientEmail, privateKey: detail.privateKey });
      const result = await postProviderJson(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(detail.projectId)}/messages:send`, { Authorization: `Bearer ${accessToken}` }, {
        message: {
          token: message.token,
          notification: { title: message.title, body: message.body },
          android: { ttl: `${ttlSeconds}s` },
          webpush: { headers: { TTL: String(ttlSeconds) } },
          apns: { headers: { 'apns-expiration': String(Math.floor(Date.now() / 1000) + ttlSeconds) } },
        },
      });
      return parseFcmResponse(result.response);
    }
    catch (error) {
      throw ApplicationError.from(error, { code: 'NOTIFICATION_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
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
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
        signal: AbortSignal.timeout(TimeUtil.ms.second(SECURITY_CONFIG.integrations.deliveryProviderRequestTimeoutSeconds)),
      });
      const token = z.object({ access_token: z.string().min(1), expires_in: z.number().positive() }).parse(await tokenResponse.json());
      if (!tokenResponse.ok) throw new Error('FCM access token 발급에 실패했습니다.');
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
