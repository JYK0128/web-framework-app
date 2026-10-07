import { HttpStatus } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

interface OAuthProviderValidationConfig {
  enabled?: unknown
  idTokenOnly?: unknown
  clientId?: unknown
  clientSecret?: unknown
  authorizeUrl?: unknown
  tokenUrl?: unknown
  userInfoUrl?: unknown
  jwksUrl?: unknown
  issuer?: unknown
}

export function getOAuthProviderConfigurationIssues(config: OAuthProviderValidationConfig, allowHttp: boolean): string[] {
  const idTokenOnly = config.idTokenOnly === true;
  const values: Record<string, unknown> = {
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    authorizeUrl: config.authorizeUrl,
    tokenUrl: config.tokenUrl,
    userInfoUrl: config.userInfoUrl,
    jwksUrl: config.jwksUrl,
    issuer: config.issuer,
  };
  const requiredFields = [
    'clientId',
    'clientSecret',
    'authorizeUrl',
    'tokenUrl',
    ...(idTokenOnly ? ['jwksUrl', 'issuer'] : ['userInfoUrl']),
  ];
  const issues = requiredFields.filter((field) => !isNonEmptyString(values[field]));
  const urlFields = ['authorizeUrl', 'tokenUrl', ...(idTokenOnly ? ['jwksUrl', 'issuer'] : ['userInfoUrl'])];
  const allowedProtocols = allowHttp ? ['https:', 'http:'] : ['https:'];

  for (const field of urlFields) {
    const value = values[field];
    if (typeof value !== 'string' || !value.trim()) continue;
    try {
      const url = new URL(value.trim());
      if (!allowedProtocols.includes(url.protocol) || url.username || url.password || url.hash) issues.push(field);
    }
    catch {
      issues.push(field);
    }
  }

  return [...new Set(issues)];
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function assertEnabledOAuthProvidersAreConfigured(value: unknown, allowHttp: boolean): void {
  if (!isRecord(value)) return;

  const invalidProviders: { providerId: string, fields: string[] }[] = [];
  for (const [providerId, provider] of Object.entries(value)) {
    if (!isRecord(provider) || provider.enabled !== true) continue;
    const fields = getOAuthProviderConfigurationIssues(provider, allowHttp);
    if (fields.length > 0) invalidProviders.push({ providerId, fields });
  }

  if (invalidProviders.length > 0) {
    throw new ApplicationError({
      code: 'OAUTH_PROVIDER_CONFIG_INVALID',
      status: HttpStatus.BAD_REQUEST,
      details: { providers: invalidProviders },
    });
  }
}
