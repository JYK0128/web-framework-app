import 'reflect-metadata';

import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createServerI18n } from '@pkg/shared/server';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { env } from './env';
import enLocales from './locales/en.json';
import koLocales from './locales/ko.json';

async function bootstrap(): Promise<void> {
  if (env.DATABASE_PATH !== ':memory:') {
    mkdirSync(dirname(env.DATABASE_PATH), { recursive: true });
  }

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({
    forbidNonWhitelisted: true,
    transform: true,
    whitelist: true,
  }));
  app.use(helmet());

  const { middleware: i18nMiddleware } = await createServerI18n({
    resources: {
      en: { translation: enLocales },
      ko: { translation: koLocales },
    },
  });
  app.use(i18nMiddleware);

  app.enableCors({
    origin: env.CORS_ORIGINS.includes('*') ? true : env.CORS_ORIGINS,
    credentials: true,
  });

  if (env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Nest Starter Kit')
      .setDescription('NestJS + MikroORM Starter Kit API')
      .setVersion('1.0.0')
      .addCookieAuth(env.COOKIE_NAME)
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, swaggerDocument, { useGlobalPrefix: true });
  }

  app.enableShutdownHooks();

  await app.listen(env.PORT, '0.0.0.0');
  console.log(`Auth server listening on http://localhost:${env.PORT}/api/v1`);
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to bootstrap auth server', error);
  process.exitCode = 1;
});
