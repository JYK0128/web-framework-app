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
  revokeUrl?: string
}
