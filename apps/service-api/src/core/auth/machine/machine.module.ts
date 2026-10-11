import { DynamicModule, Module } from '@nestjs/common';

import { ApiKeyService } from '#/core/auth/machine/api-key/api-key.service';
import { InternalClient } from '#/core/auth/machine/internal-client';
import { MachineAuthGuard } from '#/core/auth/machine/machine-auth.guard';
import { MACHINE_AUTH_ISSUER, MACHINE_AUTH_VERIFIER, MACHINE_CONNECTION, type MachineAuthModuleOptions, MachineConnectionSchema } from '#/core/auth/machine/machine-auth.interface';
import { MachineJwtService } from '#/core/auth/machine/token/machine-jwt.service';

@Module({})
export class MachineModule {
  static forRoot(options: MachineAuthModuleOptions): DynamicModule {
    const connection = MachineConnectionSchema.parse(options.connection);
    const verifier = options.driver === 'jwt' ? MachineJwtService : ApiKeyService;

    return {
      module: MachineModule,
      global: true,
      providers: [
        ...(options.driver === 'api-key' ? [ApiKeyService] : []),
        MachineJwtService,
        { provide: MACHINE_AUTH_ISSUER, useExisting: MachineJwtService },
        { provide: MACHINE_CONNECTION, useValue: connection },
        InternalClient,
        MachineAuthGuard,
        { provide: MACHINE_AUTH_VERIFIER, useExisting: verifier },
      ],
      exports: [InternalClient, MACHINE_AUTH_ISSUER, MachineAuthGuard],
    };
  }
}
