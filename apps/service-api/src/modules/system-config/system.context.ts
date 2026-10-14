import { HttpStatus, Injectable } from '@nestjs/common';
import { KvStore } from '@pkg/server-core/kv-store/kv-store.service';
import { ApplicationError, z } from '@pkg/shared/common';
import { decrypt, isEncrypted, type NotificationConfigDto } from '@pkg/shared/server';
import { cloneDeep } from 'lodash-es';

import { SERVICE_RUNTIME_CONFIG } from '#/app.config';
import { env } from '#/env';
import { transformNotificationSecrets } from '#/modules/system-config/notification/notification-config-secrets';
import { SERVICE_SYSTEM_CONTEXT_REDIS_KEY } from '#/modules/system-config/system-config.constants';

export const SystemContextSnapshotSchema = z.object({
  webhook: z.object({ enabled: z.boolean(), type: z.enum(['SLACK', 'DISCORD', 'CHANNEL_TALK', 'TEAMS']), cooldownMinutes: z.number().int().min(1).max(1440), webhookUrl: z.string() }).superRefine((webhook, ctx) => {
    if (!webhook.enabled) return;
    try {
      const url = new URL(webhook.webhookUrl.trim());
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported protocol');
    }
    catch {
      ctx.addIssue({ code: 'custom', path: ['webhookUrl'], message: '활성화된 웹훅 URL이 올바르지 않습니다.' });
    }
  }),
  notification: z.record(z.string(), z.unknown()).nullable(),
  oauth: z.record(z.string(), z.unknown()).nullable(),
});

export type SystemContextSnapshot = z.infer<typeof SystemContextSnapshotSchema>;
export type WebhookConfig = SystemContextSnapshot['webhook'];

@Injectable()
export class SystemContext {
  private cached: { value: SystemContextSnapshot, expiresAt: number } | null = null;

  constructor(private readonly kvStore: KvStore) {}

  invalidateCache(): void {
    this.cached = null;
  }

  async getConfig(): Promise<SystemContextSnapshot> {
    if (this.cached && this.cached.expiresAt > Date.now()) return this.cached.value;

    const stored = await this.kvStore.get<unknown>(SERVICE_SYSTEM_CONTEXT_REDIS_KEY);
    const result = SystemContextSnapshotSchema.safeParse(stored);
    if (!result.success) {
      throw new ApplicationError({ code: stored ? 'SYSTEM_CONFIG_INVALID' : 'SYSTEM_CONFIG_UNAVAILABLE', status: stored ? HttpStatus.BAD_GATEWAY : HttpStatus.SERVICE_UNAVAILABLE });
    }
    const value = cloneDeep(result.data);
    try {
      if (value.notification) {
        transformNotificationSecrets(value.notification, (secret, key) => isEncrypted(secret) ? decrypt(secret, key) : secret);
      }
      if (value.oauth) {
        decryptOAuthSecrets(value.oauth);
      }
    }
    catch (error) {
      throw ApplicationError.from(error, { code: 'SYSTEM_CONFIG_INVALID', status: HttpStatus.SERVICE_UNAVAILABLE });
    }
    this.cached = { value, expiresAt: Date.now() + SERVICE_RUNTIME_CONFIG.systemConfigCacheTtlMilliseconds };
    return this.cached.value;
  }

  async getNotificationConfig(): Promise<NotificationConfigDto | null> {
    return (await this.getConfig()).notification as NotificationConfigDto | null;
  }

  async getOAuthConfig(): Promise<Record<string, unknown>> {
    return (await this.getConfig()).oauth ?? {};
  }
}

function decryptOAuthSecrets(oauth: Record<string, unknown>): void {
  for (const provider of Object.values(oauth)) {
    if (!provider || typeof provider !== 'object' || Array.isArray(provider)) continue;
    const config = provider as Record<string, unknown>;
    if (typeof config.clientSecret === 'string' && isEncrypted(config.clientSecret)) {
      config.clientSecret = decrypt(config.clientSecret, env.OAUTH_ENCRYPTION_KEY);
    }
  }
}
