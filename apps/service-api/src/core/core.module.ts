import { Global, HttpStatus, Module, type ModuleMetadata, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthenticationGuard } from '@pkg/server-core/auth/authentication.guard';
import { MachineAuthModule } from '@pkg/server-core/auth/machine/machine-auth.module';
import { UserAuthModule } from '@pkg/server-core/auth/user/user.module';
import { EventBrokerModule } from '@pkg/server-core/event-broker/event-broker.module';
import { StorageModule } from '@pkg/server-core/file-storage/storage.module';
import { PrincipalContext } from '@pkg/server-core/http/contexts/principal.context';
import { RequestContext } from '@pkg/server-core/http/contexts/request.context';
import { ApplicationErrorFilter } from '@pkg/server-core/http/filters/application-error.filter';
import { HttpExceptionFilter } from '@pkg/server-core/http/filters/http-exception.filter';
import { UnexpectedExceptionFilter } from '@pkg/server-core/http/filters/unexpected-exception.filter';
import { PermissionGuard } from '@pkg/server-core/http/guards/permission.guard';
import { ResponseTransformInterceptor } from '@pkg/server-core/http/interceptors/response-transform.interceptor';
import { RequestContextMiddleware } from '@pkg/server-core/http/middlewares/request-context.middleware';
import { REQUEST_LOGGING_PII_HASH_KEY, RequestLoggingMiddleware } from '@pkg/server-core/http/middlewares/request-logging.middleware';
import { SanitizeHtmlPipe, TrimStringPipe } from '@pkg/server-core/http/pipes/index';
import { KvStoreModule } from '@pkg/server-core/kv-store/kv-store.module';
import { LogTelemetryModule } from '@pkg/server-core/log-telemetry/index';
import { LoggerModule } from '@pkg/server-core/logger/index';
import { NotificationModule } from '@pkg/server-core/notification/notification.module';
import { PhoneIdentityModule } from '@pkg/server-core/phone-identity/phone-identity.module';
import { SOCKET_IO_REDIS_KEY } from '@pkg/server-core/realtime/realtime.interface';
import { RealtimeModule } from '@pkg/server-core/realtime/realtime.module';
import { WebhookModule } from '@pkg/server-core/webhook/webhook.module';
import { ApplicationError } from '@pkg/shared/common';
import { ClsModule } from 'nestjs-cls';

import { MACHINE_ALLOWED_LIST, SECURITY_CONFIG, SERVICE_ID } from '#/app.config';
import { DatabaseModule } from '#/core/database/database.module';
import { env } from '#/env';

import { InternalClient } from './internal-client';
import { OrmAuthReader } from './orm-auth.reader';
import { LocalStorageAdapter } from './storage/local-storage.adapter';
import { S3StorageAdapter } from './storage/s3-storage.adapter';
import { RedisTokenStore } from './stores/redis-token.store';

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
      { reader: OrmAuthReader, tokenStore: RedisTokenStore },
    ),
    MachineAuthModule.forRoot(
      {
        driver: 'jwt',
        connection: { targetService: 'admin-api', baseUrl: env.ADMIN_API_URL },
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
      requestTimeoutSeconds: SECURITY_CONFIG.identityVerification.requestTimeoutSeconds,
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
      redisStreams: { url: env.REDIS_URL, stream: 'service-events' },
    }),
    RealtimeModule.forRoot({
      socketIo: {
        redis: { url: env.REDIS_URL, key: SOCKET_IO_REDIS_KEY },
      },
      sse: {
        redis: { url: env.REDIS_URL, key: 'service-api:sse' },
      },
    }),
  ],
  exports: [EventBrokerModule, RealtimeModule],
} satisfies Pick<ModuleMetadata, 'imports' | 'exports'>;

const STORAGE_MODULES = {
  imports: [StorageModule.forRoot({ local: LocalStorageAdapter, s3: S3StorageAdapter })],
  exports: [StorageModule],
} satisfies Pick<ModuleMetadata, 'imports' | 'exports'>;

const OBSERVABILITY_MODULES = {
  imports: [
    LoggerModule.forRoot({ appName: 'service-api' }),
    LogTelemetryModule.forRoot({ appName: 'service-api', loki: { url: env.LOKI_URL, timeoutMs: 5000 } }),
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
  ...(process.env.NODE_ENV === 'development' ? [] : [ThrottlerGuard]),
  AuthenticationGuard,
  PermissionGuard,
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
  {
    provide: APP_PIPE,
    useClass: TrimStringPipe,
  },
  {
    provide: APP_PIPE,
    useClass: SanitizeHtmlPipe,
  },
  {
    provide: APP_PIPE,
    useValue: new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validationError: { target: true, value: false },
      exceptionFactory: (errors) =>
        new ApplicationError({
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
      middleware: {
        mount: true,
        generateId: true,
        saveReq: true,
        saveRes: true,
      },
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
