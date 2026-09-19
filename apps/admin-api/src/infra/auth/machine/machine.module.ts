import { DynamicModule, Module, Provider } from '@nestjs/common';

import { PrincipalContext } from '#/common/contexts/principal.context';

import { ApiKeyMachineAuthService } from './api-key/api-key-machine-auth.service';
import { ApiKeyMachineCredentialService } from './api-key/api-key-machine-credential.service';
import { InternalServiceClient } from './internal-service-client.service';
import { JwtMachineAuthService } from './jwt/jwt-machine-auth.service';
import { MachineTokenService } from './jwt/machine-token.service';
import { MACHINE_AUTH_VERIFIER, MACHINE_CREDENTIAL_SERVICE, type MachineAuthModuleOptions } from './machine-auth.interface';

@Module({})
export class MachineModule {
  static forRoot(options: MachineAuthModuleOptions): DynamicModule {
    const verifier = options.driver === 'jwt' ? JwtMachineAuthService : ApiKeyMachineAuthService;
    const credentialService = options.driver === 'jwt' ? MachineTokenService : ApiKeyMachineCredentialService;
    const driverProviders: Provider[] = options.driver === 'jwt'
      ? [JwtMachineAuthService, MachineTokenService]
      : [
        {
          provide: ApiKeyMachineAuthService,
          inject: [PrincipalContext],
          useFactory: (principalContext: PrincipalContext) => new ApiKeyMachineAuthService(principalContext, options.apiKey),
        },
        { provide: ApiKeyMachineCredentialService, useFactory: () => new ApiKeyMachineCredentialService(options.apiKey) },
      ];

    return {
      module: MachineModule,
      global: true,
      providers: [
        ...driverProviders,
        InternalServiceClient,
        { provide: MACHINE_AUTH_VERIFIER, useExisting: verifier },
        { provide: MACHINE_CREDENTIAL_SERVICE, useExisting: credentialService },
      ],
      exports: [InternalServiceClient, MACHINE_CREDENTIAL_SERVICE],
    };
  }
}
