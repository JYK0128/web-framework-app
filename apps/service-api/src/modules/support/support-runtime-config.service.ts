import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError, DEFAULT_TIMEZONE, z } from '@pkg/shared/common';

import { AdminConfigClient } from '#/modules/system-configs/admin-config.client';

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

const CONFIG_CACHE_TTL_MS = 2_000;
const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

@Injectable()
export class SupportRuntimeConfigService {
  private cached: { value: SupportRuntimeConfig, expiresAt: number } | undefined;
  private inFlight: Promise<SupportRuntimeConfig> | undefined;

  constructor(private readonly adminConfigClient: AdminConfigClient) {}

  async getConfig(): Promise<SupportRuntimeConfig> {
    if (this.cached && Date.now() < this.cached.expiresAt) return this.cached.value;
    if (this.inFlight) return this.inFlight;

    const request = this.adminConfigClient.fetchSupportRuntimeConfig().then((raw) => {
      const result = SupportRuntimeConfigSchema.safeParse(raw);
      if (!result.success) {
        throw new ApplicationError({
          code: 'SUPPORT_RUNTIME_CONFIG_INVALID',
          status: HttpStatus.BAD_GATEWAY,
          message: '고객지원 운영 설정을 확인할 수 없습니다.',
        });
      }
      this.cached = { value: result.data, expiresAt: Date.now() + CONFIG_CACHE_TTL_MS };
      return result.data;
    });
    this.inFlight = request;

    try {
      return await request;
    }
    finally {
      if (this.inFlight === request) this.inFlight = undefined;
    }
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

  async getOperationNotice(now = new Date()): Promise<{ isOperating: boolean, message: string | null }> {
    const { operation } = await this.getConfig();
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
    const { hours, holidays, messages } = operation;

    if (holidays.some(({ date }) => date === localDate) || !hours.openDays.includes(weekday)) {
      return { isOperating: false, message: messages.holiday };
    }
    if (hours.lunchBreak.enabled && currentTime >= hours.lunchBreak.start && currentTime < hours.lunchBreak.end) {
      return { isOperating: false, message: messages.lunch };
    }
    if (currentTime < hours.start || currentTime >= hours.end) {
      return { isOperating: false, message: messages.offHours };
    }
    return { isOperating: true, message: null };
  }
}
