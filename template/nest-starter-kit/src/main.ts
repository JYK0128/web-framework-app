import 'reflect-metadata';

import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApplicationError, createI18n } from '@pkg/shared/common';
import { createExpressI18nMiddleware, HttpLanguageDetector } from '@pkg/shared/server';
import helmet from 'helmet';

import { API_PREFIX } from '#/common/constants/app.constants';
import { ApiErrorResponseDto } from '#/common/dto/api-response.dto';
import { cookieNames } from '#/common/security/cookie.config';
import { CustomLoggerService } from '#/common/services/custom-logger.service';

import { AppModule } from './app.module';
import { env } from './env';
import enLocales from './locales/en.json';
import koLocales from './locales/ko.json';

async function bootstrap(): Promise<void> {
  if (env.DATABASE_URL.startsWith('sqlite:')) {
    const dbFilePath = env.DATABASE_URL.replace(/^sqlite:\/\/\/?/, '');
    if (dbFilePath !== ':memory:' && dbFilePath.includes('/')) {
      mkdirSync(dirname(dbFilePath), { recursive: true });
    }
  }

  const logger = new CustomLoggerService();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.set('query parser', 'extended');
  app.useLogger(logger);
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(new ValidationPipe({
    forbidNonWhitelisted: true,
    exceptionFactory: (errors) => new ApplicationError({
      code: 'VALIDATION_ERROR',
      status: HttpStatus.BAD_REQUEST,
      details: errors,
    }),
    transform: true,
    whitelist: true,
  }));
  app.use(helmet());

  const i18n = createI18n({
    modules: [HttpLanguageDetector],
    detection: {
      order: ['cookie', 'header'],
      caches: [],
    },
    resources: {
      en: { translation: enLocales },
      ko: { translation: koLocales },
    },
  });
  app.use(createExpressI18nMiddleware(i18n));

  app.enableCors({
    origin: env.CORS_ORIGINS.includes('*') ? true : env.CORS_ORIGINS,
    credentials: true,
    exposedHeaders: ['x-csrf-token'],
  });

  if (env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Nest Starter Kit')
      .setDescription('NestJS + MikroORM Starter Kit API')
      .setVersion('1.0.0')
      .addCookieAuth(cookieNames.session)
      .addCookieAuth(cookieNames.twoFactor)
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig, {
      extraModels: [ApiErrorResponseDto],
    });
    SwaggerModule.setup('docs', app, swaggerDocument, { useGlobalPrefix: true });
  }

  app.enableShutdownHooks();

  await app.listen(env.PORT, '0.0.0.0');
  logger.log(`Auth server listening on http://localhost:${env.PORT}/${API_PREFIX}`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  new CustomLoggerService().error('Failed to bootstrap auth server', String(error), 'Bootstrap');
  process.exit(1);
});
