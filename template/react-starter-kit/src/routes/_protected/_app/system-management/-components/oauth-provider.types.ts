export interface OAuthProviderMeta {
  id: string
  name: string
  defaultScope?: string
  icon?: string
  iconUrl?: string
  brandColor?: string
  authorizeUrl?: string
  tokenUrl?: string
  userInfoUrl?: string
  revokeUrl?: string
}
