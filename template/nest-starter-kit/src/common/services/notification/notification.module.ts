import { type DynamicModule, Global, Module, type Type } from '@nestjs/common';

import { EmailChannel } from './channels/email/email.channel';
import { EMAIL_PROVIDER, type IEmailProvider } from './channels/email/email.interface';
import { NhnEmailProvider } from './channels/email/providers/nhn.provider';
import { SmtpEmailProvider } from './channels/email/providers/smtp.provider';
import { KakaoChannel } from './channels/kakao/kakao.channel';
import { KAKAO_PROVIDER } from './channels/kakao/kakao.interface';
import { NhnAlimtalkProvider } from './channels/kakao/providers/nhn-alimtalk.provider';
import { MessengerChannel } from './channels/messenger/messenger.channel';
import { type IMessengerProvider, MESSENGER_PROVIDER } from './channels/messenger/messenger.interface';
import { DiscordMessengerProvider } from './channels/messenger/providers/discord.provider';
import { SlackMessengerProvider } from './channels/messenger/providers/slack.provider';
import { NhnSmsProvider } from './channels/sms/providers/nhn.provider';
import { SmsChannel } from './channels/sms/sms.channel';
import { SMS_PROVIDER } from './channels/sms/sms.interface';
import { NOTIFICATION_CHANNELS, NOTIFICATION_MODULE_OPTIONS, type NotificationModuleOptions } from './notification.interface';
import { NotificationService } from './notification.service';

@Global()
@Module({})
export class NotificationModule {
  static forRoot(options?: NotificationModuleOptions): DynamicModule {
    const isDiscord = options?.defaultMessenger === 'discord';
    const emailProviderType = options?.emailProvider ?? 'smtp';

    const selectedEmailProvider: Type<IEmailProvider> = emailProviderType === 'nhn'
      ? NhnEmailProvider
      : SmtpEmailProvider;

    const selectedMessengerProvider: Type<IMessengerProvider> = isDiscord
      ? DiscordMessengerProvider
      : SlackMessengerProvider;

    return {
      module: NotificationModule,
      global: true,
      providers: [
        {
          provide: NOTIFICATION_MODULE_OPTIONS,
          useValue: options ?? {},
        },

        // Email Providers (자체 SMTP / NHN Cloud)
        SmtpEmailProvider,
        NhnEmailProvider,
        {
          provide: EMAIL_PROVIDER,
          useExisting: selectedEmailProvider,
        },

        // SMS Providers (NHN Cloud)
        NhnSmsProvider,
        {
          provide: SMS_PROVIDER,
          useExisting: NhnSmsProvider,
        },

        // Kakao Providers (NHN Cloud 알림톡)
        NhnAlimtalkProvider,
        {
          provide: KAKAO_PROVIDER,
          useExisting: NhnAlimtalkProvider,
        },

        // Messenger Providers (Slack / Discord)
        SlackMessengerProvider,
        DiscordMessengerProvider,
        {
          provide: MESSENGER_PROVIDER,
          useExisting: selectedMessengerProvider,
        },

        // Channels
        EmailChannel,
        SmsChannel,
        KakaoChannel,
        MessengerChannel,

        // Channel Dispatcher Multi-provider
        {
          provide: NOTIFICATION_CHANNELS,
          useFactory: (
            sms: SmsChannel,
            email: EmailChannel,
            kakao: KakaoChannel,
            messenger: MessengerChannel,
          ) => [sms, email, kakao, messenger],
          inject: [SmsChannel, EmailChannel, KakaoChannel, MessengerChannel],
        },
        NotificationService,
      ],
      exports: [
        NotificationService,
        EmailChannel,
        SmsChannel,
        KakaoChannel,
        MessengerChannel,
        EMAIL_PROVIDER,
        SMS_PROVIDER,
        KAKAO_PROVIDER,
        MESSENGER_PROVIDER,
        NOTIFICATION_CHANNELS,
      ],
    };
  }
}
