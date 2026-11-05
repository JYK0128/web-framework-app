import { Global, HttpStatus, Module, type ModuleMetadata, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthenticationGuard, MachineAuthModule, REDIS_AUTH_STORE_NAMESPACE, RedisTokenStore, UserAuthModule } from '@pkg/server-core/auth';
import { EventBrokerModule } from '@pkg/server-core/event-broker';
import { CDN_FILE_STORAGE_OPTIONS, CDNStorageAdapter, FileStorageModule, LOCAL_FILE_STORAGE_OPTIONS, LocalStorageAdapter, S3_FILE_STORAGE_OPTIONS, S3StorageAdapter } from '@pkg/server-core/file-storage';
import { PrincipalContext, RequestContext } from '@pkg/server-core/http/contexts';
import { ApplicationErrorFilter, HttpExceptionFilter, UnexpectedExceptionFilter } from '@pkg/server-core/http/filters';
import { PermissionGuard } from '@pkg/server-core/http/guards';
import { ResponseTransformInterceptor } from '@pkg/server-core/http/interceptors';
import { InternalClient } from '@pkg/server-core/http/internal-client';
import { REQUEST_LOGGING_PII_HASH_KEY, RequestContextMiddleware, RequestLoggingMiddleware } from '@pkg/server-core/http/middlewares';
import { SanitizeHtmlPipe, TrimStringPipe } from '@pkg/server-core/http/pipes';
import { KvStoreModule } from '@pkg/server-core/kv-store';
import { LogTelemetryModule } from '@pkg/server-core/log-telemetry';
import { LoggerModule } from '@pkg/server-core/logger';
import { NotificationModule } from '@pkg/server-core/notification';
import { PhoneIdentityModule } from '@pkg/server-core/phone-identity';
import { RealtimeModule, SOCKET_IO_REDIS_KEY } from '@pkg/server-core/realtime';
import { WebhookModule } from '@pkg/server-core/webhook';
import { ApplicationError } from '@pkg/shared/common';
import { ClsModule } from 'nestjs-cls';

import { ADMIN_RUNTIME_CONFIG, MACHINE_ALLOWED_LIST, SECURITY_CONFIG, SERVICE_ID } from '~/app.config';
import { DatabaseModule } from '~/core/database/database.module';
import { SystemContext } from '~/core/system.context';
import { env } from '~/env';

import { OrmAuthReader } from './orm-auth.reader';

const PERSISTENCE_MODULES = {
  imports: [
    DatabaseModule,
    KvStoreModule.forRoot({
      driver: 'redis',
      redis: { url: env.REDIS_URL },
    }),
  ],
  exports: [DatabaseModule, KvStoreModule],
} satisfies Pick<ModuleMetadata, 'imports' | 'exports'>;

const AUTH_MODULES = {
  imports: [
    UserAuthModule.forRoot(
      {
        driver: 'jwt',
        jwt: {
          secret: env.USER_JWT_SECRET,
          issuer: SERVICE_ID,
          audience: SERVICE_ID,
          accessTokenTtlMinutes: SECURITY_CONFIG.token.accessTokenTtlMinutes,
          refreshIdleTimeoutMinutes: SECURITY_CONFIG.token.refreshIdleTimeoutMinutes,
          rememberMeDays: SECURITY_CONFIG.token.rememberMeDays,
          revokeOnLogin: SECURITY_CONFIG.token.revokeOnLogin,
        },
        policy: {
          requirePhoneNumberVerification: SECURITY_CONFIG.registration.requirePhoneNumberVerification,
          passwordExpirationDays: SECURITY_CONFIG.password.expirationDays,
          passwordChangeDeferDays: SECURITY_CONFIG.password.changeDeferDays,
          twoFactorRequired: SECURITY_CONFIG.twoFactor.required,
        },
      },
      { reader: OrmAuthReader, tokenStore: RedisTokenStore, providers: [{ provide: REDIS_AUTH_STORE_NAMESPACE, useValue: SERVICE_ID }] },
    ),
    MachineAuthModule.forRoot(
      {
        driver: 'jwt',
        connection: { targetService: 'service-api', baseUrl: env.SERVICE_API_URL },
        auth: {
          serviceId: SERVICE_ID,
          allowedIssuers: MACHINE_ALLOWED_LIST,
          secret: env.MACHINE_JWT_SECRET,
          tokenTtlMinutes: SECURITY_CONFIG.token.machineTokenTtlMinutes,
          apiKeys: [],
        },
      },
      { internalClient: InternalClient },
    ),
  ],
  exports: [UserAuthModule, MachineAuthModule],
} satisfies Pick<ModuleMetadata, 'imports' | 'exports'>;

const INTEGRATION_MODULES = {
  imports: [
    NotificationModule.forRoot({
      requestTimeoutSeconds: SECURITY_CONFIG.integrations.notificationProviderRequestTimeoutSeconds,
      pushMessageTtlMinutes: SECURITY_CONFIG.integrations.pushMessageTtlMinutes,
      smtpConnectionTimeoutSeconds: SECURITY_CONFIG.integrations.smtp.connectionTimeoutSeconds,
      smtpGreetingTimeoutSeconds: SECURITY_CONFIG.integrations.smtp.greetingTimeoutSeconds,
      smtpSocketTimeoutSeconds: SECURITY_CONFIG.integrations.smtp.socketTimeoutSeconds,
    }),
    WebhookModule,
    PhoneIdentityModule.forRoot({
      apiSecret: env.PORTONE_API_SECRET,
      requestTimeoutSeconds: 5,
      retry: {
        maxRetries: SECURITY_CONFIG.identityVerification.maxRetries,
        initialDelayMs: SECURITY_CONFIG.identityVerification.retryDelayMilliseconds,
        maxDelayMs: SECURITY_CONFIG.identityVerification.retryMaxDelayMilliseconds,
        backoffFactor: SECURITY_CONFIG.identityVerification.retryBackoffFactor,
        jitter: SECURITY_CONFIG.identityVerification.retryJitterEnabled,
      },
    }),
  ],
  exports: [NotificationModule, WebhookModule, PhoneIdentityModule],
} satisfies Pick<ModuleMetadata, 'imports' | 'exports'>;

const MESSAGING_MODULES = {
  imports: [
    EventBrokerModule.forRoot({
      defaultAdapter: 'redis-pubsub',
      redisPubSub: { url: env.REDIS_URL, topic: 'events' },
      redisStreams: { url: env.REDIS_URL, stream: 'admin-events' },
    }),
    RealtimeModule.forRoot({
      socketIo: { redis: { url: env.REDIS_URL, key: SOCKET_IO_REDIS_KEY } },
      sse: { redis: { url: env.REDIS_URL, key: 'admin-api:sse' } },
    }),
  ],
  exports: [EventBrokerModule, RealtimeModule],
} satisfies Pick<ModuleMetadata, 'imports' | 'exports'>;

const STORAGE_MODULES = {
  imports: [FileStorageModule.forRoot({ local: LocalStorageAdapter, s3: S3StorageAdapter, cdn: CDNStorageAdapter }, [
    { provide: LOCAL_FILE_STORAGE_OPTIONS, useValue: ADMIN_RUNTIME_CONFIG.storage },
    { provide: S3_FILE_STORAGE_OPTIONS, useValue: { bucket: env.AWS_S3_BUCKET, region: env.AWS_S3_REGION, endpoint: env.AWS_S3_ENDPOINT, awsConfigFile: env.AWS_CONFIG_FILE, awsProfile: env.AWS_PROFILE } },
    { provide: CDN_FILE_STORAGE_OPTIONS, useValue: { baseUrl: env.CDN_URL } },
  ])],
  exports: [FileStorageModule],
} satisfies Pick<ModuleMetadata, 'imports' | 'exports'>;

const OBSERVABILITY_MODULES = {
  imports: [
    LoggerModule.forRoot({ appName: 'admin-api' }),
    LogTelemetryModule.forRoot({
      appName: 'admin-api',
      loki: { url: env.LOKI_URL, timeoutMs: 5000 },
    }),
  ],
  exports: [LoggerModule, LogTelemetryModule],
} satisfies Pick<ModuleMetadata, 'imports' | 'exports'>;

const REQUEST_MODULES = {
  imports: [
    ThrottlerModule.forRoot([{
      ttl: SECURITY_CONFIG.rateLimit.windowMs,
      limit: SECURITY_CONFIG.rateLimit.maxRequests,
      blockDuration: SECURITY_CONFIG.rateLimit.blockDurationMilliseconds,
    }]),
  ],
  exports: [],
} satisfies Pick<ModuleMetadata, 'imports' | 'exports'>;

const GLOBAL_GUARDS = [
  AuthenticationGuard,
  PermissionGuard,
  ...(env.NODE_ENV === 'development' ? [] : [ThrottlerGuard]),
].map((useClass) => ({ provide: APP_GUARD, useClass }));

const GLOBAL_FILTERS = [
  UnexpectedExceptionFilter,
  HttpExceptionFilter,
  ApplicationErrorFilter,
].map((useClass) => ({ provide: APP_FILTER, useClass }));

const GLOBAL_INTERCEPTORS = [
  ResponseTransformInterceptor,
].map((useClass) => ({ provide: APP_INTERCEPTOR, useClass }));

const GLOBAL_PIPES = [
  { provide: APP_PIPE, useClass: TrimStringPipe },
  { provide: APP_PIPE, useClass: SanitizeHtmlPipe },
  {
    provide: APP_PIPE,
    useValue: new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validationError: { target: true, value: false },
      exceptionFactory: (errors) => new ApplicationError({
        code: 'VALIDATION_ERROR',
        status: HttpStatus.BAD_REQUEST,
        details: errors,
      }),
    }),
  },
];

@Global()
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true, generateId: true, saveReq: true, saveRes: true },
    }),
    ...PERSISTENCE_MODULES.imports,
    ...AUTH_MODULES.imports,
    ...INTEGRATION_MODULES.imports,
    ...MESSAGING_MODULES.imports,
    ...STORAGE_MODULES.imports,
    ...OBSERVABILITY_MODULES.imports,
    ...REQUEST_MODULES.imports,
  ],
  providers: [
    PrincipalContext,
    RequestContext,
    SystemContext,
    RequestContextMiddleware,
    RequestLoggingMiddleware,
    { provide: REQUEST_LOGGING_PII_HASH_KEY, useValue: env.PII_HASH_KEY },
    ...GLOBAL_GUARDS,
    ...GLOBAL_FILTERS,
    ...GLOBAL_INTERCEPTORS,
    ...GLOBAL_PIPES,
  ],
  exports: [
    PrincipalContext,
    RequestContext,
    SystemContext,
    RequestContextMiddleware,
    RequestLoggingMiddleware,
    REQUEST_LOGGING_PII_HASH_KEY,
    ...PERSISTENCE_MODULES.exports,
    ...AUTH_MODULES.exports,
    ...INTEGRATION_MODULES.exports,
    ...MESSAGING_MODULES.exports,
    ...STORAGE_MODULES.exports,
    ...OBSERVABILITY_MODULES.exports,
    ...REQUEST_MODULES.exports,
  ],
})
export class CoreModule {}
