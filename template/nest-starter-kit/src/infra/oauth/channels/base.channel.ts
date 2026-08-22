import { Logger } from '@nestjs/common';

import { getErrorMessage } from '#/common/helpers/error.helper';
import type { IOAuthChannel, OAuthContext, OAuthProfile, OAuthProvider, OAuthToken } from '#/infra/oauth/oauth.interface';

export abstract class BaseOAuthChannel implements IOAuthChannel {
  abstract readonly provider: OAuthProvider;
  protected abstract readonly authorizeUrl: string;
  protected abstract readonly tokenUrl: string;
  protected abstract readonly userInfoUrl: string;
  protected abstract readonly scope: string;
  protected abstract readonly callbackRoute: string;
  protected readonly revokeUrl?: string;

  protected readonly logger = new Logger(this.constructor.name);

  createAuthorizeUrl(state: string, context: OAuthContext): string {
    const { clientId } = context.credentials;
    const callbackUrl = this.getCallbackUrl(context.callbackUrl);

    const url = new URL(this.authorizeUrl);
    url.search = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: this.scope,
      state,
      access_type: 'offline',
      prompt: 'consent',
    }).toString();

    return url.toString();
  }

  async exchangeCode(code: string, context: OAuthContext): Promise<OAuthToken | null> {
    try {
      const { clientId, clientSecret } = context.credentials;
      const callbackUrl = this.getCallbackUrl(context.callbackUrl);

      const res = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: callbackUrl,
          grant_type: 'authorization_code',
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        this.logger.warn(`${this.provider} token exchange failed with status ${res.status}`);
        return null;
      }

      const body = (await res.json()) as Record<string, unknown>;
      const accessToken = typeof body.access_token === 'string' ? body.access_token : undefined;
      const refreshToken = typeof body.refresh_token === 'string' ? body.refresh_token : undefined;

      if (!accessToken) return null;

      return { accessToken, refreshToken };
    }
    catch (error) {
      this.logger.warn(`${this.provider} token exchange failed: ${getErrorMessage(error, 'Unknown error')}`);
      return null;
    }
  }

  async fetchProfile(accessToken: string): Promise<OAuthProfile | null> {
    try {
      const res = await fetch(this.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) return null;

      const data = (await res.json()) as Record<string, unknown>;
      return this.normalizeProfile(data);
    }
    catch (error) {
      this.logger.warn(`${this.provider} fetchProfile failed: ${getErrorMessage(error, 'Unknown error')}`);
      return null;
    }
  }

  protected abstract normalizeProfile(data: Record<string, unknown>): OAuthProfile | null;

  protected getCallbackUrl(callbackUrl: string): string {
    return new URL(this.callbackRoute, `${callbackUrl.replace(/\/$/, '')}/`).toString();
  }
}
