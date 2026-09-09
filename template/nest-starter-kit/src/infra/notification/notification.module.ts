import { type DynamicModule, Module, type Provider, type Type } from '@nestjs/common';

import { SmtpEmailAdapter } from './channels/email/adapters/smtp.adapter';
import { EmailChannel } from './channels/email/email.channel';
import { EMAIL_ADAPTER } from './channels/email/email.interface';
import { AligoAlimtalkAdapter } from './channels/kakao/adapters/aligo-alimtalk.adapter';
import { NhnAlimtalkAdapter } from './channels/kakao/adapters/nhn-alimtalk.adapter';
import { SolapiAlimtalkAdapter } from './channels/kakao/adapters/solapi-alimtalk.adapter';
import { KakaoChannel } from './channels/kakao/kakao.channel';
import { FirebaseFcmAdapter } from './channels/push/adapters/firebase-fcm.adapter';
import { NhnPushAdapter } from './channels/push/adapters/nhn-push.adapter';
import { PushChannel } from './channels/push/push.channel';
import { type IPushAdapter, PUSH_ADAPTER } from './channels/push/push.interface';
import { AligoSmsAdapter } from './channels/sms/adapters/aligo-sms.adapter';
import { NhnSmsAdapter } from './channels/sms/adapters/nhn-sms.adapter';
import { SolapiSmsAdapter } from './channels/sms/adapters/solapi-sms.adapter';
import { SmsChannel } from './channels/sms/sms.channel';
import { type INotificationChannel, NOTIFICATION_CHANNELS, NOTIFICATION_MODULE_OPTIONS, type NotificationModuleOptions } from './notification.interface';
import { NotificationService } from './notification.service';
import { TemplateRendererService } from './template-renderer.service';

@Module({})
export class NotificationModule {
  static forRoot(options?: NotificationModuleOptions): DynamicModule {
    const hasPush = Boolean(options?.push?.fcm || options?.push?.nhn);

    const dynamicProviders: Provider[] = [];
    const activeChannels: Type<INotificationChannel>[] = [];

    // Email Adapter & Channel: SmtpEmailAdapter는 항상 등록 (DB 설정 기반)
    dynamicProviders.push(
      SmtpEmailAdapter,
      {
        provide: EMAIL_ADAPTER,
        useExisting: SmtpEmailAdapter,
      },
      EmailChannel,
    );
    activeChannels.push(EmailChannel);

    // SMS Adapter & Channel: 세 어댑터 모두 등록, SmsChannel이 DB provider 값으로 동적 선택
    dynamicProviders.push(
      NhnSmsAdapter,
      SolapiSmsAdapter,
      AligoSmsAdapter,
      SmsChannel,
    );
    activeChannels.push(SmsChannel);

    // Kakao Adapter & Channel: 세 어댑터 모두 등록, KakaoChannel이 DB agency 값으로 동적 선택
    dynamicProviders.push(
      NhnAlimtalkAdapter,
      SolapiAlimtalkAdapter,
      AligoAlimtalkAdapter,
      KakaoChannel,
    );
    activeChannels.push(KakaoChannel);

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
