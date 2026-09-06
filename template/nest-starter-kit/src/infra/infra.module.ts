import { Global, Module } from '@nestjs/common';

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
        timeoutMs: 5000,
      },
    }),
    OAuthModule.forRoot({
      callbackUrl: env.FRONTEND_URL,
      providers: {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
      },
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
