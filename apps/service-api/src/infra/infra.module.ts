import { resolve } from 'node:path';

import { Global, Module } from '@nestjs/common';

import { SERVICE_RUNTIME_CONFIG } from '#/app.config';
import { env } from '#/env';
import { AlertModule } from '#/infra/alert';
import { MachineModule } from '#/infra/auth/machine/machine.module';
import { UserAuthModule } from '#/infra/auth/user/user-auth.module';
import { DatabaseModule } from '#/infra/database/database.module';
import { EventBrokerModule } from '#/infra/event-broker/event-broker.module';
import { KvStoreModule } from '#/infra/kv-store/kv-store.module';
import { LogTelemetryModule } from '#/infra/log-telemetry';
import { LoggerModule } from '#/infra/logger';
import { NotificationModule } from '#/infra/notification/notification.module';
import { RealtimeModule } from '#/infra/realtime/realtime.module';
import { StorageModule } from '#/infra/storage/storage.module';

const telemetryModule = env.LOKI_URL
  ? LogTelemetryModule.forRoot({ appName: 'service-api', loki: { url: env.LOKI_URL, timeoutMs: 5000 } })
  : null;

const infraModules = [
  DatabaseModule,
  KvStoreModule.forRoot({ driver: 'redis', redis: { url: env.REDIS_URL } }),
  EventBrokerModule.forRoot({ redisPubSub: { url: env.REDIS_URL, topic: 'events' } }),
  RealtimeModule.forRoot({ socketIo: { redis: { url: env.REDIS_URL } } }),
  UserAuthModule.forRoot({ driver: 'jwt', tokenStore: 'redis' }),
  MachineModule.forRoot({ driver: 'jwt', connection: { targetService: 'admin-api', baseUrl: env.ADMIN_API_URL } }),
  NotificationModule,
  StorageModule.forRoot({
    driver: env.STORAGE_DRIVER,
    local: {
      baseDir: resolve(process.cwd(), SERVICE_RUNTIME_CONFIG.storage.localDirectory),
      publicUrlPrefix: SERVICE_RUNTIME_CONFIG.storage.publicUrlPrefix,
      uploadUrlPrefix: SERVICE_RUNTIME_CONFIG.storage.uploadUrlPrefix,
    },
    ...(env.STORAGE_DRIVER === 's3'
      ? {
        s3: {
          bucket: env.STORAGE_S3_BUCKET!,
          region: env.STORAGE_S3_REGION,
          endpoint: env.STORAGE_S3_ENDPOINT,
          accessKeyId: env.STORAGE_S3_ACCESS_KEY_ID,
          secretAccessKey: env.STORAGE_S3_SECRET_ACCESS_KEY,
          publicUrlPrefix: env.STORAGE_S3_PUBLIC_URL_PREFIX,
        },
      }
      : {}),
  }),
  LoggerModule.forRoot({ appName: 'service-api' }),
  AlertModule.forRoot(),
  ...(telemetryModule ? [telemetryModule] : []),
];

const infraExports = [
  DatabaseModule,
  KvStoreModule,
  EventBrokerModule,
  RealtimeModule,
  UserAuthModule,
  MachineModule,
  NotificationModule,
  StorageModule,
  LoggerModule,
  AlertModule,
  ...(telemetryModule ? [LogTelemetryModule] : []),
];

@Global()
@Module({ imports: infraModules, exports: infraExports })
export class InfraModule {}
