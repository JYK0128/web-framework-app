import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { MaintenancePublicConfigContributor, OAuthPublicConfigContributor, OperationPublicConfigContributor, SecurityPublicConfigContributor } from './contributors';
import { SYSTEM_CONFIG_HANDLERS } from './handlers';
import { PUBLIC_CONFIG_CONTRIBUTORS, PublicConfigRegistry } from './registry';
import { SystemConfigController } from './system-config.controller';

const BUILTIN_CONTRIBUTORS = [
  SecurityPublicConfigContributor,
  MaintenancePublicConfigContributor,
  OperationPublicConfigContributor,
  OAuthPublicConfigContributor,
];

@Global()
@Module({
  imports: [CqrsModule],
  controllers: [SystemConfigController],
  providers: [
    ...SYSTEM_CONFIG_HANDLERS,
    ...BUILTIN_CONTRIBUTORS,
    PublicConfigRegistry,
    {
      provide: PUBLIC_CONFIG_CONTRIBUTORS,
      useFactory: (
        security: SecurityPublicConfigContributor,
        maintenance: MaintenancePublicConfigContributor,
        operation: OperationPublicConfigContributor,
        oauth: OAuthPublicConfigContributor,
      ) => [security, maintenance, operation, oauth],
      inject: BUILTIN_CONTRIBUTORS,
    },
  ],
  exports: [CqrsModule, PublicConfigRegistry],
})
export class SystemConfigModule {}
