import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { type IUserAuthService, type TokenPairResult, USER_AUTH_SERVICE } from '@pkg/server-core/auth';
import { AppEntityManager } from '@pkg/server-core/core/persistence';
import { type OAuthIdentity, type OAuthProviderConfig, OAuthProviderService, type PublicOAuthProvider } from '@pkg/server-core/oauth';
import { ApplicationError } from '@pkg/shared/common';
import { encrypt, hashWithSecret } from '@pkg/shared/server';

import { SECURITY_CONFIG } from '~/app.config';
import { Account, Profile, User } from '~/core/database/entities/auth';
import { Role } from '~/core/database/entities/auth.extensions';
import { env } from '~/env';
import { SystemContext } from '~/modules/system-config/system.context';

export interface OAuthCompletion {
  tokens: TokenPairResult
  returnTo: string
}

@Injectable()
export class OAuthService {
  constructor(
    private readonly em: AppEntityManager,
    private readonly oauthProvider: OAuthProviderService,
    private readonly systemContext: SystemContext,
    @Inject(USER_AUTH_SERVICE) private readonly authService: IUserAuthService,
  ) {}

  async getEnabledProviders(): Promise<PublicOAuthProvider[]> {
    if (!SECURITY_CONFIG.oauthAvailable) return [];
    return this.oauthProvider.listProviders(await this.getProviderMap(), env.NODE_ENV === 'development');
  }

  async begin(providerId: string, callbackUrl: string, returnTo: string): Promise<string> {
    if (!SECURITY_CONFIG.oauthAvailable) throw new ApplicationError({ code: 'OAUTH_UNAVAILABLE', status: HttpStatus.FORBIDDEN });
    return this.oauthProvider.begin(providerId, await this.getProviderMap(), callbackUrl, returnTo, env.NODE_ENV === 'development');
  }

  async complete(providerId: string, code: string, state: string): Promise<OAuthCompletion> {
    if (!SECURITY_CONFIG.oauthAvailable) throw new ApplicationError({ code: 'OAUTH_UNAVAILABLE', status: HttpStatus.FORBIDDEN });
    const { identity, returnTo } = await this.oauthProvider.complete(
      providerId,
      code,
      state,
      () => this.getProviderMap(),
      env.NODE_ENV === 'development',
    );
    const user = await this.findOrCreateUser(providerId, identity);
    this.assertAccountCanLogin(user);

    if (SECURITY_CONFIG.registration.requireEmailVerification && !user.emailVerified) {
      throw new ApplicationError({ code: 'EMAIL_VERIFICATION_REQUIRED', status: HttpStatus.FORBIDDEN });
    }
    if (user.twoFactorEnabled && (SECURITY_CONFIG.twoFactor.required || SECURITY_CONFIG.twoFactor.enabled)) {
      throw new ApplicationError({ code: 'TWO_FACTOR_REQUIRED_FOR_OAUTH', status: HttpStatus.FORBIDDEN });
    }

    user.updateMetadata({ lastLoginAt: new Date(), failedLoginAttempts: 0, loginFailureWindowStartedAt: null, lockedUntil: null });
    await this.em.flush();
    return { tokens: await this.authService.login(user), returnTo };
  }

  private async findOrCreateUser(providerId: string, identity: OAuthIdentity): Promise<User> {
    const account = await this.em.findOne(Account, { providerId, accountId: identity.id }, { populate: ['user', 'user.role'], filters: false });
    if (account) return account.user;

    if (!identity.email || !identity.emailVerified) throw new ApplicationError({ code: 'OAUTH_VERIFIED_EMAIL_REQUIRED', status: HttpStatus.FORBIDDEN });
    const normalizedEmail = identity.email.trim().toLowerCase();
    const emailHash = hashWithSecret(normalizedEmail, env.PII_HASH_KEY);
    let user = await this.em.findOne(User, { profile: { emailHash } }, { populate: ['role', 'profile'], filters: false });
    if (user) {
      if (!user.emailVerified) {
        user.emailVerified = true;
        await this.em.flush();
      }
    }
    else {
      if (!SECURITY_CONFIG.registration.allowRegistration) throw new ApplicationError({ code: 'REGISTRATION_DISABLED', status: HttpStatus.FORBIDDEN });
      const roleCode = SECURITY_CONFIG.registration.oauthDefaultRoleCode;
      if (!roleCode) throw new ApplicationError({ code: 'REGISTRATION_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
      const role = await this.em.findOne(Role, { code: roleCode }, { filters: false });
      if (!role) throw new ApplicationError({ code: 'REGISTRATION_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
      user = this.em.create(User, { emailVerified: true, role });
      const profile = this.em.create(Profile, {
        user,
        emailEncrypted: encrypt(normalizedEmail, env.PII_ENCRYPTION_KEY),
        emailHash,
        name: identity.name.trim().slice(0, 120) || normalizedEmail,
      });
      this.em.persist([user, profile]);
      await this.em.flush();
    }

    const linkedAccount = this.em.create(Account, { user, providerId, accountId: identity.id });
    this.em.persist(linkedAccount);
    await this.em.flush();
    return user;
  }

  private assertAccountCanLogin(user: User): void {
    if (user.isDeleted) throw new ApplicationError({ code: 'ACCOUNT_DELETED', status: HttpStatus.FORBIDDEN });
    if (user.isBanned) throw new ApplicationError({ code: 'ACCOUNT_BANNED', status: HttpStatus.FORBIDDEN });
    if (user.isLocked) throw new ApplicationError({ code: 'ACCOUNT_LOCKED', status: HttpStatus.FORBIDDEN });
    if (!user.role) throw new ApplicationError({ code: 'ROLE_NOT_ASSIGNED', status: HttpStatus.FORBIDDEN });
  }

  private async getProviderMap(): Promise<Record<string, OAuthProviderConfig>> {
    const { oauth } = await this.systemContext.getConfig();
    if (!oauth || typeof oauth !== 'object' || Array.isArray(oauth)) return {};
    return oauth as Record<string, OAuthProviderConfig>;
  }
}
