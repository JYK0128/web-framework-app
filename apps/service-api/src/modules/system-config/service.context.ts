import { HttpStatus, Injectable } from '@nestjs/common';
import { KvStore } from '@pkg/server-core/kv-store';
import { ApplicationError, z } from '@pkg/shared/common';
import { cloneDeep } from 'lodash-es';

import { SERVICE_RUNTIME_CONFIG } from '~/app.config';
import { SERVICE_CONTEXT_REDIS_KEY } from '~/modules/system-config/system-config.constants';

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const END_OF_DAY_TIME_PATTERN = /^(?:(?:[01]\d|2[0-3]):[0-5]\d|24:00)$/;
const MaintenanceSchema = z.object({
  temporary: z.object({ enabled: z.boolean(), message: z.string(), startAt: z.iso.datetime().nullable(), endAt: z.iso.datetime().nullable() }),
  recurring: z.object({ enabled: z.boolean(), message: z.string(), daysOfWeek: z.array(z.number().int().min(0).max(6)), startTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/), endTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/) }),
}).superRefine((maintenance, ctx) => {
  const { temporary, recurring } = maintenance;
  if (temporary.startAt && temporary.endAt && Date.parse(temporary.endAt) <= Date.parse(temporary.startAt)) {
    ctx.addIssue({ code: 'custom', path: ['temporary', 'endAt'], message: '임시 점검 종료 시각은 시작 시각 이후여야 합니다.' });
  }
  if (recurring.enabled && recurring.startTime === recurring.endTime) {
    ctx.addIssue({ code: 'custom', path: ['recurring', 'endTime'], message: '정기 점검 시작과 종료 시각은 달라야 합니다.' });
  }
});

export const ServiceContextSnapshotSchema = z.object({
  operation: z.object({
    hours: z.object({ start: z.string().regex(TIME_PATTERN), end: z.string().regex(END_OF_DAY_TIME_PATTERN), openDays: z.array(z.number().int().min(0).max(6)), lunchBreak: z.object({ enabled: z.boolean(), start: z.string().regex(TIME_PATTERN), end: z.string().regex(TIME_PATTERN) }) }),
    holidays: z.array(z.object({ date: z.iso.date() })),
    messages: z.object({ lunch: z.string(), offHours: z.string(), holiday: z.string() }),
  }),
  maintenance: MaintenanceSchema,
  inquiry: z.object({ customerGreeting: z.string().trim().min(1).max(500), offlineReplyMessage: z.string().trim().min(1).max(500), unansweredThresholdMinutes: z.number().int().min(1).max(120), autoCloseHours: z.number().int().min(1).max(720) }),
}).superRefine((config, ctx) => {
  if (config.operation.hours.openDays.length > 0 && config.operation.hours.start === config.operation.hours.end) {
    ctx.addIssue({ code: 'custom', path: ['operation', 'hours', 'end'], message: '운영 시작과 종료 시각은 달라야 합니다.' });
  }
  if (config.operation.hours.lunchBreak.enabled && config.operation.hours.lunchBreak.start === config.operation.hours.lunchBreak.end) {
    ctx.addIssue({ code: 'custom', path: ['operation', 'hours', 'lunchBreak', 'end'], message: '휴게시간 시작과 종료 시각은 달라야 합니다.' });
  }
});

export type ServiceContextSnapshot = z.infer<typeof ServiceContextSnapshotSchema>;

@Injectable()
export class ServiceContext {
  private cached: { value: ServiceContextSnapshot, expiresAt: number } | null = null;

  constructor(private readonly kvStore: KvStore) {}

  invalidateCache(): void { this.cached = null; }

  async getConfig(): Promise<ServiceContextSnapshot> {
    if (this.cached && this.cached.expiresAt > Date.now()) return this.cached.value;
    const stored = await this.kvStore.get<unknown>(SERVICE_CONTEXT_REDIS_KEY);
    const result = ServiceContextSnapshotSchema.safeParse(stored);
    if (!result.success) {
      throw new ApplicationError({ code: stored ? 'SYSTEM_CONFIG_INVALID' : 'SYSTEM_CONFIG_UNAVAILABLE', status: stored ? HttpStatus.BAD_GATEWAY : HttpStatus.SERVICE_UNAVAILABLE });
    }
    const value = cloneDeep(result.data);
    this.cached = { value, expiresAt: Date.now() + SERVICE_RUNTIME_CONFIG.systemConfigCacheTtlMilliseconds };
    return this.cached.value;
  }
}
