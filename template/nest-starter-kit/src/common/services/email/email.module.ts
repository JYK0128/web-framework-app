import { type DynamicModule, Global, Module } from '@nestjs/common';

import { EMAIL_MODULE_OPTIONS, type EmailModuleOptions, EmailService } from './email.service';

@Global()
@Module({})
export class EmailModule {
  static forRoot(options?: EmailModuleOptions): DynamicModule {
    return {
      module: EmailModule,
      global: true,
      providers: [
        {
          provide: EMAIL_MODULE_OPTIONS,
          useValue: options ?? {},
        },
        EmailService,
      ],
      exports: [EmailService],
    };
  }
}
