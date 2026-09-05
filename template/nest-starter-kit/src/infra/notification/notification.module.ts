import { type DynamicModule, Module, type Provider, type Type } from '@nestjs/common';

import { AwsSesEmailAdapter } from './channels/email/adapters/aws-ses.adapter';
import { NhnEmailAdapter } from './channels/email/adapters/nhn-email.adapter';
import { SmtpEmailAdapter } from './channels/email/adapters/smtp.adapter';
import { EmailChannel } from './channels/email/email.channel';
import { EMAIL_ADAPTER, type IEmailAdapter } from './channels/email/email.interface';
import { NhnAlimtalkAdapter } from './channels/kakao/adapters/nhn-alimtalk.adapter';
import { KakaoChannel } from './channels/kakao/kakao.channel';
import { type IKakaoAdapter, KAKAO_ADAPTER } from './channels/kakao/kakao.interface';
import { FirebaseFcmAdapter } from './channels/push/adapters/firebase-fcm.adapter';
import { NhnPushAdapter } from './channels/push/adapters/nhn-push.adapter';
import { PushChannel } from './channels/push/push.channel';
import { type IPushAdapter, PUSH_ADAPTER } from './channels/push/push.interface';
import { AwsSnsSmsAdapter } from './channels/sms/adapters/aws-sns.adapter';
import { NhnSmsAdapter } from './channels/sms/adapters/nhn-sms.adapter';
import { SmsChannel } from './channels/sms/sms.channel';
import { type ISmsAdapter, SMS_ADAPTER } from './channels/sms/sms.interface';
import { type INotificationChannel, NOTIFICATION_CHANNELS, NOTIFICATION_MODULE_OPTIONS, type NotificationModuleOptions } from './notification.interface';
import { NotificationService } from './notification.service';
import { TemplateRendererService } from './template-renderer.service';

@Module({})
export class NotificationModule {
  static forRoot(options?: NotificationModuleOptions): DynamicModule {
    const hasEmail = Boolean(options?.email?.smtp || options?.email?.nhn || options?.email?.ses);
    const hasSms = Boolean(options?.sms?.nhn || options?.sms?.sns);
    const hasKakao = Boolean(options?.kakao?.nhn);
    const hasPush = Boolean(options?.push?.fcm || options?.push?.nhn);

    let selectedEmailAdapter: Type<IEmailAdapter> = SmtpEmailAdapter;
    if (options?.email?.ses) {
      selectedEmailAdapter = AwsSesEmailAdapter;
    }
    else if (options?.email?.nhn) {
      selectedEmailAdapter = NhnEmailAdapter;
    }

    let selectedSmsAdapter: Type<ISmsAdapter> = NhnSmsAdapter;
    if (options?.sms?.sns) {
      selectedSmsAdapter = AwsSnsSmsAdapter;
    }

    const selectedKakaoAdapter: Type<IKakaoAdapter> = NhnAlimtalkAdapter;

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
        selectedSmsAdapter,
        {
          provide: SMS_ADAPTER,
          useExisting: selectedSmsAdapter,
        },
        SmsChannel,
      );
      activeChannels.push(SmsChannel);
    }

    // Kakao Adapter & Channel
    if (hasKakao) {
      dynamicProviders.push(
        selectedKakaoAdapter,
        {
          provide: KAKAO_ADAPTER,
          useExisting: selectedKakaoAdapter,
        },
        KakaoChannel,
      );
      activeChannels.push(KakaoChannel);
    }

    // Push (Firebase FCM / NHN Push) Adapter & Channel
    if (hasPush) {
      let selectedPushAdapter: Type<IPushAdapter> = FirebaseFcmAdapter;
      if (options?.push?.nhn) {
        selectedPushAdapter = NhnPushAdapter;
      }

      dynamicProviders.push(
        selectedPushAdapter,
        {
          provide: PUSH_ADAPTER,
          useExisting: selectedPushAdapter,
        },
        PushChannel,
      );
      activeChannels.push(PushChannel);
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
