import { Global, Module } from '@nestjs/common';

import { LOKI_HTTP_TIMEOUT_MS } from '#/common/configs/runtime.config';
import { env } from '#/env';
import { AlertModule } from '#/infra/alert';
import { DatabaseModule } from '#/infra/database';
import { EventBrokerModule } from '#/infra/event-broker';
import { KvStoreModule } from '#/infra/kv-store';
import { LogTelemetryModule } from '#/infra/log-telemetry';
import { LoggerModule } from '#/infra/logger';
import { NotificationModule } from '#/infra/notification';
import { OAuthModule } from '#/infra/oauth';
import { PortOneModule } from '#/infra/portone';
import { RealtimeModule } from '#/infra/realtime';

@Global()
@Module({
  imports: [
    DatabaseModule,
    LoggerModule.forRoot({
      appName: env.APP_NAME,
    }),
    KvStoreModule.forRoot({
      driver: 'redis',
      redis: {
        url: env.REDIS_URL,
      },
    }),
    LogTelemetryModule.forRoot({
      appName: env.APP_NAME,
      loki: {
        url: env.LOKI_URL,
        timeoutMs: LOKI_HTTP_TIMEOUT_MS,
      },
    }),
    OAuthModule.forRoot({
      callbackUrl: env.FRONTEND_URL,
    }),
    NotificationModule.forRoot(),
    AlertModule.forRoot(),
    PortOneModule.forRoot({
      apiSecret: env.PORTONE_API_SECRET,
    }),
    EventBrokerModule.forRoot({
      redisPubSub: {
        url: env.REDIS_URL,
        topic: 'events',
      },
    }),
    RealtimeModule.forRoot({
      socketIo: {
        redis: {
          url: env.REDIS_URL,
        },
      },
    }),
  ],
  exports: [
    DatabaseModule,
    LoggerModule,
    KvStoreModule,
    LogTelemetryModule,
    OAuthModule,
    NotificationModule,
    AlertModule,
    PortOneModule,
    EventBrokerModule,
    RealtimeModule,
  ],
})
export class InfraModule {}
