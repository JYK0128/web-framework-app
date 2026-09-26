import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError, DEFAULT_TIMEZONE, SYSTEM_CONFIGS_REDIS_KEY, z } from '@pkg/shared/common';

import { KvStore } from '#/infra/kv-store/kv-store.service';

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$|^24:00$/;

const SupportRuntimeConfigSchema = z.object({
  operation: z.object({
    hours: z.object({
      start: z.string().regex(TIME_PATTERN),
      end: z.string().regex(TIME_PATTERN),
      openDays: z.array(z.number().int().min(0).max(6)),
      lunchBreak: z.object({
        enabled: z.boolean(),
        start: z.string().regex(TIME_PATTERN),
        end: z.string().regex(TIME_PATTERN),
      }),
    }),
    holidays: z.array(z.object({ date: z.iso.date() })),
    messages: z.object({
      lunch: z.string(),
      offHours: z.string(),
      holiday: z.string(),
    }),
  }),
  inquiry: z.object({
    unansweredThresholdMinutes: z.number().int().min(1).max(120),
    autoCloseHours: z.number().int().min(1).max(720),
    notification: z.object({
      enabled: z.boolean(),
      type: z.enum(['SLACK', 'DISCORD', 'CHANNEL_TALK', 'TEAMS']),
      cooldownMinutes: z.number().int().min(1).max(1440),
      webhookUrl: z.string(),
    }),
  }),
});

export type SupportRuntimeConfig = z.infer<typeof SupportRuntimeConfigSchema>;

const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

@Injectable()
export class SupportRuntimeConfigService {
  constructor(private readonly kvStore: KvStore) {}

  async getConfig(): Promise<SupportRuntimeConfig> {
    const configs = await this.kvStore.get<SupportRuntimeConfig>(SYSTEM_CONFIGS_REDIS_KEY);
    if (!configs) {
      throw new ApplicationError({
        code: 'SUPPORT_RUNTIME_CONFIG_UNAVAILABLE',
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message: '고객지원 운영 설정을 확인할 수 없습니다.',
      });
    }
    const result = SupportRuntimeConfigSchema.safeParse(configs);
    if (!result.success) {
      throw new ApplicationError({
        code: 'SUPPORT_RUNTIME_CONFIG_INVALID',
        status: HttpStatus.BAD_GATEWAY,
        message: '고객지원 운영 설정을 확인할 수 없습니다.',
      });
    }
    return result.data;
  }

  isOperatingAt(config: SupportRuntimeConfig, now: Date): boolean {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: DEFAULT_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
    const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
    const localDate = `${value('year')}-${value('month')}-${value('day')}`;
    const weekday = WEEKDAY_INDEX[value('weekday')];
    const currentTime = `${value('hour')}:${value('minute')}`;
    const { hours, holidays } = config.operation;

    if (holidays.some(({ date }) => date === localDate)) return false;
    if (!hours.openDays.includes(weekday)) return false;
    if (hours.lunchBreak.enabled && currentTime >= hours.lunchBreak.start && currentTime < hours.lunchBreak.end) return false;
    return currentTime >= hours.start && currentTime < hours.end;
  }
}
