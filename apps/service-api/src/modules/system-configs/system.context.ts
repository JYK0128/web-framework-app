import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError, z } from '@pkg/shared/common';

import { KvStore } from '#/infra/kv-store/kv-store.service';
import { SERVICE_SYSTEM_CONFIGS_REDIS_KEY } from '#/modules/system-configs/system-config.constants';

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$|^24:00$/;
const MaintenanceSchema = z.object({
  temporary: z.object({
    enabled: z.boolean(),
    message: z.string(),
    startAt: z.iso.datetime().nullable(),
    endAt: z.iso.datetime().nullable(),
  }),
  recurring: z.object({
    enabled: z.boolean(),
    message: z.string(),
    daysOfWeek: z.array(z.number().int().min(0).max(6)),
    startTime: z.string().regex(TIME_PATTERN),
    endTime: z.string().regex(TIME_PATTERN),
  }),
});
export const SystemConfigSnapshotSchema = z.object({
  operation: z.object({
    hours: z.object({
      start: z.string().regex(TIME_PATTERN),
      end: z.string().regex(TIME_PATTERN),
      openDays: z.array(z.number().int().min(0).max(6)),
      lunchBreak: z.object({ enabled: z.boolean(), start: z.string().regex(TIME_PATTERN), end: z.string().regex(TIME_PATTERN) }),
    }),
    holidays: z.array(z.object({ date: z.iso.date() })),
    messages: z.object({ lunch: z.string(), offHours: z.string(), holiday: z.string() }),
  }),
  maintenance: MaintenanceSchema,
  inquiry: z.object({
    unansweredThresholdMinutes: z.number().int().min(1).max(120),
    autoCloseHours: z.number().int().min(1).max(720),
  }),
  webhook: z.object({
    enabled: z.boolean(),
    type: z.enum(['SLACK', 'DISCORD', 'CHANNEL_TALK', 'TEAMS']),
    cooldownMinutes: z.number().int().min(1).max(1440),
    webhookUrl: z.string(),
  }),
});

export type SystemConfigSnapshot = z.infer<typeof SystemConfigSnapshotSchema>;
export type WebhookConfig = SystemConfigSnapshot['webhook'];

const CACHE_TTL_MS = 5_000;

@Injectable()
export class SystemContext {
  private cached: { value: SystemConfigSnapshot, expiresAt: number } | null = null;

  constructor(private readonly kvStore: KvStore) {}

  async getConfig(): Promise<SystemConfigSnapshot> {
    if (this.cached && this.cached.expiresAt > Date.now()) return this.cached.value;

    const value = await this.kvStore.get<unknown>(SERVICE_SYSTEM_CONFIGS_REDIS_KEY);
    const result = SystemConfigSnapshotSchema.safeParse(value);
    if (!result.success) {
      throw new ApplicationError({
        code: value ? 'SYSTEM_CONFIG_INVALID' : 'SYSTEM_CONFIG_UNAVAILABLE',
        status: value ? HttpStatus.BAD_GATEWAY : HttpStatus.SERVICE_UNAVAILABLE,
        message: '시스템 설정을 확인할 수 없습니다.',
      });
    }
    this.cached = { value: result.data, expiresAt: Date.now() + CACHE_TTL_MS };
    return result.data;
  }

  async getPublicConfig(): Promise<Pick<SystemConfigSnapshot, 'operation' | 'maintenance'>> {
    const { operation, maintenance } = await this.getConfig();
    return { operation, maintenance };
  }
}
