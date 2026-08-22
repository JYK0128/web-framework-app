import { Inject, Injectable } from '@nestjs/common';

import { IDENTITY_VERIFICATION_PROVIDER, type IIdentityVerificationProvider, type VerifiedIdentity } from './identity-verification.interface';

@Injectable()
export class IdentityVerificationService {
  constructor(
    @Inject(IDENTITY_VERIFICATION_PROVIDER)
    private readonly provider: IIdentityVerificationProvider,
  ) {}

  get providerName(): string {
    return this.provider.providerName;
  }

  async getVerifiedIdentity(identityVerificationId: string): Promise<VerifiedIdentity> {
    return this.provider.getVerifiedIdentity(identityVerificationId);
  }
}
