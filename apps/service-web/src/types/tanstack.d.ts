import '@tanstack/react-router';

import type { i18n } from '@pkg/shared/common';
import type {} from '@tanstack/history';

declare module '@tanstack/history' {
  interface HistoryState {
    twoFactorChallengeToken?: string
  }
}

declare module '@tanstack/router-core' {
  interface Register {
    server: {
      requestContext: {
        i18n: i18n
      }
    }
  }
}
