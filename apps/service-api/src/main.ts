import 'reflect-metadata';

import { resolve } from 'node:path';

import { MikroORM } from '@mikro-orm/core';
import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { FileStorageService, serveStorageFiles } from '@pkg/server-core/file-storage';
import { ApiErrorResponseDto } from '@pkg/server-core/http/dto/response';
import { createI18nMiddleware } from '@pkg/server-core/http/middlewares';
import { LoggerService } from '@pkg/server-core/logger';
import { SocketIoAdapter } from '@pkg/server-core/realtime';
import helmet from 'helmet';

import { SECURITY_CONFIG, SERVICE_RUNTIME_CONFIG } from '~/app.config';
import { DatabaseSeeder } from '~/core/database/seeders/database.seeder';
import en from '~/locales/en.json';
import ko from '~/locales/ko.json';

import { AppModule } from './app.module';
import { env } from './env';

function setupSwagger(app: NestExpressApplication): void {
  if (env.NODE_ENV === 'production') return;

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Service API')
    .setDescription('Data Plane Service API Service')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig, {
    extraModels: [ApiErrorResponseDto],
  });
  SwaggerModule.setup('docs', app, swaggerDocument, { useGlobalPrefix: true });
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(LoggerService);
  app.useLogger(logger);
  app.enableShutdownHooks();
  app.useWebSocketAdapter(app.get(SocketIoAdapter));

  app.useBodyParser('json', { limit: SECURITY_CONFIG.request.bodyMaxSizeBytes });
  app.useBodyParser('raw', { type: ['application/octet-stream', 'image/*'], limit: SECURITY_CONFIG.request.bodyMaxSizeBytes });
  app.useBodyParser('urlencoded', { extended: true, limit: SECURITY_CONFIG.request.bodyMaxSizeBytes });

  app.set('trust proxy', SECURITY_CONFIG.request.trustProxy);
  app.set('query parser', 'extended');
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.use(helmet({ hsts: false }));

  app.enableCors({
    origin: false,
  });

  if (app.get(FileStorageService).has('local')) {
    await serveStorageFiles(app, {
      directory: resolve(process.cwd(), SERVICE_RUNTIME_CONFIG.storage.localDirectory),
      publicUrlPrefix: SERVICE_RUNTIME_CONFIG.storage.publicUrlPrefix,
      cacheMaxAgeSeconds: SERVICE_RUNTIME_CONFIG.staticAssetsCacheMaxAgeSeconds,
    });
  }
  app.use(createI18nMiddleware({ en: { translation: en }, ko: { translation: ko } }));

  setupSwagger(app);

  try {
    const orm = app.get(MikroORM);
    await orm.migrator.up();
    await orm.seeder.seed(DatabaseSeeder);
    logger.log('Database seed completed', 'Bootstrap');
  }
  catch (err) {
    logger.error(`Database migration or seed failed: ${err instanceof Error ? err.message : String(err)}`, 'Bootstrap');
    try {
      await app.close();
    }
    catch (cleanupError) {
      logger.error(`Application shutdown after bootstrap failure failed: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`, 'Bootstrap');
    }
    throw err;
  }

  await app.listen(env.PORT, '0.0.0.0');
  logger.log(`service-api listening on :${env.PORT}`, 'Bootstrap');
}

void bootstrap();
