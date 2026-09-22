import { QueryOrder } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { LogEntry } from '#/entities/logs/log-entry.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';

@Injectable()
export class LogsService {
  constructor(private readonly em: AppEntityManager) {}

  async list(page: number, limit: number, search?: string, method?: string, status?: string) {
    const where: Record<string, unknown> = {};
    if (search) where.$or = [{ path: { $ilike: `%${search}%` } }, { requestId: { $ilike: `%${search}%` } }];
    if (method) where.method = method;
    if (status === 'error') where.statusCode = { $gte: 400 };
    if (status === 'success') where.statusCode = { $lt: 400 };
    const result = await this.em.findByPage(LogEntry, where, { page, limit, orderBy: { createdAt: QueryOrder.DESC } });
    return { ...result, items: result.items.map((item) => this.toItem(item)) };
  }

  async stats() {
    const [total, errors, duration] = await Promise.all([
      this.em.count(LogEntry, {}),
      this.em.count(LogEntry, { statusCode: { $gte: 400 } }),
      this.em.find(LogEntry, {}, { fields: ['durationMs'], limit: 1000 }),
    ]);
    const averageDurationMs = duration.length ? Math.round(duration.reduce((sum, item) => sum + item.durationMs, 0) / duration.length) : 0;
    return { total, errors, averageDurationMs, errorRate: total ? Math.round((errors / total) * 10000) / 100 : 0 };
  }

  private toItem(item: LogEntry) {
    return { id: item.id, createdAt: item.createdAt, level: item.level, method: item.method, path: item.path, statusCode: item.statusCode, durationMs: item.durationMs, requestId: item.requestId, ipAddress: item.ipAddress, userAgent: item.userAgent, errorMessage: item.errorMessage };
  }
}
