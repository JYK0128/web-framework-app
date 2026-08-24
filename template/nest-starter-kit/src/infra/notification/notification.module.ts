import { type DynamicModule, Module, type Provider, type Type } from '@nestjs/common';

import { NhnEmailAdapter } from './channels/email/adapters/nhn.adapter';
import { SmtpEmailAdapter } from './channels/email/adapters/smtp.adapter';
import { EmailChannel } from './channels/email/email.channel';
import { EMAIL_ADAPTER, type IEmailAdapter } from './channels/email/email.interface';
import { NhnAlimtalkAdapter } from './channels/kakao/adapters/nhn-alimtalk.adapter';
import { KakaoChannel } from './channels/kakao/kakao.channel';
import { KAKAO_ADAPTER } from './channels/kakao/kakao.interface';
import { DiscordMessengerAdapter } from './channels/messenger/adapters/discord.adapter';
import { SlackMessengerAdapter } from './channels/messenger/adapters/slack.adapter';
import { MessengerChannel } from './channels/messenger/messenger.channel';
import { type IMessengerAdapter, MESSENGER_ADAPTER } from './channels/messenger/messenger.interface';
import { NhnSmsAdapter } from './channels/sms/adapters/nhn.adapter';
import { SmsChannel } from './channels/sms/sms.channel';
import { SMS_ADAPTER } from './channels/sms/sms.interface';
import { type INotificationChannel, NOTIFICATION_CHANNELS, NOTIFICATION_MODULE_OPTIONS, type NotificationModuleOptions } from './notification.interface';
import { NotificationService } from './notification.service';
import { TemplateRendererService } from './template-renderer.service';

@Module({})
export class NotificationModule {
  static forRoot(options?: NotificationModuleOptions): DynamicModule {
    const isDiscord = Boolean(options?.messenger?.discord);
    const isNhnEmail = Boolean(options?.email?.nhn);

    const hasEmail = Boolean(options?.email?.smtp || options?.email?.nhn);
    const hasSms = Boolean(options?.sms?.nhn);
    const hasKakao = Boolean(options?.kakao?.nhn);
    const hasMessenger = Boolean(options?.messenger?.slack || options?.messenger?.discord);

    const selectedEmailAdapter: Type<IEmailAdapter> = isNhnEmail
      ? NhnEmailAdapter
      : SmtpEmailAdapter;

    const selectedMessengerAdapter: Type<IMessengerAdapter> = isDiscord
      ? DiscordMessengerAdapter
      : SlackMessengerAdapter;

    const dynamicProviders: Provider[] = [];
    const activeChannels: Type<INotificationChannel>[] = [];

    // Email Adapter & Channel
    if (hasEmail) {
      dynamicProviders.push(
        selectedEmailAdapter,
        {
          provide: EMAIL_ADAPTER,
          useExisting: selectedEmailAdapter,
        },
        EmailChannel,
      );
      activeChannels.push(EmailChannel);
    }

    // SMS Adapter & Channel
    if (hasSms) {
      dynamicProviders.push(
        NhnSmsAdapter,
        {
          provide: SMS_ADAPTER,
          useExisting: NhnSmsAdapter,
        },
        SmsChannel,
      );
      activeChannels.push(SmsChannel);
    }

    // Kakao Adapter & Channel
    if (hasKakao) {
      dynamicProviders.push(
        NhnAlimtalkAdapter,
        {
          provide: KAKAO_ADAPTER,
          useExisting: NhnAlimtalkAdapter,
        },
        KakaoChannel,
      );
      activeChannels.push(KakaoChannel);
    }

    // Messenger Adapter & Channel
    if (hasMessenger) {
      dynamicProviders.push(
        selectedMessengerAdapter,
        {
          provide: MESSENGER_ADAPTER,
          useExisting: selectedMessengerAdapter,
        },
        MessengerChannel,
      );
      activeChannels.push(MessengerChannel);
    }

    return {
      module: NotificationModule,
      global: true,
      providers: [
        {
          provide: NOTIFICATION_MODULE_OPTIONS,
          useValue: options ?? {},
        },
        ...dynamicProviders,
        TemplateRendererService,
        {
          provide: NOTIFICATION_CHANNELS,
          useFactory: (...channels: INotificationChannel[]) => channels,
          inject: activeChannels,
        },
        NotificationService,
      ],
      exports: [
        NotificationService,
        TemplateRendererService,
      ],
    };
  }
}
