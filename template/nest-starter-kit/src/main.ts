import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createI18n } from '@pkg/shared/common';
import { createExpressI18nMiddleware, HttpLanguageDetector } from '@pkg/shared/server';
import helmet from 'helmet';

import { API_PREFIX } from '#/common/constants/app.constants';
import { ApiErrorResponseDto } from '#/common/dto/api-response.dto';
import { LoggerService } from '#/infra/logger/logger.service';
import { SocketIoAdapter } from '#/infra/socket-io';

import { AppModule } from './app.module';
import { env } from './env';
import enLocales from './locales/en.json';
import koLocales from './locales/ko.json';

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
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const logger = app.get(LoggerService);
  app.useLogger(logger);
  app.useWebSocketAdapter(app.get(SocketIoAdapter).init(app));

  app.set('query parser', 'extended');
  app.setGlobalPrefix(API_PREFIX);
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
