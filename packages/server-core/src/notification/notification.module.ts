import { type DynamicModule, Global, Module } from '@nestjs/common';

import { AlimtalkAdapter } from './adapters/alimtalk.adapter';
import { MessengerAdapter } from './adapters/messenger.adapter';
import { PushAdapter } from './adapters/push.adapter';
import { SmsAdapter } from './adapters/sms.adapter';
import { SmtpAdapter } from './adapters/smtp.adapter';
import { MessageTemplateService } from './message-template.service';
import { NOTIFICATION_MODULE_OPTIONS, type NotificationModuleOptions } from './notification.interface';
import { NotificationService } from './notification.service';

@Global()
@Module({})
export class NotificationModule {
  static forRoot(options: NotificationModuleOptions): DynamicModule {
    return {
      module: NotificationModule,
      global: true,
      providers: [
        { provide: NOTIFICATION_MODULE_OPTIONS, useValue: options },
        AlimtalkAdapter,
        SmtpAdapter,
        SmsAdapter,
        PushAdapter,
        MessengerAdapter,
        NotificationService,
        MessageTemplateService,
      ],
      exports: [NotificationService],
    };
  }
}
