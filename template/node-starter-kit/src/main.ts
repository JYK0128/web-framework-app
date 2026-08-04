import { createServer } from 'node:http';

import { AppError, createLogger, uuid, z } from '@pkg/shared/common';
import { createServerI18n } from '@pkg/shared/server';

const logger = createLogger('ServerKit');

// Sample Schema (Zod v4 API)
const UserSchema = z.object({
  email: z.email(),
  age: z.number().min(18),
});

async function bootstrap() {
  const serviceId = uuid();
  const serviceName = 'Server Starter Kit';

  logger.start(`Bootstrapping ${serviceName}...`);

  // 1. Initialize Server i18n (automatically syncs with Zod error messages)
  const { i18n } = await createServerI18n({
    resources: {
      ko: { translation: { welcome: '안녕하세요', server_ready: '서버가 준비되었습니다!' } },
      en: { translation: { welcome: 'Welcome', server_ready: 'Server is ready!' } },
    },
  });

  logger.info(`i18n Status: ${i18n.t('welcome')} (ID: ${serviceId})`);

  // 2. Test Zod validation in KO
  await i18n.changeLanguage('ko');
  const koResult = UserSchema.safeParse({ email: 'invalid-email', age: 10 });
  if (!koResult.success) {
    const valErrKo = new AppError({
      code: 'VALIDATION_ERROR',
      details: koResult.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      })),
    });
    logger.warn('[KO] AppError Validation Caught:', valErrKo.toJSON());
  }

  // 3. Test Zod validation in EN (Dynamic Switch via main i18n)
  await i18n.changeLanguage('en');
  const enResult = UserSchema.safeParse({ email: 'invalid-email', age: 10 });
  if (!enResult.success) {
    const valErrEn = new AppError({
      code: 'VALIDATION_ERROR',
      details: enResult.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      })),
    });
    logger.warn('[EN] AppError Validation Caught:', valErrEn.toJSON());
  }

  logger.success(i18n.t('server_ready'));

  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '0.0.0.0';
  const server = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    response.end(`${serviceName} is running.\n`);
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.off('error', reject);
      logger.success(`${serviceName} listening on http://${host}:${port}`);
      resolve();
    });
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to bootstrap server:', err);
  process.exit(1);
});
