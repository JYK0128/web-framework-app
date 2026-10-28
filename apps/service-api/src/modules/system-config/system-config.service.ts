import { randomUUID } from 'node:crypto';

import { HttpStatus, Injectable, NotFoundException, type OnModuleInit } from '@nestjs/common';
import { AppEntityManager } from '@pkg/server-core/core/persistence';
import { StorageService } from '@pkg/server-core/file-storage';
import { KvStore } from '@pkg/server-core/kv-store';
import { type NotificationConfigDto } from '@pkg/server-core/notification/dto';
import { assertEnabledOAuthProvidersAreConfigured } from '@pkg/server-core/oauth';
import { ApplicationError, TimeUtil, z } from '@pkg/shared/common';
import { ServiceSystemConfigCode } from '@pkg/shared/constants';
import { decrypt, encrypt, isEncrypted } from '@pkg/shared/server';
import { cloneDeep, isPlainObject, merge } from 'lodash-es';

import { SECURITY_CONFIG } from '~/app.config';
import { SystemConfig } from '~/core/database/entities/system-configs';
import { Upload, UploadStatus } from '~/core/database/entities/uploads';
import { env } from '~/env';
import { NOTIFICATION_SECRET_PATHS, transformNotificationSecrets } from '~/modules/system-config/notification/notification-config-secrets';
import { assertEnabledNotificationProvidersAreConfigured } from '~/modules/system-config/notification/notification-provider-validation';
import { CreateOAuthIconPresignedUrlRequestDto } from '~/modules/system-config/oauth/create-oauth-icon-presigned-url.request.dto';
import { CreateOAuthIconPresignedUrlResponseDto } from '~/modules/system-config/oauth/create-oauth-icon-presigned-url.response.dto';
import { OAUTH_ICON_SUBDIR } from '~/modules/system-config/oauth/oauth-icon.helpers';
import { ServiceContext, ServiceContextSnapshotSchema } from '~/modules/system-config/service.context';
import { SystemContext, SystemContextSnapshotSchema } from '~/modules/system-config/system.context';
import { SERVICE_CONTEXT_REDIS_KEY, SERVICE_SYSTEM_CONTEXT_REDIS_KEY } from '~/modules/system-config/system-config.constants';

const CONFIG_CODES = Object.values(ServiceSystemConfigCode);
const SERVICE_CONTEXT_CODES = [
  ServiceSystemConfigCode.OPERATION,
  ServiceSystemConfigCode.MAINTENANCE,
  ServiceSystemConfigCode.INQUIRY,
] as const;
const SYSTEM_CONTEXT_CODES = [
  ServiceSystemConfigCode.NOTIFICATION,
  ServiceSystemConfigCode.OAUTH,
] as const;
const CONTEXT_CONFIG_CODES = [...SERVICE_CONTEXT_CODES, ...SYSTEM_CONTEXT_CODES];
const CONFIG_VALUE_SCHEMA = z.record(z.string(), z.unknown()).optional();
const UPDATE_SCHEMA = z.object(Object.fromEntries(
  CONFIG_CODES.map((code) => [code, CONFIG_VALUE_SCHEMA]),
)).strict();

type NotificationConfigValue = Record<string, unknown>;
type ParsedSystemConfigUpdates = z.infer<typeof UPDATE_SCHEMA>;

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

@Injectable()
export class SystemConfigService implements OnModuleInit {
  constructor(
    private readonly em: AppEntityManager,
    private readonly kvStore: KvStore,
    private readonly storageService: StorageService,
    private readonly serviceContext: ServiceContext,
    private readonly systemContext: SystemContext,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.syncToRedis(this.em.fork());
  }

  async getResponse(): Promise<Record<string, unknown>> {
    const configs = await this.em.find(SystemConfig, { code: { $in: CONFIG_CODES } }, { filters: false, orderBy: { code: 'asc' } });
    return Object.fromEntries(configs.map((config) => [config.code, this.toPublicValue(config.code, config.value)]));
  }

  async getNotificationConfigForTest(overrides: unknown): Promise<NotificationConfigDto> {
    const entity = await this.em.findOne(SystemConfig, { code: ServiceSystemConfigCode.NOTIFICATION }, { filters: false });
    if (!entity) throw new NotFoundException('서비스 노티피케이션 설정을 찾을 수 없습니다.');
    return this.withPreservedNotificationSecrets(entity.value, overrides) as NotificationConfigDto;
  }

  async update(input: unknown): Promise<string[]> {
    const updates = this.parseUpdates(input);
    const configs = await this.getConfigMap();
    this.validateUpdateTargets(updates, configs);
    this.validateRuntimeSnapshot(updates, configs);
    this.applyUpdates(updates, configs);
    await this.markOAuthIconsReady(updates);
    await this.em.flush();
    await this.syncContextsIfChanged(updates);
    return CONFIG_CODES.filter((code) => updates[code] !== undefined);
  }

  async createOAuthIconPresignedUrl(input: CreateOAuthIconPresignedUrlRequestDto): Promise<CreateOAuthIconPresignedUrlResponseDto> {
    const extension = (/\.([a-zA-Z0-9]+)$/.exec(input.filename)?.[1] ?? 'png').toLowerCase();
    const filename = `${randomUUID()}.${extension}`;
    const presigned = await this.storageService.use('s3').getPresignedUploadUrl(
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
    return CreateOAuthIconPresignedUrlResponseDto.parse({ ...presigned, uploadId: upload.id });
  }

  async uploadOAuthIcon(filename: string, contentType: string, buffer: Buffer): Promise<void> {
    const upload = await this.em.findOne(Upload, { storedName: filename, subDir: OAUTH_ICON_SUBDIR }, { filters: false });
    if (!upload) throw new NotFoundException('OAuth 아이콘 업로드 요청을 찾을 수 없습니다.');
    if (upload.status !== UploadStatus.PENDING || Date.now() >= upload.createdAt.getTime() + TimeUtil.ms.second(SECURITY_CONFIG.integrations.oauthIconPresignedUrlTtlSeconds)) {
      throw new ApplicationError({ code: 'OAUTH_ICON_UPLOAD_INVALID', status: HttpStatus.BAD_REQUEST });
    }
    if (upload.mimeType !== contentType || buffer.length > SECURITY_CONFIG.integrations.oauthIconMaxSizeBytes || buffer.length > upload.size) {
      throw new ApplicationError({ code: 'OAUTH_ICON_UPLOAD_INVALID', status: HttpStatus.BAD_REQUEST });
    }
    await this.storageService.use('s3').saveFile(OAUTH_ICON_SUBDIR, filename, buffer);
  }

  async getOAuthIcon(filename: string): Promise<{ buffer: Buffer, contentType: string }> {
    const upload = await this.em.findOne(Upload, { storedName: filename, subDir: OAUTH_ICON_SUBDIR }, { filters: false });
    if (!upload || upload.status !== UploadStatus.READY) throw new NotFoundException('OAuth 아이콘을 찾을 수 없습니다.');
    try {
      return { buffer: await this.storageService.use('s3').readFile(OAUTH_ICON_SUBDIR, filename), contentType: upload.mimeType };
    }
    catch {
      throw new NotFoundException('OAuth 아이콘 파일을 찾을 수 없습니다.');
    }
  }

  async syncToRedis(em: AppEntityManager = this.em): Promise<void> {
    await this.syncServiceContextToRedis(em);
    await this.syncSystemContextToRedis(em);
  }

  private async syncServiceContextToRedis(em: AppEntityManager): Promise<void> {
    const configs = await em.find(SystemConfig, { code: { $in: SERVICE_CONTEXT_CODES } }, { filters: false });
    const values = new Map(configs.map((config) => [config.code, config.value]));
    const result = ServiceContextSnapshotSchema.safeParse({
      operation: values.get(ServiceSystemConfigCode.OPERATION),
      maintenance: values.get(ServiceSystemConfigCode.MAINTENANCE),
      inquiry: values.get(ServiceSystemConfigCode.INQUIRY),
    });
    if (!result.success) {
      throw new ApplicationError({ code: 'SYSTEM_CONFIG_INVALID', status: HttpStatus.SERVICE_UNAVAILABLE, details: result.error.issues });
    }
    await this.kvStore.set(SERVICE_CONTEXT_REDIS_KEY, result.data);
    this.serviceContext.invalidateCache();
  }

  private async syncSystemContextToRedis(em: AppEntityManager): Promise<void> {
    const configs = await em.find(SystemConfig, { code: { $in: SYSTEM_CONTEXT_CODES } }, { filters: false });
    const values = new Map(configs.map((config) => [config.code, config.value]));
    const notification = values.get(ServiceSystemConfigCode.NOTIFICATION);
    const oauth = values.get(ServiceSystemConfigCode.OAUTH);
    const result = SystemContextSnapshotSchema.safeParse({
      notification: isPlainObject(notification) ? notification : null,
      oauth: isPlainObject(oauth) ? oauth : null,
    });
    if (!result.success) {
      throw new ApplicationError({ code: 'SYSTEM_CONFIG_INVALID', status: HttpStatus.SERVICE_UNAVAILABLE, details: result.error.issues });
    }
    await this.kvStore.set(SERVICE_SYSTEM_CONTEXT_REDIS_KEY, result.data);
    this.systemContext.invalidateCache();
  }

  private toStoredValue(code: SystemConfig['code'], value: unknown): unknown {
    if (!isPlainObject(value)) return value;
    const next = cloneDeep(value) as NotificationConfigValue;
    if (code === ServiceSystemConfigCode.OAUTH) {
      for (const provider of Object.values(next)) {
        if (!isPlainObject(provider)) continue;
        const providerConfig = provider as Record<string, unknown>;
        const clientSecret = providerConfig.clientSecret;
        if (typeof clientSecret === 'string' && clientSecret.length > 0) providerConfig.clientSecret = encrypt(clientSecret, env.OAUTH_ENCRYPTION_KEY);
      }
      return next;
    }
    if (code !== ServiceSystemConfigCode.NOTIFICATION) return value;
    transformNotificationSecrets(next, (secret, key) => isEncrypted(secret) ? secret : encrypt(secret, key));
    return next;
  }

  private fromStoredValue(code: SystemConfig['code'], value: unknown): unknown {
    if (code !== ServiceSystemConfigCode.NOTIFICATION || !isPlainObject(value)) return value;
    const next = cloneDeep(value) as NotificationConfigValue;
    transformNotificationSecrets(next, (secret, key) => isEncrypted(secret) ? decrypt(secret, key) : secret);
    return next;
  }

  private toPublicValue(code: SystemConfig['code'], value: unknown): unknown {
    if (code === ServiceSystemConfigCode.OAUTH && isPlainObject(value)) {
      const publicValue = cloneDeep(value) as Record<string, unknown>;
      for (const provider of Object.values(publicValue)) {
        if (!isPlainObject(provider)) continue;
        const providerConfig = provider as Record<string, unknown>;
        if (typeof providerConfig.clientSecret === 'string' && providerConfig.clientSecret.length > 0) providerConfig.clientSecret = '';
      }
      return publicValue;
    }
    if (code !== ServiceSystemConfigCode.NOTIFICATION || !isPlainObject(value)) return value;
    const publicValue = cloneDeep(value) as NotificationConfigValue;
    for (const secretPath of NOTIFICATION_SECRET_PATHS) {
      writePath(publicValue, secretPath.split('.'), '');
    }
    return publicValue;
  }

  private withPreservedNotificationSecrets(current: unknown, incoming: unknown): unknown {
    const currentValue = isPlainObject(current) ? this.fromStoredValue(ServiceSystemConfigCode.NOTIFICATION, current) : {};
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
      providerConfig.clientSecret = isEncrypted(currentSecret) ? decrypt(currentSecret, env.OAUTH_ENCRYPTION_KEY) : currentSecret;
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
    const configs = await this.em.find(SystemConfig, { code: { $in: CONFIG_CODES } }, { filters: false });
    return new Map(configs.map((config) => [config.code, config]));
  }

  private validateUpdateTargets(updates: ParsedSystemConfigUpdates, configs: Map<SystemConfig['code'], SystemConfig>): void {
    for (const code of Object.keys(updates)) {
      if (!configs.has(code as SystemConfig['code'])) throw new NotFoundException(`Unknown system config: ${code}`);
    }
  }

  private validateRuntimeSnapshot(updates: ParsedSystemConfigUpdates, configs: Map<SystemConfig['code'], SystemConfig>): void {
    const serviceContext = {
      operation: updates.operation ?? configs.get(ServiceSystemConfigCode.OPERATION)?.value,
      maintenance: updates.maintenance ?? configs.get(ServiceSystemConfigCode.MAINTENANCE)?.value,
      inquiry: updates.inquiry ?? configs.get(ServiceSystemConfigCode.INQUIRY)?.value,
    };
    const systemContext = {
      notification: updates.notification ?? configs.get(ServiceSystemConfigCode.NOTIFICATION)?.value ?? null,
      oauth: updates.oauth ?? configs.get(ServiceSystemConfigCode.OAUTH)?.value ?? null,
    };
    const serviceResult = ServiceContextSnapshotSchema.safeParse(serviceContext);
    const systemResult = SystemContextSnapshotSchema.safeParse(systemContext);
    if (!serviceResult.success || !systemResult.success) {
      const issues = [
        ...(serviceResult.success ? [] : serviceResult.error.issues),
        ...(systemResult.success ? [] : systemResult.error.issues),
      ];
      throw new ApplicationError({ code: 'SYSTEM_CONFIG_INVALID', status: HttpStatus.BAD_REQUEST, details: issues });
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
    if (code === ServiceSystemConfigCode.NOTIFICATION) {
      const next = this.withPreservedNotificationSecrets(current, incoming);
      assertEnabledNotificationProvidersAreConfigured(next);
      return next;
    }
    if (code !== ServiceSystemConfigCode.OAUTH) return incoming;
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

  private async syncContextsIfChanged(updates: ParsedSystemConfigUpdates): Promise<void> {
    const changed = Object.keys(updates).some((code) => CONTEXT_CONFIG_CODES.includes(code as typeof CONTEXT_CONFIG_CODES[number]));
    if (!changed) return;
    try {
      await this.syncToRedis();
    }
    catch {
      throw new ApplicationError({
        code: 'SYSTEM_CONFIG_RUNTIME_SYNC_FAILED',
        status: HttpStatus.SERVICE_UNAVAILABLE,
      });
    }
  }
}
