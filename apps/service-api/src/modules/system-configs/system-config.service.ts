import { randomUUID } from 'node:crypto';

import { HttpStatus, Injectable, NotFoundException, type OnModuleInit } from '@nestjs/common';
import { ApplicationError, SYSTEM_CONFIG_CODES, SYSTEM_CONFIGS_REDIS_KEY, z } from '@pkg/shared/common';
import { decrypt, encrypt } from '@pkg/shared/server';
import { cloneDeep, isPlainObject, merge } from 'lodash-es';

import { SystemConfig } from '#/entities/system-configs/system-config.entity';
import { Upload, UploadStatus } from '#/entities/uploads/upload.entity';
import { env } from '#/env';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { KvStore } from '#/infra/kv-store/kv-store.service';
import { StorageService } from '#/infra/storage/storage.service';

import { CreateOAuthIconPresignedUrlRequestDto, CreateOAuthIconPresignedUrlResponseDto, OAUTH_ICON_MAX_SIZE, OAUTH_ICON_SUBDIR } from './oauth-icon.dto';
import { SystemConfigSchema } from './system.context';

const CONFIG_CODES = Object.values(SYSTEM_CONFIG_CODES);
const UPDATE_SCHEMA = z.object(Object.fromEntries(
  CONFIG_CODES.map((code) => [code, z.record(z.string(), z.unknown()).optional()]),
)).strict();

type NotificationValue = Record<string, unknown> & {
  push?: { fcm?: { privateKey?: string } }
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
    if (!isPlainObject(current[key])) current[key] = {};
    current = current[key] as Record<string, unknown>;
  }
  current[path[path.length - 1]] = nextValue;
}

@Injectable()
export class SystemConfigService implements OnModuleInit {
  constructor(private readonly em: AppEntityManager, private readonly kvStore: KvStore, private readonly storageService: StorageService) {}

  async onModuleInit(): Promise<void> {
    await this.syncToRedis();
  }

  async getResponse(): Promise<Record<string, unknown>> {
    const configs = await this.em.find(SystemConfig, {}, { filters: false, orderBy: { code: 'asc' } });
    return Object.fromEntries(configs.map((config) => [config.code, this.toPublicValue(config.code, config.value)]));
  }

  async update(input: unknown): Promise<string[]> {
    const parsed = UPDATE_SCHEMA.safeParse(input);
    if (!parsed.success) {
      throw new ApplicationError({ code: 'SYSTEM_CONFIG_INVALID', status: HttpStatus.BAD_REQUEST, details: parsed.error.issues });
    }

    const configs = await this.em.find(SystemConfig, {}, { filters: false });
    const byCode = new Map(configs.map((config) => [config.code, config]));
    for (const [code, value] of Object.entries(parsed.data)) {
      if (value === undefined) continue;
      const config = byCode.get(code as SystemConfig['code']);
      if (!config) throw new NotFoundException(`Unknown system config: ${code}`);
      const next = code === SYSTEM_CONFIG_CODES.NOTIFICATION
        ? this.withPreservedNotificationSecrets(config.value, value)
        : value;
      config.value = this.toStoredValue(code as SystemConfig['code'], next);
    }

    const iconUrls = Object.values(parsed.data.oauth ?? {})
      .map((provider) => (provider as { iconUrl?: unknown } | undefined)?.iconUrl)
      .filter((url): url is string => typeof url === 'string' && url.length > 0);
    if (iconUrls.length > 0) {
      const uploads = await this.em.find(Upload, { url: { $in: iconUrls }, subDir: OAUTH_ICON_SUBDIR }, { filters: false });
      for (const upload of uploads) upload.status = UploadStatus.READY;
    }

    await this.em.flush();
    await this.syncToRedis();
    return Object.entries(parsed.data).filter(([, value]) => value !== undefined).map(([code]) => code);
  }

  async createOAuthIconPresignedUrl(input: CreateOAuthIconPresignedUrlRequestDto): Promise<CreateOAuthIconPresignedUrlResponseDto> {
    const extension = (/\.([a-zA-Z0-9]+)$/.exec(input.filename)?.[1] ?? 'png').toLowerCase();
    const filename = `${randomUUID()}.${extension}`;
    const presigned = await this.storageService.getPresignedUploadUrl(OAUTH_ICON_SUBDIR, filename, input.contentType, 300);
    const upload = this.em.create(Upload, {
      originalName: input.filename,
      storedName: filename,
      mimeType: input.contentType,
      size: input.fileSize,
      subDir: OAUTH_ICON_SUBDIR,
      url: presigned.fileUrl,
      status: UploadStatus.PENDING,
    });
    await this.em.flush();
    return { ...presigned, uploadId: upload.id };
  }

  async uploadOAuthIcon(filename: string, contentType: string, buffer: Buffer): Promise<void> {
    const upload = await this.em.findOne(Upload, { storedName: filename, subDir: OAUTH_ICON_SUBDIR }, { filters: false });
    if (!upload) throw new NotFoundException('OAuth 아이콘 업로드 요청을 찾을 수 없습니다.');
    if (upload.mimeType !== contentType || buffer.length > OAUTH_ICON_MAX_SIZE || buffer.length > upload.size) {
      throw new ApplicationError({ code: 'OAUTH_ICON_UPLOAD_INVALID', status: HttpStatus.BAD_REQUEST, message: 'OAuth 아이콘 파일이 업로드 조건과 일치하지 않습니다.' });
    }
    await this.storageService.saveFile(OAUTH_ICON_SUBDIR, filename, buffer);
  }

  async getOAuthIcon(filename: string): Promise<{ buffer: Buffer, contentType: string }> {
    const upload = await this.em.findOne(Upload, { storedName: filename, subDir: OAUTH_ICON_SUBDIR }, { filters: false });
    if (!upload || upload.status !== UploadStatus.READY) throw new NotFoundException('OAuth 아이콘을 찾을 수 없습니다.');
    try {
      return { buffer: await this.storageService.readFile(OAUTH_ICON_SUBDIR, filename), contentType: upload.mimeType };
    }
    catch {
      throw new NotFoundException('OAuth 아이콘 파일을 찾을 수 없습니다.');
    }
  }

  async syncToRedis(): Promise<void> {
    const configs = await this.em.find(SystemConfig, {
      code: { $in: [SYSTEM_CONFIG_CODES.OPERATION, SYSTEM_CONFIG_CODES.MAINTENANCE, SYSTEM_CONFIG_CODES.INQUIRY] },
    }, { filters: false });
    const values = new Map(configs.map((config) => [config.code, config.value]));
    const result = SystemConfigSchema.safeParse({
      operation: values.get(SYSTEM_CONFIG_CODES.OPERATION),
      maintenance: values.get(SYSTEM_CONFIG_CODES.MAINTENANCE),
      inquiry: values.get(SYSTEM_CONFIG_CODES.INQUIRY),
    });
    if (!result.success) {
      throw new ApplicationError({ code: 'SYSTEM_CONFIG_INVALID', status: HttpStatus.SERVICE_UNAVAILABLE, message: '서비스 설정이 준비되지 않았습니다.', details: result.error.issues });
    }
    await this.kvStore.set(SYSTEM_CONFIGS_REDIS_KEY, result.data);
  }

  private toStoredValue(code: SystemConfig['code'], value: unknown): unknown {
    if (code !== SYSTEM_CONFIG_CODES.NOTIFICATION || !isPlainObject(value)) return value;
    const next = cloneDeep(value) as NotificationValue;
    const privateKey = next.push?.fcm?.privateKey;
    if (next.push?.fcm && typeof privateKey === 'string' && privateKey.length > 0) {
      next.push.fcm.privateKey = encrypt(privateKey, env.APP_SECRET);
    }
    return next;
  }

  private fromStoredValue(code: SystemConfig['code'], value: unknown): unknown {
    if (code !== SYSTEM_CONFIG_CODES.NOTIFICATION || !isPlainObject(value)) return value;
    const next = cloneDeep(value) as NotificationValue;
    const privateKey = next.push?.fcm?.privateKey;
    if (next.push?.fcm && typeof privateKey === 'string' && privateKey.length > 0) {
      try {
        next.push.fcm.privateKey = decrypt(privateKey, env.APP_SECRET);
      }
      catch {
        next.push.fcm.privateKey = privateKey;
      }
    }
    return next;
  }

  private toPublicValue(code: SystemConfig['code'], value: unknown): unknown {
    const next = this.fromStoredValue(code, value);
    if (code !== SYSTEM_CONFIG_CODES.NOTIFICATION || !isPlainObject(next)) return next;
    const publicValue = cloneDeep(next) as NotificationValue;
    if (publicValue.push?.fcm?.privateKey) publicValue.push.fcm.privateKey = '';
    return publicValue;
  }

  private withPreservedNotificationSecrets(current: unknown, incoming: unknown): unknown {
    const currentValue = isPlainObject(current) ? this.fromStoredValue(SYSTEM_CONFIG_CODES.NOTIFICATION, current) : {};
    const incomingValue = isPlainObject(incoming) ? incoming : {};
    const merged = merge({}, currentValue, incomingValue) as Record<string, unknown>;
    for (const secretPath of NOTIFICATION_SECRET_PATHS) {
      const path = secretPath.split('.');
      const currentSecret = readPath(currentValue, path);
      const incomingSecret = readPath(incomingValue, path);
      if (typeof currentSecret === 'string' && currentSecret.length > 0 && (!incomingSecret || incomingSecret === '')) {
        writePath(merged, path, currentSecret);
      }
    }
    return merged;
  }
}
