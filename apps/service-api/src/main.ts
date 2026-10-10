import 'reflect-metadata';

import { resolve } from 'node:path';

import { MikroORM } from '@mikro-orm/core';
import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { SECURITY_CONFIG, SERVICE_RUNTIME_CONFIG } from '#/app.config';
import { ApiErrorResponseDto } from '#/common/interfaces/response/api.response.dto';
import { DatabaseSeeder } from '#/infra/database/seeders/database.seeder';
import { createI18nMiddleware } from '#/infra/i18n/i18n.middleware';
import { LoggerService } from '#/infra/logger/logger.service';
import { SocketIoAdapter } from '#/infra/realtime/adapters/socket-io/socket-io.adapter';
import { serveStorageFiles } from '#/infra/storage/storage.http';

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

  app.useLogger(app.get(LoggerService));
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

  if (env.STORAGE_DRIVER === 'local') {
    await serveStorageFiles(app, {
      directory: resolve(process.cwd(), SERVICE_RUNTIME_CONFIG.storage.localDirectory),
      publicUrlPrefix: SERVICE_RUNTIME_CONFIG.storage.publicUrlPrefix,
      cacheMaxAgeSeconds: SERVICE_RUNTIME_CONFIG.staticAssetsCacheMaxAgeSeconds,
    });
  }
  app.use(createI18nMiddleware());

  setupSwagger(app);

  try {
    const orm = app.get(MikroORM);
    await orm.migrator.up();
    await orm.seeder.seed(DatabaseSeeder);
    console.log('[Bootstrap] Database seed completed');
  }
  catch (err) {
    console.error(`[Bootstrap] Database migration or seed failed: ${err instanceof Error ? err.message : String(err)}`);
    await app.close();
    throw err;
  }

  await app.listen(env.PORT, '0.0.0.0');
  console.log(`service-api listening on :${env.PORT}`);
}

void bootstrap();
