import { Injectable, NotFoundException, type OnModuleInit } from '@nestjs/common';
import { SYSTEM_CONFIGS_REDIS_KEY } from '@pkg/shared/common';
import { decrypt, encrypt } from '@pkg/shared/server';
import { cloneDeep, isPlainObject, merge } from 'lodash-es';

import { SystemConfig, SystemConfigCode } from '#/entities/system-configs/system-config.entity';
import { env } from '#/env';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { KvStore } from '#/infra/kv-store/kv-store.service';

import type { SystemConfigResponseDto } from './system-config.interfaces';

type NotificationValue = Record<string, unknown> & {
  push?: {
    fcm?: {
      privateKey?: string
    }
  }
};

const NOTIFICATION_SECRET_PATHS = [
  'email.smtp.pass',
  'messenger.kakao.nhn.secretKey',
  'messenger.kakao.solapi.apiSecret',
  'messenger.kakao.aligo.apiKey',
  'messenger.line.channelSecret',
  'messenger.line.accessToken',
  'messenger.whatsapp.accessToken',
  'messenger.telegram.botToken',
  'messenger.wechat.appSecret',
  'sms.nhn.secretKey',
  'sms.solapi.apiSecret',
  'sms.aligo.apiKey',
  'push.fcm.apiKey',
  'push.fcm.privateKey',
  'push.nhn.secretAccessKey',
] as const;

function readPath(value: unknown, path: string[]): unknown {
  let current = value;
  for (const key of path) {
    if (!isPlainObject(current)) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function writePath(value: Record<string, unknown>, path: string[], nextValue: unknown): void {
  let current = value;
  for (const key of path.slice(0, -1)) {
    const child = current[key];
    if (!isPlainObject(child)) current[key] = {};
    current = current[key] as Record<string, unknown>;
  }
  current[path[path.length - 1]] = nextValue;
}

@Injectable()
export class SystemConfigService implements OnModuleInit {
  constructor(private readonly em: AppEntityManager, private readonly kvStore: KvStore) {}

  async onModuleInit(): Promise<void> {
    await this.syncToRedis();
  }

  list(): Promise<SystemConfig[]> {
    return this.em.find(SystemConfig, {}, { orderBy: { code: 'asc' } });
  }

  async getResponse(): Promise<SystemConfigResponseDto> {
    const configs = await this.list();
    const values = new Map(configs.map((config) => [config.code, this.toPublicValue(config.code, config.value)]));
    return {
      operation: values.get('operation') ?? {},
      maintenance: values.get('maintenance') ?? {},
      security: values.get('security') ?? {},
      inquiry: values.get('inquiry') ?? {},
      notification: values.get('notification') ?? {},
      oauth: values.get('oauth') ?? {},
    } as SystemConfigResponseDto;
  }

  async getValue(code: SystemConfigCode): Promise<unknown> {
    const config = await this.em.findOne(SystemConfig, { code }, { filters: false });
    return config ? this.fromStoredValue(code, config.value) : undefined;
  }

  async update(values: Partial<Record<SystemConfigCode, unknown>>): Promise<SystemConfig[]> {
    const configs = await this.list();
    const byCode = new Map(configs.map((config) => [config.code, config]));
    for (const [code, value] of Object.entries(values)) {
      const config = byCode.get(code as SystemConfigCode);
      if (!config) throw new NotFoundException(`Unknown system config: ${code}`);
      const nextValue = code === SystemConfigCode.NOTIFICATION
        ? this.withPreservedNotificationSecrets(config.value, value)
        : value;
      config.updateValue(this.toStoredValue(code as SystemConfigCode, nextValue) as Record<string, unknown>);
    }
    await this.em.flush();
    const updatedConfigs = await this.list();
    await this.syncToRedis();
    return updatedConfigs;
  }

  async syncToRedis(): Promise<void> {
    const currentConfigs = await this.em.find(SystemConfig, {
      code: { $in: [SystemConfigCode.OPERATION, SystemConfigCode.MAINTENANCE, SystemConfigCode.INQUIRY] },
    }, { filters: false });
    const byCode = new Map(currentConfigs.map((config) => [config.code, config]));
    const operation = byCode.get(SystemConfigCode.OPERATION);
    const maintenance = byCode.get(SystemConfigCode.MAINTENANCE);
    const inquiry = byCode.get(SystemConfigCode.INQUIRY);
    if (!operation || !maintenance || !inquiry) {
      throw new NotFoundException('service-api 설정이 준비되지 않았습니다.');
    }
    await this.kvStore.set(SYSTEM_CONFIGS_REDIS_KEY, {
      operation: operation.value,
      maintenance: maintenance.value,
      inquiry: inquiry.value,
    });
  }

  private toStoredValue(code: SystemConfigCode, value: unknown): unknown {
    if (code !== SystemConfigCode.NOTIFICATION || !isPlainObject(value)) return value;
    const next = cloneDeep(value) as NotificationValue;
    const fcm = next.push?.fcm;
    const privateKey = fcm?.privateKey;
    if (fcm && typeof privateKey === 'string' && privateKey.length > 0) {
      fcm.privateKey = encrypt(privateKey, env.APP_SECRET);
    }
    return next;
  }

  private fromStoredValue(code: SystemConfigCode, value: unknown): unknown {
    if (code !== SystemConfigCode.NOTIFICATION || !isPlainObject(value)) return value;
    const next = cloneDeep(value) as NotificationValue;
    const fcm = next.push?.fcm;
    const privateKey = fcm?.privateKey;
    if (fcm && typeof privateKey === 'string' && privateKey.length > 0) {
      try {
        fcm.privateKey = decrypt(privateKey, env.APP_SECRET);
      }
      catch {
        fcm.privateKey = privateKey;
      }
    }
    return next;
  }

  private toPublicValue(code: SystemConfigCode, value: unknown): unknown {
    const next = this.fromStoredValue(code, value);
    if (code !== SystemConfigCode.NOTIFICATION || !isPlainObject(next)) return next;
    const publicValue = cloneDeep(next) as NotificationValue;
    if (publicValue.push?.fcm?.privateKey) publicValue.push.fcm.privateKey = '';
    return publicValue;
  }

  private withPreservedNotificationSecrets(current: unknown, incoming: unknown): unknown {
    const currentValue = isPlainObject(current) ? this.fromStoredValue(SystemConfigCode.NOTIFICATION, current) : {};
    const nextValue = isPlainObject(incoming) ? incoming : {};
    const merged = merge({}, currentValue, nextValue) as Record<string, unknown>;
    for (const secretPath of NOTIFICATION_SECRET_PATHS) {
      const path = secretPath.split('.');
      const existingSecret = readPath(currentValue, path);
      const incomingSecret = readPath(nextValue, path);
      if (typeof existingSecret === 'string' && existingSecret.length > 0 && (!incomingSecret || incomingSecret === '')) {
        writePath(merged, path, existingSecret);
      }
    }
    return merged;
  }
}
