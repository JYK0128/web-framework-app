import { type DynamicModule, Global, Module } from '@nestjs/common';

import { SLACK_MODULE_OPTIONS, type SlackModuleOptions, SlackService } from './slack.service';

@Global()
@Module({})
export class SlackModule {
  static forRoot(options?: SlackModuleOptions): DynamicModule {
    return {
      module: SlackModule,
      global: true,
      providers: [
        {
          provide: SLACK_MODULE_OPTIONS,
          useValue: options ?? {},
        },
        SlackService,
      ],
      exports: [SlackService],
    };
  }
}
