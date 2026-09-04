import { MikroORM } from '@mikro-orm/core';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createI18n } from '@pkg/shared/common';
import helmet from 'helmet';
import * as i18nextHttpMiddleware from 'i18next-http-middleware';

import { API_PREFIX } from '#/common/configs/app.config';
import { ApiErrorResponseDto } from '#/common/dto/api-response.dto';
import { LoggerService } from '#/infra/logger/logger.service';
import { SocketIoAdapter } from '#/infra/realtime';

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
  app.useWebSocketAdapter(app.get(SocketIoAdapter));

  const orm = app.get(MikroORM);
  await orm.migrator.up();
  logger.log('Database schema migrations up to date', 'Bootstrap');

  app.useBodyParser('json', { limit: '10mb' });
  app.useBodyParser('urlencoded', { extended: true, limit: '10mb' });

  app.set('trust proxy', true);
  app.set('query parser', 'extended');
  app.setGlobalPrefix(API_PREFIX);
  app.use(helmet());
  app.enableCors({
    origin: false,
  });

  const i18n = createI18n({
    modules: [i18nextHttpMiddleware.LanguageDetector],
    detection: {
      order: ['header'],
      caches: [],
    },
    resources: {
      en: { translation: enLocales },
      ko: { translation: koLocales },
    },
  });
  app.use(i18nextHttpMiddleware.handle(i18n));

  setupSwagger(app);

  await app.listen(env.PORT, '0.0.0.0');
  logger.log(`Application is running on: ${await app.getUrl()}`, 'Bootstrap');
}

void bootstrap();
