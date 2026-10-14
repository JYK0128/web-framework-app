import { type DynamicModule, Module, type Type } from '@nestjs/common';
import { ApiKeyService } from '@pkg/server-core/auth/machine/api-key.service';
import { MachineAuthGuard } from '@pkg/server-core/auth/machine/machine-auth.guard';
import { MACHINE_AUTH_ISSUER, MACHINE_AUTH_OPTIONS, MACHINE_AUTH_VERIFIER, MACHINE_CONNECTION, type MachineAuthModuleOptions, type MachineAuthVerifier, MachineConnectionSchema } from '@pkg/server-core/auth/machine/machine-auth.interface';
import { MachineJwtService } from '@pkg/server-core/auth/machine/machine-jwt.service';

export interface MachineAuthModuleAdapters { internalClient: Type<unknown> }

@Module({})
export class MachineAuthModule {
  static forRoot(options: MachineAuthModuleOptions, adapters: MachineAuthModuleAdapters): DynamicModule {
    const connection = MachineConnectionSchema.parse(options.connection);
    const verifier: Type<MachineAuthVerifier> = options.driver === 'jwt' ? MachineJwtService : ApiKeyService;
    const providers = [
      { provide: MACHINE_AUTH_OPTIONS, useValue: options.auth },
      { provide: MACHINE_CONNECTION, useValue: connection },
      MachineAuthGuard,
      MachineJwtService,
      ...(options.driver === 'api-key' ? [ApiKeyService] : []),
      { provide: MACHINE_AUTH_ISSUER, useExisting: MachineJwtService },
      { provide: MACHINE_AUTH_VERIFIER, useExisting: verifier },
      adapters.internalClient,
    ];
    return { module: MachineAuthModule, global: true, providers, exports: [adapters.internalClient, MACHINE_AUTH_ISSUER, MACHINE_AUTH_VERIFIER, MACHINE_CONNECTION, MachineAuthGuard] };
  }
}
