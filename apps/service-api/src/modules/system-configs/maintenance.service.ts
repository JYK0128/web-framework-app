import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError, DEFAULT_TIMEZONE, z } from '@pkg/shared/common';

import { AdminConfigClient } from './admin-config.client';

const MaintenanceConfigSchema = z.object({
  temporary: z.object({
    enabled: z.boolean(),
    message: z.string(),
    startAt: z.iso.datetime().nullable().optional(),
    endAt: z.iso.datetime().nullable().optional(),
  }),
  recurring: z.object({
    enabled: z.boolean(),
    message: z.string(),
    daysOfWeek: z.array(z.number().int().min(0).max(6)),
    startTime: z.iso.time({ precision: -1 }),
    endTime: z.iso.time({ precision: -1 }),
  }),
});

type MaintenanceConfig = z.infer<typeof MaintenanceConfigSchema>;
export type MaintenanceStatus = { active: boolean, message: string };

const CONFIG_CACHE_TTL_MS = 2_000;
const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

@Injectable()
export class MaintenanceService {
  private cachedStatus: { value: MaintenanceStatus, expiresAt: number } | undefined;
  private inFlight: Promise<MaintenanceStatus> | undefined;

  constructor(private readonly adminConfigClient: AdminConfigClient) {}

  async getStatus(now = new Date()): Promise<MaintenanceStatus> {
    const currentTime = Date.now();
    if (this.cachedStatus && currentTime < this.cachedStatus.expiresAt) return this.cachedStatus.value;
    if (this.inFlight) return this.inFlight;

    const request = this.loadConfig().then((config) => {
      const value = this.evaluate(config, now);
      this.cachedStatus = { value, expiresAt: Date.now() + CONFIG_CACHE_TTL_MS };
      return value;
    });
    this.inFlight = request;

    try {
      return await request;
    }
    finally {
      if (this.inFlight === request) this.inFlight = undefined;
    }
  }

  private async loadConfig(): Promise<MaintenanceConfig> {
    const configs = await this.adminConfigClient.fetchSystemConfigs();
    const config = configs.find(({ code }) => code === 'maintenance')?.value;
    const result = MaintenanceConfigSchema.safeParse(config);
    if (!result.success) {
      throw new ApplicationError({
        code: 'MAINTENANCE_CONFIG_INVALID',
        status: HttpStatus.BAD_GATEWAY,
        message: '서비스 점검 설정을 확인할 수 없습니다.',
      });
    }
    return result.data;
  }

  private evaluate(config: MaintenanceConfig, now: Date): MaintenanceStatus {
    if (config.temporary.enabled && this.isTemporaryActive(config.temporary, now)) {
      return { active: true, message: config.temporary.message };
    }
    if (config.recurring.enabled && this.isRecurringActive(config.recurring, now)) {
      return { active: true, message: config.recurring.message };
    }
    return { active: false, message: '' };
  }

  private isTemporaryActive(config: MaintenanceConfig['temporary'], now: Date): boolean {
    const startsAt = config.startAt ? Date.parse(config.startAt) : Number.NEGATIVE_INFINITY;
    const endsAt = config.endAt ? Date.parse(config.endAt) : Number.POSITIVE_INFINITY;
    return now.getTime() >= startsAt && now.getTime() < endsAt;
  }

  private isRecurringActive(config: MaintenanceConfig['recurring'], now: Date): boolean {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: DEFAULT_TIMEZONE,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
    const weekday = WEEKDAY_INDEX[parts.find(({ type }) => type === 'weekday')?.value ?? ''];
    const hour = Number(parts.find(({ type }) => type === 'hour')?.value);
    const minute = Number(parts.find(({ type }) => type === 'minute')?.value);
    const currentMinute = hour * 60 + minute;
    const startMinute = this.toMinutes(config.startTime);
    const endMinute = this.toMinutes(config.endTime);

    if (startMinute < endMinute) {
      return config.daysOfWeek.includes(weekday) && currentMinute >= startMinute && currentMinute < endMinute;
    }
    if (startMinute > endMinute) {
      const previousWeekday = (weekday + 6) % 7;
      return (config.daysOfWeek.includes(weekday) && currentMinute >= startMinute)
        || (config.daysOfWeek.includes(previousWeekday) && currentMinute < endMinute);
    }
    return false;
  }

  private toMinutes(time: string): number {
    const [hour, minute] = time.split(':').map(Number);
    return hour * 60 + minute;
  }
}
