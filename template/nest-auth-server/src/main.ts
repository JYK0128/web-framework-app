import 'reflect-metadata';

import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { zodOpenApiComponents } from '#/common/openapi/zod-openapi.schemas';

import { AppModule } from './app.module';
import { env } from './env';

async function bootstrap(): Promise<void> {
  if (env.DATABASE_PATH !== ':memory:') {
    mkdirSync(dirname(env.DATABASE_PATH), { recursive: true });
  }

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  app.enableCors({
    origin: env.CORS_ORIGINS.includes('*') ? true : env.CORS_ORIGINS,
    credentials: true,
  });

  if (env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Nest Auth Server')
      .setDescription('NestJS + MikroORM authentication server API')
      .setVersion('1.0.0')
      .addCookieAuth(env.COOKIE_NAME)
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    const zodComponents = zodOpenApiComponents.components as unknown as NonNullable<typeof swaggerDocument.components>;
    swaggerDocument.components = {
      ...swaggerDocument.components,
      ...zodComponents,
      schemas: {
        ...swaggerDocument.components?.schemas,
        ...zodComponents.schemas,
      },
    };
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
