import { randomUUID } from 'node:crypto';

import { HttpStatus, Injectable, NotFoundException, type OnModuleInit } from '@nestjs/common';
import { ApplicationError, SERVICE_SYSTEM_CONFIG_CODES, type ServiceSystemConfigCode, TimeUtil, z } from '@pkg/shared/common';
import { decrypt, type DeliveryConfigDto, encrypt, isEncrypted } from '@pkg/shared/server';
import { cloneDeep, isPlainObject, merge } from 'lodash-es';

import { SECURITY_CONFIG } from '#/app.config';
import { SystemConfig } from '#/entities/system-configs/system-config.entity';
import { Upload, UploadStatus } from '#/entities/uploads/upload.entity';
import { env } from '#/env';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { KvStore } from '#/infra/kv-store/kv-store.service';
import { StorageService } from '#/infra/storage/storage.service';

import { assertEnabledDeliveryProvidersAreConfigured } from './delivery-provider-validation';
import { CreateOAuthIconPresignedUrlRequestDto, CreateOAuthIconPresignedUrlResponseDto, OAUTH_ICON_SUBDIR } from './oauth-icon.dto';
import { assertEnabledOAuthProvidersAreConfigured } from './oauth-provider-validation';
import { SystemConfigSnapshotSchema, SystemContext } from './system.context';
import { SERVICE_SYSTEM_CONFIGS_REDIS_KEY } from './system-config.constants';

const CONFIG_CODES = Object.values(SERVICE_SYSTEM_CONFIG_CODES);
const RUNTIME_SNAPSHOT_CODES = [
  SERVICE_SYSTEM_CONFIG_CODES.OPERATION,
  SERVICE_SYSTEM_CONFIG_CODES.MAINTENANCE,
  SERVICE_SYSTEM_CONFIG_CODES.INQUIRY,
  SERVICE_SYSTEM_CONFIG_CODES.WEBHOOK,
] as const;
const CONFIG_VALUE_SCHEMA = z.record(z.string(), z.unknown()).optional();
const UPDATE_SCHEMA = z.object(Object.fromEntries(
  CONFIG_CODES.map((code) => [code, CONFIG_VALUE_SCHEMA]),
)).strict();

type DeliveryConfigValue = Record<string, unknown>;
type ParsedSystemConfigUpdates = z.infer<typeof UPDATE_SCHEMA>;

const NOTIFICATION_SECRET_PATHS = [
  'email.smtp.pass',
  'messenger.kakao.nhn.appKey',
  'messenger.kakao.nhn.secretKey',
  'messenger.kakao.solapi.apiKey',
  'messenger.kakao.solapi.apiSecret',
  'messenger.kakao.aligo.apiKey',
  'messenger.line.channelSecret',
  'messenger.line.accessToken',
  'messenger.whatsapp.accessToken',
  'messenger.telegram.botToken',
  'messenger.wechat.appSecret',
  'sms.nhn.secretKey',
  'sms.solapi.apiKey',
  'sms.solapi.apiSecret',
  'sms.aligo.apiKey',
  'push.fcm.apiKey',
  'push.fcm.privateKey',
  'push.nhn.appKey',
  'push.nhn.userAccessKeyId',
  'push.nhn.secretAccessKey',
] as const;

function readPath(value: unknown, path: string[]): unknown {
  let current = value;
  for (const key of path) {
    if (!isObjectRecord(current)) return undefined;
    current = current[key];
  }
  return current;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function writePath(value: Record<string, unknown>, path: string[], nextValue: unknown): void {
  let current = value;
  for (const key of path.slice(0, -1)) {
    if (!isObjectRecord(current[key])) current[key] = {};
    current = current[key] as Record<string, unknown>;
  }
  current[path[path.length - 1]] = nextValue;
}

function transformNotificationSecrets(value: Record<string, unknown>, transform: (secret: string) => string): void {
  for (const secretPath of NOTIFICATION_SECRET_PATHS) {
    const path = secretPath.split('.');
    const secret = readPath(value, path);
    if (typeof secret === 'string' && secret.length > 0) writePath(value, path, transform(secret));
  }
}

@Injectable()
export class SystemConfigService implements OnModuleInit {
  constructor(
    private readonly em: AppEntityManager,
    private readonly kvStore: KvStore,
    private readonly storageService: StorageService,
    private readonly systemContext: SystemContext,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.syncToRedis(this.em.fork());
  }

  async getResponse(): Promise<Record<string, unknown>> {
    const configs = await this.em.find(SystemConfig, {}, { filters: false, orderBy: { code: 'asc' } });
    return Object.fromEntries(configs.filter((config) => (config.code as string) !== 'security').map((config) => [config.code, this.toPublicValue(config.code, config.value)]));
  }

  async getDeliveryConfigForTest(overrides: unknown): Promise<DeliveryConfigDto> {
    const entity = await this.em.findOne(SystemConfig, { code: SERVICE_SYSTEM_CONFIG_CODES.DELIVERY }, { filters: false });
    if (!entity) throw new NotFoundException('서비스 발송 설정을 찾을 수 없습니다.');
    return this.withPreservedDeliverySecrets(entity.value, overrides) as DeliveryConfigDto;
  }

  async update(input: unknown): Promise<ServiceSystemConfigCode[]> {
    const updates = this.parseUpdates(input);
    const configs = await this.getConfigMap();
    this.validateUpdateTargets(updates, configs);
    this.validateRuntimeSnapshot(updates, configs);
    this.applyUpdates(updates, configs);
    await this.markOAuthIconsReady(updates);
    await this.em.flush();
    await this.syncRuntimeSnapshotIfChanged(updates);
    return CONFIG_CODES.filter((code) => updates[code] !== undefined);
  }

  async createOAuthIconPresignedUrl(input: CreateOAuthIconPresignedUrlRequestDto): Promise<CreateOAuthIconPresignedUrlResponseDto> {
    const extension = (/\.([a-zA-Z0-9]+)$/.exec(input.filename)?.[1] ?? 'png').toLowerCase();
    const filename = `${randomUUID()}.${extension}`;
    const presigned = await this.storageService.getPresignedUploadUrl(
      OAUTH_ICON_SUBDIR,
      filename,
      input.contentType,
      TimeUtil.s.second(SECURITY_CONFIG.integrations.oauthIconPresignedUrlTtlSeconds),
    );
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
    if (upload.mimeType !== contentType || buffer.length > SECURITY_CONFIG.integrations.oauthIconMaxSizeBytes || buffer.length > upload.size) {
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

  async syncToRedis(em: AppEntityManager = this.em): Promise<void> {
    const configs = await em.find(SystemConfig, {
      code: { $in: RUNTIME_SNAPSHOT_CODES },
    }, { filters: false });
    const values = new Map(configs.map((config) => [config.code, config.value]));
    const result = SystemConfigSnapshotSchema.safeParse({
      operation: values.get(SERVICE_SYSTEM_CONFIG_CODES.OPERATION),
      maintenance: values.get(SERVICE_SYSTEM_CONFIG_CODES.MAINTENANCE),
      inquiry: values.get(SERVICE_SYSTEM_CONFIG_CODES.INQUIRY),
      webhook: values.get(SERVICE_SYSTEM_CONFIG_CODES.WEBHOOK),
    });
    if (!result.success) {
      throw new ApplicationError({ code: 'SYSTEM_CONFIG_INVALID', status: HttpStatus.SERVICE_UNAVAILABLE, message: '서비스 설정이 준비되지 않았습니다.', details: result.error.issues });
    }
    await this.kvStore.set(SERVICE_SYSTEM_CONFIGS_REDIS_KEY, result.data);
    this.systemContext.invalidateCache();
  }

  private toStoredValue(code: SystemConfig['code'], value: unknown): unknown {
    if (!isPlainObject(value)) return value;
    const next = cloneDeep(value) as DeliveryConfigValue;
    if (code === SERVICE_SYSTEM_CONFIG_CODES.OAUTH) {
      for (const provider of Object.values(next)) {
        if (!isPlainObject(provider)) continue;
        const providerConfig = provider as Record<string, unknown>;
        const clientSecret = providerConfig.clientSecret;
        if (typeof clientSecret === 'string' && clientSecret.length > 0) providerConfig.clientSecret = encrypt(clientSecret, env.APP_SECRET);
      }
      return next;
    }
    if (code !== SERVICE_SYSTEM_CONFIG_CODES.DELIVERY) return value;
    transformNotificationSecrets(next, (secret) => isEncrypted(secret) ? secret : encrypt(secret, env.APP_SECRET));
    return next;
  }

  private fromStoredValue(code: SystemConfig['code'], value: unknown): unknown {
    if (code !== SERVICE_SYSTEM_CONFIG_CODES.DELIVERY || !isPlainObject(value)) return value;
    const next = cloneDeep(value) as DeliveryConfigValue;
    transformNotificationSecrets(next, (secret) => isEncrypted(secret) ? decrypt(secret, env.APP_SECRET) : secret);
    return next;
  }

  private toPublicValue(code: SystemConfig['code'], value: unknown): unknown {
    if (code === SERVICE_SYSTEM_CONFIG_CODES.OAUTH && isPlainObject(value)) {
      const publicValue = cloneDeep(value) as Record<string, unknown>;
      for (const provider of Object.values(publicValue)) {
        if (!isPlainObject(provider)) continue;
        const providerConfig = provider as Record<string, unknown>;
        if (typeof providerConfig.clientSecret === 'string' && providerConfig.clientSecret.length > 0) providerConfig.clientSecret = '';
      }
      return publicValue;
    }
    if (code !== SERVICE_SYSTEM_CONFIG_CODES.DELIVERY || !isPlainObject(value)) return value;
    const publicValue = cloneDeep(value) as DeliveryConfigValue;
    for (const secretPath of NOTIFICATION_SECRET_PATHS) {
      writePath(publicValue, secretPath.split('.'), '');
    }
    return publicValue;
  }

  private withPreservedDeliverySecrets(current: unknown, incoming: unknown): unknown {
    const currentValue = isPlainObject(current) ? this.fromStoredValue(SERVICE_SYSTEM_CONFIG_CODES.DELIVERY, current) : {};
    const incomingValue = isObjectRecord(incoming) ? incoming : {};
    const merged = merge({}, currentValue, incomingValue);
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

  private withPreservedOAuthSecrets(current: unknown, incoming: unknown): unknown {
    const currentValue = isPlainObject(current) ? current as Record<string, unknown> : {};
    const incomingValue = isPlainObject(incoming) ? cloneDeep(incoming) as Record<string, unknown> : {};
    for (const [providerId, provider] of Object.entries(incomingValue)) {
      if (!isPlainObject(provider)) continue;
      const providerConfig = provider as Record<string, unknown>;
      const incomingSecret = providerConfig.clientSecret;
      const currentProvider = currentValue[providerId];
      const currentSecret = isPlainObject(currentProvider) ? (currentProvider as Record<string, unknown>).clientSecret : undefined;
      if (typeof incomingSecret !== 'string' || incomingSecret.length > 0 || typeof currentSecret !== 'string' || currentSecret.length === 0) continue;
      providerConfig.clientSecret = isEncrypted(currentSecret) ? decrypt(currentSecret, env.APP_SECRET) : currentSecret;
    }
    return incomingValue;
  }

  private parseUpdates(input: unknown): ParsedSystemConfigUpdates {
    const parsed = UPDATE_SCHEMA.safeParse(input);
    if (!parsed.success) {
      throw new ApplicationError({ code: 'SYSTEM_CONFIG_INVALID', status: HttpStatus.BAD_REQUEST, details: parsed.error.issues });
    }
    return parsed.data;
  }

  private async getConfigMap(): Promise<Map<SystemConfig['code'], SystemConfig>> {
    const configs = await this.em.find(SystemConfig, {}, { filters: false });
    return new Map(configs.map((config) => [config.code, config]));
  }

  private validateUpdateTargets(updates: ParsedSystemConfigUpdates, configs: Map<SystemConfig['code'], SystemConfig>): void {
    for (const code of Object.keys(updates)) {
      if (!configs.has(code as SystemConfig['code'])) throw new NotFoundException(`Unknown system config: ${code}`);
    }
  }

  private validateRuntimeSnapshot(updates: ParsedSystemConfigUpdates, configs: Map<SystemConfig['code'], SystemConfig>): void {
    const snapshot = {
      operation: updates.operation ?? configs.get(SERVICE_SYSTEM_CONFIG_CODES.OPERATION)?.value,
      maintenance: updates.maintenance ?? configs.get(SERVICE_SYSTEM_CONFIG_CODES.MAINTENANCE)?.value,
      inquiry: updates.inquiry ?? configs.get(SERVICE_SYSTEM_CONFIG_CODES.INQUIRY)?.value,
      webhook: updates.webhook ?? configs.get(SERVICE_SYSTEM_CONFIG_CODES.WEBHOOK)?.value,
    };
    const result = SystemConfigSnapshotSchema.safeParse(snapshot);
    if (!result.success) {
      throw new ApplicationError({ code: 'SYSTEM_CONFIG_INVALID', status: HttpStatus.BAD_REQUEST, message: '서비스 설정값이 올바르지 않습니다.', details: result.error.issues });
    }
  }

  private applyUpdates(updates: ParsedSystemConfigUpdates, configs: Map<SystemConfig['code'], SystemConfig>): void {
    for (const [code, value] of Object.entries(updates)) {
      if (value === undefined) continue;
      const config = configs.get(code as SystemConfig['code']);
      if (!config) throw new NotFoundException(`Unknown system config: ${code}`);
      const next = this.prepareConfigValue(code as SystemConfig['code'], config.value, value);
      config.value = this.toStoredValue(code as SystemConfig['code'], next);
    }
  }

  private prepareConfigValue(code: SystemConfig['code'], current: unknown, incoming: unknown): unknown {
    if (code === SERVICE_SYSTEM_CONFIG_CODES.DELIVERY) {
      const next = this.withPreservedDeliverySecrets(current, incoming);
      assertEnabledDeliveryProvidersAreConfigured(next);
      return next;
    }
    if (code !== SERVICE_SYSTEM_CONFIG_CODES.OAUTH) return incoming;
    const next = this.withPreservedOAuthSecrets(current, incoming);
    assertEnabledOAuthProvidersAreConfigured(next, env.NODE_ENV === 'development');
    return next;
  }

  private async markOAuthIconsReady(updates: ParsedSystemConfigUpdates): Promise<void> {
    const iconUrls = Object.values(updates.oauth ?? {})
      .map((provider) => (provider as { iconUrl?: unknown } | undefined)?.iconUrl)
      .filter((url): url is string => typeof url === 'string' && url.length > 0);
    if (iconUrls.length === 0) return;
    const uploads = await this.em.find(Upload, { url: { $in: iconUrls }, subDir: OAUTH_ICON_SUBDIR }, { filters: false });
    for (const upload of uploads) upload.status = UploadStatus.READY;
  }

  private async syncRuntimeSnapshotIfChanged(updates: ParsedSystemConfigUpdates): Promise<void> {
    const changed = Object.keys(updates).some((code) => RUNTIME_SNAPSHOT_CODES.includes(code as typeof RUNTIME_SNAPSHOT_CODES[number]));
    if (!changed) return;
    try {
      await this.syncToRedis();
    }
    catch {
      throw new ApplicationError({
        code: 'SYSTEM_CONFIG_RUNTIME_SYNC_FAILED',
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message: '설정은 저장됐지만 Service 런타임 반영에 실패했습니다. 동기화를 다시 실행해 주세요.',
      });
    }
  }
}
