import { Global, HttpStatus, Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ApplicationError } from '@pkg/shared/common';
import { ClsModule } from 'nestjs-cls';

import { SECURITY_CONFIG, SERVICE_ID } from '#/app.config';
import { PrincipalContext } from '#/common/contexts/principal.context';
import { RequestContext } from '#/common/contexts/request.context';
import { ApplicationErrorFilter } from '#/common/filters/application-error.filter';
import { HttpExceptionFilter } from '#/common/filters/http-exception.filter';
import { UnexpectedExceptionFilter } from '#/common/filters/unexpected-exception.filter';
import { AuthenticationGuard } from '#/common/guards/authentication.guard';
import { PermissionGuard } from '#/common/guards/permission.guard';
import { ResponseTransformInterceptor } from '#/common/interceptors/response-transform.interceptor';
import { UnitOfWorkInterceptor } from '#/common/interceptors/unit-of-work.interceptor';
import { RequestContextMiddleware } from '#/common/middlewares/request-context.middleware';
import { RequestLoggingMiddleware } from '#/common/middlewares/request-logging.middleware';
import { SanitizeHtmlPipe, TrimStringPipe } from '#/common/pipes/index';
import { MachineAuthGuard } from '#/infra/auth/machine/machine-auth.guard';
import { UserAuthGuard } from '#/infra/auth/user/user-auth.guard';
import { KvStore } from '#/infra/kv-store/kv-store.service';
import { KvStoreThrottlerStorage } from '#/infra/kv-store/kv-store-throttler-storage';

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
  UnitOfWorkInterceptor,
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
    ThrottlerModule.forRootAsync({
      inject: [KvStore],
      useFactory: (kvStore: KvStore) => ({
        throttlers: [{
          ttl: SECURITY_CONFIG.rateLimit.windowMs,
          limit: SECURITY_CONFIG.rateLimit.maxRequests,
          blockDuration: SECURITY_CONFIG.rateLimit.blockDurationMilliseconds,
        }],
        storage: new KvStoreThrottlerStorage(kvStore, SERVICE_ID),
      }),
    }),
  ],
  providers: [
    PrincipalContext,
    RequestContext,
    UserAuthGuard,
    MachineAuthGuard,
    RequestContextMiddleware,
    RequestLoggingMiddleware,
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
