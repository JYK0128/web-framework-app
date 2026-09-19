import { Global, HttpStatus, Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ApplicationError } from '@pkg/shared/common';
import { ClsModule } from 'nestjs-cls';

import { PrincipalContext } from '#/common/contexts/principal.context';
import { ApplicationErrorFilter } from '#/common/filters/application-error.filter';
import { HttpExceptionFilter } from '#/common/filters/http-exception.filter';
import { UnexpectedExceptionFilter } from '#/common/filters/unexpected-exception.filter';
import { AuthenticationGuard } from '#/common/guards/authentication.guard';
import { MachineAuthGuard } from '#/common/guards/machine-auth.guard';
import { PermissionGuard } from '#/common/guards/permission.guard';
import { UserAuthGuard } from '#/common/guards/user-auth.guard';
import { ResponseTransformInterceptor } from '#/common/interceptors/response-transform.interceptor';
import { RequestContextMiddleware } from '#/common/middlewares/request-context.middleware';
import { RequestLoggingMiddleware } from '#/common/middlewares/request-logging.middleware';
import { SanitizeHtmlPipe, TrimStringPipe } from '#/common/pipes/index';
import { TokenStoreService } from '#/common/services/token-store.service';
import { REQUEST_RATE_LIMIT_MAX_REQUESTS, REQUEST_RATE_LIMIT_TTL_MS } from '#/config';

const GLOBAL_GUARDS = [
  ThrottlerGuard,
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
    ThrottlerModule.forRoot([{
      ttl: REQUEST_RATE_LIMIT_TTL_MS,
      limit: REQUEST_RATE_LIMIT_MAX_REQUESTS,
    }]),
  ],
  providers: [
    PrincipalContext,
    UserAuthGuard,
    MachineAuthGuard,
    TokenStoreService,
    RequestContextMiddleware,
    RequestLoggingMiddleware,
    ...GLOBAL_GUARDS,
    ...GLOBAL_FILTERS,
    ...GLOBAL_INTERCEPTORS,
    ...GLOBAL_PIPES,
  ],
  exports: [
    PrincipalContext,
    TokenStoreService,
    RequestContextMiddleware,
    RequestLoggingMiddleware,
  ],
})
export class CoreModule {}
