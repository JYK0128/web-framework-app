export interface OAuthProviderMeta {
  id: string
  name: string
  defaultScope: string
  resource?: string
  authorizeUrl?: string
  tokenUrl?: string
  userInfoUrl?: string
  revokeUrl?: string
}

export const OAUTH_PRESETS: Record<string, OAuthProviderMeta> = {
  google: {
    id: 'google',
    name: 'Google',
    defaultScope: 'openid email profile',
    resource: '<svg viewBox="0 0 24 24" class="size-4 shrink-0"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>',
  },
  kakao: {
    id: 'kakao',
    name: 'Kakao',
    defaultScope: 'profile_nickname account_email',
    resource: '<svg viewBox="0 0 24 24" class="size-4 shrink-0"><path fill="#3C1E1E" d="M12 3C6.48 3 2 6.48 2 10.77c0 2.77 1.84 5.2 4.62 6.55l-1.18 4.33c-.1.38.33.68.66.47l5.16-3.41c.24.02.49.03.74.03 5.52 0 10-3.48 10-7.77S17.52 3 12 3z"/></svg>',
  },
  naver: {
    id: 'naver',
    name: 'Naver',
    defaultScope: 'name email profile_image',
    resource: '<svg viewBox="0 0 24 24" class="size-4 shrink-0"><path fill="#03C75A" d="M16.27 12.87L7.47 2H2v20h5.73V11.13L16.53 22H22V2h-5.73v10.87z"/></svg>',
  },
  github: {
    id: 'github',
    name: 'GitHub',
    defaultScope: 'user:email read:user',
    resource: '<svg viewBox="0 0 24 24" fill="currentColor" class="size-4 shrink-0"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>',
  },
  apple: {
    id: 'apple',
    name: 'Apple',
    defaultScope: 'name email',
    resource: '<svg viewBox="0 0 24 24" fill="currentColor" class="size-4 shrink-0"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.87-.96.04-2.08.64-2.73 1.39-.57.65-1.06 1.7-1.02 2.73 1.06.08 2.12-.52 2.74-1.25z"/></svg>',
  },
  microsoft: {
    id: 'microsoft',
    name: 'Microsoft',
    defaultScope: 'openid profile email User.Read',
    resource: '<svg viewBox="0 0 24 24" class="size-4 shrink-0"><path fill="#f25022" d="M1 1h10v10H1z"/><path fill="#00a4ef" d="M1 13h10v10H1z"/><path fill="#7fba00" d="M13 1h10v10H13z"/><path fill="#ffb900" d="M13 13h10v10H13z"/></svg>',
  },
  discord: {
    id: 'discord',
    name: 'Discord',
    defaultScope: 'identify email',
    resource: '<svg viewBox="0 0 24 24" fill="currentColor" class="size-4 shrink-0"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>',
  },
  line: {
    id: 'line',
    name: 'LINE',
    defaultScope: 'profile openid email',
    resource: '<svg viewBox="0 0 24 24" fill="currentColor" class="size-4 shrink-0"><path fill="#06C755" d="M24 10.3C24 4.6 18.6 0 12 0S0 4.6 0 10.3c0 5.1 4.3 9.4 10.2 10.1.4.1.9.3 1.1.7.2.4.2.9.1 1.4l-.4 2.5c-.1.7.5 1.2 1.1.8l6.3-3.7c3.4-1.8 5.7-5.5 5.7-11.8z"/></svg>',
  },
  slack: {
    id: 'slack',
    name: 'Slack',
    defaultScope: 'identity.basic identity.email',
    resource: '<svg viewBox="0 0 24 24" class="size-4 shrink-0"><path fill="#E01E5A" d="M5.04 15.36a2.52 2.52 0 0 1-2.52-2.52c0-1.39 1.13-2.52 2.52-2.52h2.52v2.52c0 1.39-1.13 2.52-2.52 2.52zm1.26 0a2.52 2.52 0 0 1 2.52-2.52 2.52 2.52 0 0 1 2.52 2.52v6.3a2.52 2.52 0 0 1-2.52 2.52 2.52 2.52 0 0 1-2.52-2.52v-6.3z"/><path fill="#36C5F0" d="M8.64 5.04a2.52 2.52 0 0 1 2.52-2.52c1.39 0 2.52 1.13 2.52 2.52v2.52h-2.52a2.52 2.52 0 0 1-2.52-2.52zm0 1.26a2.52 2.52 0 0 1 2.52 2.52 2.52 2.52 0 0 1-2.52 2.52H2.34A2.52 2.52 0 0 1-.18 8.82a2.52 2.52 0 0 1 2.52-2.52h6.3z"/><path fill="#2EB67D" d="M18.96 8.64a2.52 2.52 0 0 1 2.52 2.52c0 1.39-1.13 2.52-2.52 2.52h-2.52V11.16c0-1.39 1.13-2.52 2.52-2.52zm-1.26 0a2.52 2.52 0 0 1-2.52 2.52 2.52 2.52 0 0 1-2.52-2.52V2.34a2.52 2.52 0 0 1 2.52-2.52 2.52 2.52 0 0 1 2.52 2.52v6.3z"/><path fill="#ECB22E" d="M15.36 18.96a2.52 2.52 0 0 1-2.52 2.52c-1.39 0-2.52-1.13-2.52-2.52v-2.52h2.52c1.39 0 2.52 1.13 2.52 2.52zm0-1.26a2.52 2.52 0 0 1-2.52-2.52 2.52 2.52 0 0 1 2.52-2.52h6.3a2.52 2.52 0 0 1 2.52 2.52 2.52 2.52 0 0 1-2.52 2.52h-6.3z"/></svg>',
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    defaultScope: 'email public_profile',
    resource: '<svg viewBox="0 0 24 24" fill="currentColor" class="size-4 shrink-0"><path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
  },
};

export function getProviderMeta(id: string, existing?: Partial<OAuthProviderMeta>): OAuthProviderMeta {
  const normalizedId = id.toLowerCase().trim();
  const preset = OAUTH_PRESETS[normalizedId];

  return {
    id: normalizedId,
    name: existing?.name || preset?.name || (id.charAt(0).toUpperCase() + id.slice(1)),
    defaultScope: existing?.defaultScope || preset?.defaultScope || 'openid profile email',
    resource: existing?.resource ?? preset?.resource ?? '',
  };
}
