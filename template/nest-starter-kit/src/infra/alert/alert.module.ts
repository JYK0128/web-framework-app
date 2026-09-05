import { type DynamicModule, Module, type Type } from '@nestjs/common';

import { WebhookAlertAdapter } from './adapters/webhook.adapter';
import { ALERT_ADAPTER, ALERT_MODULE_OPTIONS, type AlertModuleOptions, type IAlertAdapter } from './alert.interface';
import { AlertService } from './alert.service';

@Module({})
export class AlertModule {
  static forRoot(options?: AlertModuleOptions): DynamicModule {
    const selectedAdapter: Type<IAlertAdapter> = WebhookAlertAdapter;

    return {
      module: AlertModule,
      global: true,
      providers: [
        {
          provide: ALERT_MODULE_OPTIONS,
          useValue: options ?? {},
        },
        selectedAdapter,
        {
          provide: ALERT_ADAPTER,
          useExisting: selectedAdapter,
        },
        AlertService,
      ],
      exports: [AlertService],
    };
  }
}
