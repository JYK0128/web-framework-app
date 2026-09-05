import { Global, HttpStatus, Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { MulterModule } from '@nestjs/platform-express';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ApplicationError, MAX_FILE_SIZE } from '@pkg/shared/common';
import { ClsModule } from 'nestjs-cls';

import { REQUEST_RATE_LIMIT_MAX_REQUESTS, REQUEST_RATE_LIMIT_TTL_MS } from '#/common/configs/app.config';
import { ContextModule } from '#/common/contexts/context.module';
import { ApplicationErrorFilter } from '#/common/filters/application-error.filter';
import { HttpExceptionFilter } from '#/common/filters/http-exception.filter';
import { UnexpectedExceptionFilter } from '#/common/filters/unexpected-exception.filter';
import { AuthGuard } from '#/common/guards/auth.guard';
import { EmailVerificationGuard } from '#/common/guards/email-verification.guard';
import { MaintenanceGuard } from '#/common/guards/maintenance.guard';
import { PermissionGuard } from '#/common/guards/permission.guard';
import { PhoneVerificationGuard } from '#/common/guards/phone-verification.guard';
import { SanitizeContextGuard } from '#/common/guards/sanitize-context.guard';
import { TermsAgreementGuard } from '#/common/guards/terms-agreement.guard';
import { ResponseTransformInterceptor } from '#/common/interceptors/response-transform.interceptor';
import { UnitOfWorkInterceptor } from '#/common/interceptors/unit-of-work.interceptor';
import { ExpressSessionMiddleware } from '#/common/middlewares/express-session.middleware';
import { RequestContextMiddleware } from '#/common/middlewares/request-context.middleware';
import { RequestLoggingMiddleware } from '#/common/middlewares/request-logging.middleware';
import { SanitizeHtmlPipe, TrimStringPipe } from '#/common/pipes';
import { StoresModule } from '#/common/stores/stores.module';

// Execution order: SanitizeContext -> Throttler -> Maintenance -> Auth -> Terms -> Phone -> Email -> Permission
const GLOBAL_GUARDS = [
  SanitizeContextGuard,
  ThrottlerGuard,
  MaintenanceGuard,
  AuthGuard,
  TermsAgreementGuard,
  PhoneVerificationGuard,
  EmailVerificationGuard,
  PermissionGuard,
].map((useClass) => ({ provide: APP_GUARD, useClass }));

// Execution order (reverse): ApplicationError -> HttpException -> UnexpectedException
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
    ContextModule,
    ThrottlerModule.forRoot([{
      ttl: REQUEST_RATE_LIMIT_TTL_MS,
      limit: REQUEST_RATE_LIMIT_MAX_REQUESTS,
    }]),
    ScheduleModule.forRoot(),
    StoresModule,
    MulterModule.register({ limits: { fileSize: MAX_FILE_SIZE } }),
  ],
  providers: [
    // Middlewares
    RequestContextMiddleware,
    ExpressSessionMiddleware,
    RequestLoggingMiddleware,

    // Global Pipeline
    ...GLOBAL_GUARDS,
    ...GLOBAL_FILTERS,
    ...GLOBAL_INTERCEPTORS,
    ...GLOBAL_PIPES,
  ],
  exports: [
    ContextModule,
    StoresModule,
    MulterModule,
    RequestContextMiddleware,
    ExpressSessionMiddleware,
    RequestLoggingMiddleware,
  ],
})
export class CoreModule {}
