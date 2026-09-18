import { Global, HttpStatus, Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ApplicationError } from '@pkg/shared/common';
import { ClsModule } from 'nestjs-cls';

import { REQUEST_RATE_LIMIT_MAX_REQUESTS, REQUEST_RATE_LIMIT_TTL_MS } from '#/common/configs/application.config';
import { UserContext } from '#/common/contexts/user.context';
import { ApplicationErrorFilter } from '#/common/filters/application-error.filter';
import { HttpExceptionFilter } from '#/common/filters/http-exception.filter';
import { UnexpectedExceptionFilter } from '#/common/filters/unexpected-exception.filter';
import { JwtAuthGuard } from '#/common/guards/jwt-auth.guard';
import { PermissionGuard } from '#/common/guards/permission.guard';
import { ResponseTransformInterceptor } from '#/common/interceptors/response-transform.interceptor';
import { RequestContextMiddleware } from '#/common/middlewares/request-context.middleware';
import { RequestLoggingMiddleware } from '#/common/middlewares/request-logging.middleware';
import { SanitizeHtmlPipe, TrimStringPipe } from '#/common/pipes/index';
import { TokenStoreService } from '#/common/services/token-store.service';
import { env } from '#/env';

const GLOBAL_GUARDS = [
  ThrottlerGuard,
  JwtAuthGuard,
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
    JwtModule.register({
      global: true,
      secret: env.APP_SECRET,
      signOptions: {
        issuer: 'admin-api',
        audience: 'admin-api',
        expiresIn: '180s',
      },
    }),
  ],
  providers: [
    UserContext,
    TokenStoreService,
    RequestContextMiddleware,
    RequestLoggingMiddleware,
    ...GLOBAL_GUARDS,
    ...GLOBAL_FILTERS,
    ...GLOBAL_INTERCEPTORS,
    ...GLOBAL_PIPES,
  ],
  exports: [
    UserContext,
    TokenStoreService,
    RequestContextMiddleware,
    RequestLoggingMiddleware,
    JwtModule,
  ],
})
export class CoreModule {}
