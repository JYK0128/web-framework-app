import 'reflect-metadata';

import { MikroORM } from '@mikro-orm/core';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { API_PREFIX, BODY_PARSER_LIMIT } from '#/common/configs/application.config';
import { ApiErrorResponseDto } from '#/common/dto/api-response.dto';

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

  app.useBodyParser('json', { limit: BODY_PARSER_LIMIT });
  app.useBodyParser('urlencoded', { extended: true, limit: BODY_PARSER_LIMIT });

  app.set('trust proxy', true);
  app.set('query parser', 'extended');
  app.setGlobalPrefix(API_PREFIX);
  app.use(helmet());

  app.enableCors({
    origin: false,
  });

  setupSwagger(app);

  try {
    const orm = app.get(MikroORM);
    await orm.migrator.up();
  }
  catch (err) {
    console.warn(`[Bootstrap] Database schema migration deferred: ${err instanceof Error ? err.message : String(err)}`);
  }

  await app.listen(env.PORT, '0.0.0.0');
  console.log(`admin-api listening on :${env.PORT}`);
}

void bootstrap();
