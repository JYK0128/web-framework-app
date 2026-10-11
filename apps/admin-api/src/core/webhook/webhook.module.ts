import { type DynamicModule, Module } from '@nestjs/common';

import { WebhookAdapter } from '#/core/webhook/adapters/webhook.adapter';
import { WEBHOOK_ADAPTER, WEBHOOK_MODULE_OPTIONS, type WebhookModuleOptions } from '#/core/webhook/webhook.interface';

import { WebhookService } from './webhook.service';

@Module({})
export class WebhookModule {
  static forRoot(options?: WebhookModuleOptions): DynamicModule {
    return {
      module: WebhookModule,
      global: true,
      providers: [
        {
          provide: WEBHOOK_MODULE_OPTIONS,
          useValue: options ?? {},
        },
        WebhookAdapter,
        WebhookService,
        {
          provide: WEBHOOK_ADAPTER,
          useExisting: WebhookAdapter,
        },
      ],
      exports: [WebhookService],
    };
  }
}
