/** Google OAuth provider endpoints and protocol parameters. */
export const GOOGLE_CALLBACK_ROUTE = 'google/callback';

export const GOOGLE_OAUTH_CONFIG = {
  provider: 'google',
  authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
  revokeUrl: 'https://oauth2.googleapis.com/revoke',
  grantType: 'authorization_code',
  responseType: 'code',
  scope: 'email profile',
} as const;
