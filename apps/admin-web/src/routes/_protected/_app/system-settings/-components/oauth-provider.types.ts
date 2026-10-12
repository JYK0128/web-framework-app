export interface OAuthProviderMeta {
  id: string
  name: string
  defaultScope?: string
  iconUrl?: string
  iconFiles?: File[]
  brandColor?: string
  brandTextColor?: string
  authorizeUrl?: string
  tokenUrl?: string
  userInfoUrl?: string
  userIdPath?: string
  emailPath?: string
  namePath?: string
  emailVerifiedPath?: string
  tokenAuthMethod?: 'client_secret_post' | 'client_secret_basic'
  idTokenOnly?: boolean
  jwksUrl?: string
  issuer?: string
}

export function hasOAuthProviderConnectionFields(config: {
  clientId?: string
  authorizeUrl?: string
  tokenUrl?: string
  userInfoUrl?: string
  idTokenOnly?: boolean
  jwksUrl?: string
  issuer?: string
}): boolean {
  return Boolean(
    config.clientId?.trim()
    && config.authorizeUrl?.trim()
    && config.tokenUrl?.trim()
    && (config.idTokenOnly
      ? config.jwksUrl?.trim() && config.issuer?.trim()
      : config.userInfoUrl?.trim()),
  );
}
