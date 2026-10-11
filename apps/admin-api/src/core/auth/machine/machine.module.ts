import { DynamicModule, Module, Provider } from '@nestjs/common';
import { MachineConnectionSchema } from '@pkg/shared/server';

import { MACHINE_ALLOWED_LIST } from '#/app.config';
import { ApiKeyMachineAuthService } from '#/core/auth/machine/api-key/api-key-machine-auth.service';
import { ApiKeyMachineCredentialService } from '#/core/auth/machine/api-key/api-key-machine-credential.service';
import { InternalServiceClient } from '#/core/auth/machine/internal-service-client.service';
import { JwtMachineAuthService } from '#/core/auth/machine/jwt/jwt-machine-auth.service';
import { MachineTokenService } from '#/core/auth/machine/jwt/machine-token.service';
import { MachineAuthGuard } from '#/core/auth/machine/machine-auth.guard';
import { MACHINE_AUTH_VERIFIER, MACHINE_CONNECTION, MACHINE_CREDENTIAL_SERVICE, type MachineAuthModuleOptions } from '#/core/auth/machine/machine-auth.interface';
import { PrincipalContext } from '#/core/http/contexts/principal.context';

@Module({})
export class MachineModule {
  static forRoot(options: MachineAuthModuleOptions): DynamicModule {
    const connection = MachineConnectionSchema.parse(options.connection);
    if (options.driver === 'api-key' && (!options.apiKey || !MACHINE_ALLOWED_LIST.includes(options.callerService))) {
      throw new Error('API key authentication requires a key and an allowed caller service');
    }
    const verifier = options.driver === 'jwt' ? JwtMachineAuthService : ApiKeyMachineAuthService;
    const credentialService = options.driver === 'jwt' ? MachineTokenService : ApiKeyMachineCredentialService;
    const driverProviders: Provider[] = options.driver === 'jwt'
      ? [JwtMachineAuthService, MachineTokenService]
      : [
        {
          provide: ApiKeyMachineAuthService,
          inject: [PrincipalContext],
          useFactory: (principalContext: PrincipalContext) => new ApiKeyMachineAuthService(principalContext, options.apiKey, options.callerService),
        },
        { provide: ApiKeyMachineCredentialService, useFactory: () => new ApiKeyMachineCredentialService(options.apiKey) },
      ];

    return {
      module: MachineModule,
      global: true,
      providers: [
        ...driverProviders,
        { provide: MACHINE_CONNECTION, useValue: connection },
        InternalServiceClient,
        MachineAuthGuard,
        { provide: MACHINE_AUTH_VERIFIER, useExisting: verifier },
        { provide: MACHINE_CREDENTIAL_SERVICE, useExisting: credentialService },
      ],
      exports: [InternalServiceClient, MACHINE_CREDENTIAL_SERVICE, MachineAuthGuard],
    };
  }
}
