import { createHash, randomBytes } from 'node:crypto';

import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';
import { decrypt, isEncrypted } from '@pkg/shared/server';
import { createRemoteJWKSet, jwtVerify } from 'jose';

import { SECURITY_CONFIG } from '#/app.config';
import { KvStore } from '#/core/kv-store/kv-store.service';
import { env } from '#/env';

import { OAuthKvStoreKey } from './oauth-kv-store';
import type { OAuthProviderConfig } from './oauth-provider.config';
import { getOAuthProviderConfigurationIssues } from './oauth-provider-validation';

export interface OAuthIdentity {
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

export interface OAuthProtocolCompletion {
  identity: OAuthIdentity
  returnTo: string
}

interface OAuthStateRecord {
  providerId: string
  callbackUrl: string
  returnTo: string
  codeVerifier: string
  nonce?: string
}

const REMOTE_JWKS_CACHE = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

@Injectable()
export class OAuthProviderService {
  constructor(private readonly kvStore: KvStore) {}

  listProviders(providers: Record<string, OAuthProviderConfig>, allowHttp: boolean): PublicOAuthProvider[] {
    return Object.entries(providers)
      .filter(([, config]) => this.isUsable(config, allowHttp))
      .map(([id, config]) => ({
        id,
        name: config.name?.trim() || id,
        ...(config.iconUrl ? { iconUrl: config.iconUrl } : {}),
        ...(config.brandColor ? { brandColor: config.brandColor } : {}),
        ...(config.brandTextColor ? { brandTextColor: config.brandTextColor } : {}),
      }));
  }

  async begin(
    providerId: string,
    providers: Record<string, OAuthProviderConfig>,
    callbackUrl: string,
    returnTo: string,
    allowHttp: boolean,
  ): Promise<string> {
    const provider = this.getProvider(providerId, providers);
    if (!this.isUsable(provider, allowHttp)) throw new ApplicationError({ code: 'OAUTH_PROVIDER_UNAVAILABLE', status: HttpStatus.NOT_FOUND });

    const state = randomBytes(32).toString('base64url');
    const codeVerifier = randomBytes(48).toString('base64url');
    const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
    const nonce = provider.idTokenOnly ? randomBytes(32).toString('base64url') : undefined;
    const stateHash = createHash('sha256').update(state).digest('hex');
    await this.kvStore.set(
      OAuthKvStoreKey.state(stateHash),
      { providerId, callbackUrl, returnTo, codeVerifier, nonce } satisfies OAuthStateRecord,
      TimeUtil.s.minute(SECURITY_CONFIG.token.oauthStateTtlMinutes),
    );

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

  async complete(
    providerId: string,
    code: string,
    state: string,
    loadProviders: () => Promise<Record<string, OAuthProviderConfig>>,
    allowHttp: boolean,
  ): Promise<OAuthProtocolCompletion> {
    if (!code || !state) throw new ApplicationError({ code: 'OAUTH_CALLBACK_INVALID', status: HttpStatus.BAD_REQUEST });
    const stateHash = createHash('sha256').update(state).digest('hex');
    const stateRecord = await this.kvStore.getAndDelete<OAuthStateRecord>(OAuthKvStoreKey.state(stateHash));
    if (!stateRecord || stateRecord.providerId !== providerId) throw new ApplicationError({ code: 'OAUTH_STATE_INVALID', status: HttpStatus.BAD_REQUEST });

    const provider = this.getProvider(providerId, await loadProviders());
    if (!this.isUsable(provider, allowHttp)) throw new ApplicationError({ code: 'OAUTH_PROVIDER_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
    const identity = await this.fetchIdentity(providerId, provider, code, state, stateRecord);
    return { identity, returnTo: stateRecord.returnTo };
  }

  private async fetchIdentity(providerId: string, provider: OAuthProviderConfig, code: string, state: string, stateRecord: OAuthStateRecord): Promise<OAuthIdentity> {
    const secret = provider.clientSecret!;
    const clientSecret = isEncrypted(secret) ? decrypt(secret, env.OAUTH_ENCRYPTION_KEY) : secret;
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: stateRecord.callbackUrl,
      code_verifier: stateRecord.codeVerifier,
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
    const tokenResponse = await this.fetchJson(provider.tokenUrl!, { method: 'POST', headers: tokenHeaders, body: tokenBody });
    if ((!tokenResponse.access_token || typeof tokenResponse.access_token !== 'string')
      && !(provider.idTokenOnly && typeof tokenResponse.id_token === 'string')) {
      throw new ApplicationError({ code: 'OAUTH_TOKEN_EXCHANGE_FAILED', status: HttpStatus.BAD_GATEWAY });
    }
    if (provider.idTokenOnly && typeof tokenResponse.id_token === 'string') {
      return this.verifyIdTokenIdentity(tokenResponse.id_token, providerId, provider, stateRecord.nonce);
    }
    if (!provider.userInfoUrl) throw new ApplicationError({ code: 'OAUTH_USERINFO_UNAVAILABLE', status: HttpStatus.BAD_GATEWAY });
    const userInfo = await this.fetchJson(provider.userInfoUrl, {
      headers: { Authorization: `Bearer ${tokenResponse.access_token as string}`, Accept: 'application/json' },
    });
    return normalizeOAuthIdentity(userInfo, providerId, provider);
  }

  private async verifyIdTokenIdentity(idToken: string, providerId: string, provider: OAuthProviderConfig, nonce?: string): Promise<OAuthIdentity> {
    try {
      const jwksUrl = provider.jwksUrl!;
      let jwks = REMOTE_JWKS_CACHE.get(jwksUrl);
      if (!jwks) {
        jwks = createRemoteJWKSet(new URL(jwksUrl), { timeoutDuration: TimeUtil.ms.second(SECURITY_CONFIG.integrations.oauthProviderRequestTimeoutSeconds) });
        REMOTE_JWKS_CACHE.set(jwksUrl, jwks);
      }
      const verified = await jwtVerify(idToken, jwks, { issuer: provider.issuer, audience: provider.clientId });
      if (!nonce || verified.payload.nonce !== nonce) throw new ApplicationError({ code: 'OAUTH_ID_TOKEN_INVALID', status: HttpStatus.BAD_GATEWAY });
      return normalizeOAuthIdentity(verified.payload, providerId, provider);
    }
    catch (error) {
      if (error instanceof ApplicationError) throw error;
      throw ApplicationError.from(error, { code: 'OAUTH_ID_TOKEN_INVALID', status: HttpStatus.BAD_GATEWAY });
    }
  }

  private async fetchJson(url: string, init: RequestInit): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(url, { ...init, signal: AbortSignal.timeout(TimeUtil.ms.second(SECURITY_CONFIG.integrations.oauthProviderRequestTimeoutSeconds)) });
      if (!response.ok) throw new ApplicationError({ code: 'OAUTH_PROVIDER_ERROR', status: HttpStatus.BAD_GATEWAY });
      const body: unknown = await response.json();
      if (body && typeof body === 'object' && !Array.isArray(body)) return body as Record<string, unknown>;
      throw new ApplicationError({ code: 'OAUTH_PROVIDER_ERROR', status: HttpStatus.BAD_GATEWAY });
    }
    catch (error) {
      throw ApplicationError.from(error, { code: 'OAUTH_PROVIDER_ERROR', status: HttpStatus.BAD_GATEWAY });
    }
  }

  private getProvider(providerId: string, providers: Record<string, OAuthProviderConfig>): OAuthProviderConfig {
    if (!/^[a-z0-9_-]{1,64}$/u.test(providerId)) throw new ApplicationError({ code: 'OAUTH_PROVIDER_UNAVAILABLE', status: HttpStatus.NOT_FOUND });
    return providers[providerId] ?? {};
  }

  private isUsable(config: OAuthProviderConfig, allowHttp: boolean): boolean {
    return config.enabled === true && getOAuthProviderConfigurationIssues(config, allowHttp).length === 0;
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
  if (!id || !email || !verified) throw new ApplicationError({ code: 'OAUTH_IDENTITY_INCOMPLETE', status: HttpStatus.BAD_GATEWAY });
  return { id, email, name, emailVerified: true };
}
