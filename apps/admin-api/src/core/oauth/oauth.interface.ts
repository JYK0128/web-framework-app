export interface OAuthProviderConfig {
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
