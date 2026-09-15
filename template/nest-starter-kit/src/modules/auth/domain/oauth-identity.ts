import type { OAuthProvider } from '#/infra/oauth';

export class OAuthIdentity {
  constructor(
    public readonly provider: OAuthProvider,
    public readonly accountId: string,
    public readonly email: string,
    public readonly name: string,
  ) {}
}
