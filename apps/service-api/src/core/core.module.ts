import { resolve } from 'node:path';

import { Global, HttpStatus, Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ApplicationError } from '@pkg/shared/common';
import { ClsModule } from 'nestjs-cls';

import { SECURITY_CONFIG, SERVICE_RUNTIME_CONFIG } from '#/app.config';
import { AlertModule } from '#/core/alert/alert.module';
import { AuthenticationGuard } from '#/core/auth/authentication.guard';
import { MachineModule } from '#/core/auth/machine/machine.module';
import { MachineAuthGuard } from '#/core/auth/machine/machine-auth.guard';
import { UserAuthModule } from '#/core/auth/user/user.module';
import { DatabaseModule } from '#/core/database/database.module';
import { EventBrokerModule } from '#/core/event-broker/event-broker.module';
import { StorageModule } from '#/core/file-storage/storage.module';
import { PrincipalContext } from '#/core/http/contexts/principal.context';
import { RequestContext } from '#/core/http/contexts/request.context';
import { ApplicationErrorFilter } from '#/core/http/filters/application-error.filter';
import { HttpExceptionFilter } from '#/core/http/filters/http-exception.filter';
import { UnexpectedExceptionFilter } from '#/core/http/filters/unexpected-exception.filter';
import { PermissionGuard } from '#/core/http/guards/permission.guard';
import { ResponseTransformInterceptor } from '#/core/http/interceptors/response-transform.interceptor';
import { RequestContextMiddleware } from '#/core/http/middlewares/request-context.middleware';
import { RequestLoggingMiddleware } from '#/core/http/middlewares/request-logging.middleware';
import { SanitizeHtmlPipe, TrimStringPipe } from '#/core/http/pipes/index';
import { KvStoreModule } from '#/core/kv-store/kv-store.module';
import { LogTelemetryModule } from '#/core/log-telemetry';
import { LoggerModule } from '#/core/logger';
import { MessageModule } from '#/core/notification/message.module';
import { PhoneIdentityModule } from '#/core/phone-identity/phone-identity.module';
import { RealtimeModule } from '#/core/realtime/realtime.module';
import { env } from '#/env';

const telemetryModule = env.LOKI_URL
  ? LogTelemetryModule.forRoot({ appName: 'service-api', loki: { url: env.LOKI_URL, timeoutMs: 5000 } })
  : null;

const RESOURCE_MODULES = [
  UserAuthModule.forRoot({ driver: 'jwt', refreshTokenStore: 'redis' }),
  MessageModule,
  AlertModule.forRoot(),
  PhoneIdentityModule,
  MachineModule.forRoot({ driver: 'jwt', connection: { targetService: 'admin-api', baseUrl: env.ADMIN_API_URL } }),
  RealtimeModule.forRoot({ socketIo: { redis: { url: env.REDIS_URL } } }),
  StorageModule.forRoot({
    driver: env.STORAGE_DRIVER,
    local: {
      baseDir: resolve(process.cwd(), SERVICE_RUNTIME_CONFIG.storage.localDirectory),
      publicUrlPrefix: SERVICE_RUNTIME_CONFIG.storage.publicUrlPrefix,
      uploadUrlPrefix: SERVICE_RUNTIME_CONFIG.storage.uploadUrlPrefix,
    },
    ...(env.STORAGE_DRIVER === 's3'
      ? {
        s3: {
          bucket: env.STORAGE_S3_BUCKET!,
          region: env.STORAGE_S3_REGION,
          endpoint: env.STORAGE_S3_ENDPOINT,
          accessKeyId: env.STORAGE_S3_ACCESS_KEY_ID,
          secretAccessKey: env.STORAGE_S3_SECRET_ACCESS_KEY,
          publicUrlPrefix: env.STORAGE_S3_PUBLIC_URL_PREFIX,
        },
      }
      : {}),
  }),
  DatabaseModule,
  KvStoreModule.forRoot({ driver: 'redis', redis: { url: env.REDIS_URL } }),
  ThrottlerModule.forRoot([{
    ttl: SECURITY_CONFIG.rateLimit.windowMs,
    limit: SECURITY_CONFIG.rateLimit.maxRequests,
    blockDuration: SECURITY_CONFIG.rateLimit.blockDurationMilliseconds,
  }]),
  EventBrokerModule.forRoot({ defaultAdapter: 'redis-pubsub', redisPubSub: { url: env.REDIS_URL, topic: 'events' } }),
  LoggerModule.forRoot({ appName: 'service-api' }),
  ...(telemetryModule ? [telemetryModule] : []),
];

const RESOURCE_MODULE_EXPORTS = [
  UserAuthModule,
  MachineModule,
  MessageModule,
  AlertModule,
  PhoneIdentityModule,
  RealtimeModule,
  StorageModule,
  DatabaseModule,
  KvStoreModule,
  EventBrokerModule,
  LoggerModule,
  ...(telemetryModule ? [LogTelemetryModule] : []),
];

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
    ...RESOURCE_MODULES,
  ],
  providers: [
    PrincipalContext,
    RequestContext,
    MachineAuthGuard,
    RequestContextMiddleware,
    RequestLoggingMiddleware,
    ...RESOURCE_MODULE_EXPORTS,
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
  ],
})
export class CoreModule {}
