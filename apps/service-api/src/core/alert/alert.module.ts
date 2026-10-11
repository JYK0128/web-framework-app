import { type DynamicModule, Module } from '@nestjs/common';

import { WebhookAlertAdapter } from '#/core/alert/adapters/webhook.adapter';
import { ALERT_ADAPTER, ALERT_MODULE_OPTIONS, type AlertModuleOptions } from '#/core/alert/alert.interface';

import { AlertService } from './alert.service';

@Module({})
export class AlertModule {
  static forRoot(options?: AlertModuleOptions): DynamicModule {
    return {
      module: AlertModule,
      global: true,
      providers: [
        {
          provide: ALERT_MODULE_OPTIONS,
          useValue: options ?? {},
        },
        WebhookAlertAdapter,
        AlertService,
        {
          provide: ALERT_ADAPTER,
          useExisting: WebhookAlertAdapter,
        },
      ],
      exports: [AlertService],
    };
  }
}
