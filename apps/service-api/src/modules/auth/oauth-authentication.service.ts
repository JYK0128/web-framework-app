import { createHash, randomBytes } from 'node:crypto';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';
import { decrypt, encrypt, hmac, isEncrypted } from '@pkg/shared/server';
import { createRemoteJWKSet, jwtVerify } from 'jose';

import { SECURITY_CONFIG } from '#/app.config';
import { Role } from '#/entities/auth.extensions/role.entity';
import { Account } from '#/entities/auth/account.entity';
import { Profile } from '#/entities/auth/profile.entity';
import { User } from '#/entities/auth/user.entity';
import { SystemConfig } from '#/entities/system-configs/system-config.entity';
import { env } from '#/env';
import { type IUserAuthService, type TokenPairResult, USER_AUTH_SERVICE } from '#/infra/auth/user/user-auth.interface';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { KvStoreKey } from '#/infra/kv-store/kv-store.helper';
import { KvStore } from '#/infra/kv-store/kv-store.service';
import { getOAuthProviderConfigurationIssues } from '#/modules/system-configs/oauth-provider-validation';

interface OAuthProviderConfig {
  enabled?: boolean
  name?: string
  clientId?: string
  clientSecret?: string
  authorizeUrl?: string
  tokenUrl?: string
  userInfoUrl?: string
  scope?: string
  iconUrl?: string
  brandColor?: string
  brandTextColor?: string
  userIdPath?: string
  emailPath?: string
  namePath?: string
  emailVerifiedPath?: string
  tokenAuthMethod?: 'client_secret_post' | 'client_secret_basic'
  idTokenOnly?: boolean
  jwksUrl?: string
  issuer?: string
}

interface OAuthIdentity {
  id: string
  email: string
  name: string
  emailVerified: boolean
}

export interface PublicOAuthProvider {
  id: string
  name: string
  iconUrl?: string
  brandColor?: string
  brandTextColor?: string
}

interface OAuthStateRecord {
  providerId: string
  callbackUrl: string
  returnTo: string
  codeVerifier: string
  nonce?: string
}

export interface OAuthCompletion {
  tokens: TokenPairResult
  returnTo: string
}

const REMOTE_JWKS_CACHE = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

@Injectable()
export class OAuthAuthenticationService {
  constructor(
    private readonly em: AppEntityManager,
    private readonly kvStore: KvStore,
    @Inject(USER_AUTH_SERVICE) private readonly authService: IUserAuthService,
  ) {}

  async getEnabledProviders(): Promise<PublicOAuthProvider[]> {
    if (!SECURITY_CONFIG.oauthAvailable) return [];
    const providers = await this.getProviderMap();
    return Object.entries(providers)
      .filter(([, config]) => this.isUsable(config))
      .map(([id, config]) => ({
        id,
        name: config.name?.trim() || id,
        ...(config.iconUrl ? { iconUrl: config.iconUrl } : {}),
        ...(config.brandColor ? { brandColor: config.brandColor } : {}),
        ...(config.brandTextColor ? { brandTextColor: config.brandTextColor } : {}),
      }));
  }

  async begin(providerId: string, callbackUrl: string, returnTo: string): Promise<string> {
    if (!SECURITY_CONFIG.oauthAvailable) throw new ApplicationError({ code: 'OAUTH_UNAVAILABLE', status: HttpStatus.FORBIDDEN });
    const provider = await this.getProvider(providerId);
    if (!this.isUsable(provider)) throw new ApplicationError({ code: 'OAUTH_PROVIDER_UNAVAILABLE', status: HttpStatus.NOT_FOUND });

    const state = randomBytes(32).toString('base64url');
    const codeVerifier = randomBytes(48).toString('base64url');
    const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
    const nonce = provider.idTokenOnly ? randomBytes(32).toString('base64url') : undefined;
    const stateHash = createHash('sha256').update(state).digest('hex');
    await this.kvStore.set(KvStoreKey.auth.oauthState(stateHash), { providerId, callbackUrl, returnTo, codeVerifier, nonce } satisfies OAuthStateRecord, TimeUtil.s.minute(SECURITY_CONFIG.token.oauthStateTtlMinutes));

    const authorizeUrl = new URL(provider.authorizeUrl!);
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('client_id', provider.clientId!);
    authorizeUrl.searchParams.set('redirect_uri', callbackUrl);
    authorizeUrl.searchParams.set('state', state);
    authorizeUrl.searchParams.set('code_challenge', codeChallenge);
    authorizeUrl.searchParams.set('code_challenge_method', 'S256');
    if (nonce) authorizeUrl.searchParams.set('nonce', nonce);
    if (provider.scope?.trim()) authorizeUrl.searchParams.set('scope', provider.scope.trim());
    return authorizeUrl.toString();
  }

  async complete(providerId: string, code: string, state: string): Promise<OAuthCompletion> {
    if (!SECURITY_CONFIG.oauthAvailable) throw new ApplicationError({ code: 'OAUTH_UNAVAILABLE', status: HttpStatus.FORBIDDEN });
    if (!code || !state) throw new ApplicationError({ code: 'OAUTH_CALLBACK_INVALID', status: HttpStatus.BAD_REQUEST });
    const stateHash = createHash('sha256').update(state).digest('hex');
    const stateRecord = await this.kvStore.getAndDelete<OAuthStateRecord>(KvStoreKey.auth.oauthState(stateHash));
    if (!stateRecord || stateRecord.providerId !== providerId) throw new ApplicationError({ code: 'OAUTH_STATE_INVALID', status: HttpStatus.BAD_REQUEST });

    const provider = await this.getProvider(providerId);
    if (!this.isUsable(provider)) throw new ApplicationError({ code: 'OAUTH_PROVIDER_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
    const identity = await this.fetchIdentity(providerId, provider, code, state, stateRecord.callbackUrl, stateRecord.codeVerifier, stateRecord.nonce);
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
    return { tokens: await this.authService.login(user), returnTo: stateRecord.returnTo };
  }

  private async findOrCreateUser(providerId: string, identity: OAuthIdentity): Promise<User> {
    const account = await this.em.findOne(Account, { providerId, accountId: identity.id }, { populate: ['user', 'user.role'], filters: false });
    if (account) return account.user;

    if (!identity.email || !identity.emailVerified) {
      throw new ApplicationError({ code: 'OAUTH_VERIFIED_EMAIL_REQUIRED', status: HttpStatus.FORBIDDEN });
    }

    const normalizedEmail = identity.email.trim().toLowerCase();
    const emailHash = hmac(normalizedEmail, env.PII_HASH_KEY);
    let user = await this.em.findOne(User, { profile: { emailHash } }, { populate: ['role', 'profile'], filters: false });
    if (user) {
      if (!user.emailVerified) {
        user.emailVerified = true;
        await this.em.flush();
      }
    }
    else {
      if (!SECURITY_CONFIG.registration.allowRegistration) {
        throw new ApplicationError({ code: 'REGISTRATION_DISABLED', status: HttpStatus.FORBIDDEN });
      }
      const roleCode = SECURITY_CONFIG.registration.oauthDefaultRoleCode;
      if (!roleCode) throw new ApplicationError({ code: 'REGISTRATION_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
      const role = await this.em.findOne(Role, { code: roleCode }, { filters: false });
      if (!role) throw new ApplicationError({ code: 'REGISTRATION_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
      user = this.em.create(User, {
        emailVerified: true,
        role,
      });
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

  // Token exchange supports both user-info and verified ID-token provider flows.
  // eslint-disable-next-line sonarjs/cognitive-complexity
  private async fetchIdentity(providerId: string, provider: OAuthProviderConfig, code: string, state: string, callbackUrl: string, codeVerifier: string, nonce?: string): Promise<OAuthIdentity> {
    const secret = provider.clientSecret!;
    const clientSecret = isEncrypted(secret) ? decrypt(secret, env.OAUTH_ENCRYPTION_KEY) : secret;
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: callbackUrl,
      code_verifier: codeVerifier,
    });
    if (providerId === 'naver') tokenBody.set('state', state);
    const tokenHeaders: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' };
    if (provider.tokenAuthMethod === 'client_secret_basic') {
      const encodedCredentials = `${formUrlEncode(provider.clientId!)}:${formUrlEncode(clientSecret)}`;
      tokenHeaders.Authorization = `Basic ${Buffer.from(encodedCredentials).toString('base64')}`;
    }
    else {
      tokenBody.set('client_id', provider.clientId!);
      tokenBody.set('client_secret', clientSecret);
    }
    const tokenResponse = await this.fetchJson(provider.tokenUrl!, {
      method: 'POST',
      headers: tokenHeaders,
      body: tokenBody,
    });
    if ((!tokenResponse.access_token || typeof tokenResponse.access_token !== 'string')
      && !(provider.idTokenOnly && typeof tokenResponse.id_token === 'string')) {
      throw new ApplicationError({ code: 'OAUTH_TOKEN_EXCHANGE_FAILED', status: HttpStatus.BAD_GATEWAY });
    }
    if (provider.idTokenOnly && typeof tokenResponse.id_token === 'string') {
      try {
        const jwksUrl = provider.jwksUrl!;
        let jwks = REMOTE_JWKS_CACHE.get(jwksUrl);
        if (!jwks) {
          jwks = createRemoteJWKSet(new URL(jwksUrl), { timeoutDuration: TimeUtil.ms.second(SECURITY_CONFIG.integrations.oauthProviderRequestTimeoutSeconds) });
          REMOTE_JWKS_CACHE.set(jwksUrl, jwks);
        }
        const verified = await jwtVerify(tokenResponse.id_token, jwks, { issuer: provider.issuer, audience: provider.clientId });
        if (!nonce || verified.payload.nonce !== nonce) throw new Error('ID token nonce mismatch');
        return normalizeOAuthIdentity(verified.payload, providerId, provider);
      }
      catch {
        throw new ApplicationError({ code: 'OAUTH_ID_TOKEN_INVALID', status: HttpStatus.BAD_GATEWAY });
      }
    }
    if (!provider.userInfoUrl) throw new ApplicationError({ code: 'OAUTH_USERINFO_UNAVAILABLE', status: HttpStatus.BAD_GATEWAY });
    const accessToken = tokenResponse.access_token as string;
    const userInfo = await this.fetchJson(provider.userInfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    });
    return normalizeOAuthIdentity(userInfo, providerId, provider);
  }

  private async fetchJson(url: string, init: RequestInit): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(url, { ...init, signal: AbortSignal.timeout(TimeUtil.ms.second(SECURITY_CONFIG.integrations.oauthProviderRequestTimeoutSeconds)) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body: unknown = await response.json();
      if (body && typeof body === 'object' && !Array.isArray(body)) return body as Record<string, unknown>;
      throw new Error('Invalid JSON response');
    }
    catch {
      throw new ApplicationError({ code: 'OAUTH_PROVIDER_ERROR', status: HttpStatus.BAD_GATEWAY });
    }
  }

  private async getProviderMap(): Promise<Record<string, OAuthProviderConfig>> {
    const config = await this.em.findOne(SystemConfig, { code: 'oauth' }, { filters: false });
    if (!config || !config.value || typeof config.value !== 'object' || Array.isArray(config.value)) return {};
    return config.value as Record<string, OAuthProviderConfig>;
  }

  private async getProvider(providerId: string): Promise<OAuthProviderConfig> {
    if (!/^[a-z0-9_-]{1,64}$/u.test(providerId)) throw new ApplicationError({ code: 'OAUTH_PROVIDER_UNAVAILABLE', status: HttpStatus.NOT_FOUND });
    return (await this.getProviderMap())[providerId] ?? {};
  }

  private isUsable(config: OAuthProviderConfig): boolean {
    return config.enabled === true
      && getOAuthProviderConfigurationIssues(config, env.NODE_ENV === 'development').length === 0;
  }
}

function valueAtPath(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[key];
  }, value);
}

function firstString(value: unknown, paths: string[]): string {
  for (const path of paths) {
    const candidate = valueAtPath(value, path);
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
    if (typeof candidate === 'number' && Number.isSafeInteger(candidate)) return String(candidate);
  }
  return '';
}

function formUrlEncode(value: string): string {
  return new URLSearchParams({ value }).toString().slice('value='.length);
}

function normalizeOAuthIdentity(payload: Record<string, unknown>, providerId: string, config: OAuthProviderConfig): OAuthIdentity {
  const naverResponse = payload.response;
  const nested = naverResponse && typeof naverResponse === 'object' ? naverResponse as Record<string, unknown> : payload;
  const kakaoAccount = payload.kakao_account && typeof payload.kakao_account === 'object' ? payload.kakao_account as Record<string, unknown> : {};
  const profile = payload.properties && typeof payload.properties === 'object' ? payload.properties as Record<string, unknown> : {};
  const mappedEmail = config.emailPath ? firstString(payload, [config.emailPath]) : '';
  const mappedId = config.userIdPath ? firstString(payload, [config.userIdPath]) : '';
  const mappedName = config.namePath ? firstString(payload, [config.namePath]) : '';
  const mappedVerification = config.emailVerifiedPath ? valueAtPath(payload, config.emailVerifiedPath) : undefined;
  const email = mappedEmail || firstString(nested, ['email']) || firstString(kakaoAccount, ['email']) || firstString(payload, ['email']);
  const mappedEmailVerified = mappedVerification === true
    || (typeof mappedVerification === 'string' && ['true', 'yes', '1', 'verified'].includes(mappedVerification.toLowerCase()));
  const verified = providerId === 'kakao'
    ? kakaoAccount.is_email_valid === true && kakaoAccount.is_email_verified === true
    : mappedEmailVerified
      || nested.email_verified === true
      || nested.verified_email === true
      || (providerId === 'naver' && typeof naverResponse === 'object')
      || payload.email_verified === true
      || payload.verified_email === true;
  const id = mappedId || firstString(nested, ['sub', 'id']) || firstString(payload, ['sub', 'id']);
  const name = mappedName || firstString(nested, ['name', 'nickname'])
    || firstString(payload, ['name', 'nickname'])
    || firstString(profile, ['nickname'])
    || email;
  if (!id || !email || !verified) {
    throw new ApplicationError({ code: 'OAUTH_IDENTITY_INCOMPLETE', status: HttpStatus.BAD_GATEWAY });
  }
  return { id, email, name, emailVerified: true };
}
