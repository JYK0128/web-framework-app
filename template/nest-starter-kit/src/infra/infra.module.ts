import { Global, Module } from '@nestjs/common';

import { env } from '#/env';
import { DatabaseModule } from '#/infra/database';
import { EventBrokerModule } from '#/infra/event-broker';
import { LoggerModule } from '#/infra/logger/logger.module';
import { NotificationModule } from '#/infra/notification/notification.module';
import { OAuthModule } from '#/infra/oauth/oauth.module';
import { PortOneModule } from '#/infra/portone';
import { RedisModule } from '#/infra/redis';
import { SocketIoModule } from '#/infra/socket-io';
import { LogTelemetryModule } from '#/infra/log-telemetry';

@Global()
@Module({
  imports: [
    DatabaseModule,
    LoggerModule.forRoot({
      appName: env.APP_NAME,
    }),
    RedisModule.forRoot({
      url: env.REDIS_URL,
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
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    }),
    NotificationModule.forRoot({
      email: {
        smtp: {
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: env.SMTP_SECURE,
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
          from: env.SMTP_FROM,
        },
      },
      messenger: {
        slack: {
          webhookUrl: env.SLACK_WEBHOOK_URL,
        },
      },
    }),
    PortOneModule.forRoot({
      apiSecret: env.PORTONE_API_SECRET,
      baseUrl: 'https://api.portone.io',
      timeoutMs: 5000,
    }),
    EventBrokerModule.forRoot({
      inMemory: true,
      redis: {
        url: env.REDIS_URL,
        topic: 'events',
      },
    }),
    SocketIoModule.forRoot({
      redis: {
        url: env.REDIS_URL,
      },
    }),
  ],
  exports: [
    DatabaseModule,
    LoggerModule,
    RedisModule,
    LogTelemetryModule,
    OAuthModule,
    NotificationModule,
    PortOneModule,
    EventBrokerModule,
    SocketIoModule,
  ],
})
export class InfraModule {}
