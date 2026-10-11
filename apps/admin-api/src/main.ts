import 'reflect-metadata';

import { resolve } from 'node:path';

import { MikroORM } from '@mikro-orm/core';
import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { ADMIN_RUNTIME_CONFIG, SECURITY_CONFIG } from '#/app.config';
import { DatabaseSeeder } from '#/core/database/seeders/database.seeder';
import { serveStorageFiles } from '#/core/file-storage/storage.http';
import { ApiErrorResponseDto } from '#/core/http/dto/response/api.response.dto';
import { createI18nMiddleware } from '#/core/http/middlewares/i18n.middleware';
import { LoggerService } from '#/core/logger/logger.service';
import { SocketIoAdapter } from '#/core/realtime/adapters/socket-io.adapter';

import { AppModule } from './app.module';
import { env } from './env';

function setupSwagger(app: NestExpressApplication): void {
  if (env.NODE_ENV === 'production') return;

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Admin API')
    .setDescription('Control Plane Admin API Service')
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
  app.use(helmet());

  app.enableCors({
    origin: false,
  });

  if (env.STORAGE_DRIVER === 'local') {
    await serveStorageFiles(app, {
      directory: resolve(process.cwd(), ADMIN_RUNTIME_CONFIG.storage.localDirectory),
      publicUrlPrefix: ADMIN_RUNTIME_CONFIG.storage.publicUrlPrefix,
      cacheMaxAgeSeconds: ADMIN_RUNTIME_CONFIG.staticAssetsCacheMaxAgeSeconds,
    });
  }
  app.use(createI18nMiddleware());

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
  logger.log(`admin-api listening on :${env.PORT}`, 'Bootstrap');
}

void bootstrap();
