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
import { ExpressSessionMiddleware } from '#/common/middlewares/express-session.middleware';
import { LoggerService } from '#/common/services/logger/logger.service';
import { RedisIoAdapter } from '#/common/services/redis/redis-io.adapter';
import { AppEntityManager } from '#/database/entity-manager';

import { AppModule } from './app.module';
import { env } from './env';
import enLocales from './locales/en.json';
import koLocales from './locales/ko.json';

function ensureSqliteDirectory(): void {
  if (!env.DATABASE_URL.startsWith('sqlite:')) return;
  const dbFilePath = env.DATABASE_URL.replace(/^sqlite:\/\/\/?/, '');
  if (dbFilePath !== ':memory:' && dbFilePath.includes('/')) {
    mkdirSync(dirname(dbFilePath), { recursive: true });
  }
}

function setupSwagger(app: NestExpressApplication): void {
  if (env.NODE_ENV === 'production') return;
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Nest Starter Kit')
    .setDescription('NestJS + MikroORM Starter Kit API')
    .setVersion('1.0.0')
    .addCookieAuth('session')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig, {
    extraModels: [ApiErrorResponseDto],
  });
  SwaggerModule.setup('docs', app, swaggerDocument, { useGlobalPrefix: true });
}

async function bootstrap(): Promise<void> {
  ensureSqliteDirectory();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  const redisIoAdapter = new RedisIoAdapter(
    app,
    app.get(ExpressSessionMiddleware),
    app.get(AppEntityManager),
  );
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);
  app.set('query parser', 'extended');
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
      order: ['header'],
      caches: [],
    },
    resources: {
      en: { translation: enLocales },
      ko: { translation: koLocales },
    },
  });
  app.use(createExpressI18nMiddleware(i18n));

  setupSwagger(app);
  app.enableShutdownHooks(['SIGTERM', 'SIGINT', 'SIGUSR2']);
  await app.listen(env.PORT, '0.0.0.0');

  logger.log(`Auth server listening on http://localhost:${env.PORT}/${API_PREFIX}`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  console.error('[Bootstrap Error]', error);
  process.exit(1);
});
