export const webCoreLocaleResources = {
  en: {
    webCore: {
      localeSwitcher: {
        language: 'Language settings',
      },
      routerError: {
        title: 'We could not load this page',
        description: 'Please try again shortly. If the problem persists, copy the error details and contact support.',
        copy: 'Copy error details',
        copySuccess: 'Error details copied.',
        copyFailed: 'Could not copy the error details.',
        reload: 'Reload',
        home: 'Go home',
        unknown: 'An unknown error occurred.',
      },
      routerNotFound: {
        title: 'Page not found',
        back: 'Back',
        home: 'Go home',
      },
    },
  },
  ko: {
    webCore: {
      localeSwitcher: {
        language: '언어 설정',
      },
      routerError: {
        title: '페이지를 불러오지 못했습니다',
        description: '잠시 후 다시 시도해 주세요. 문제가 계속되면 오류 내용을 복사해 고객지원에 알려 주세요.',
        copy: '오류 내용 복사',
        copySuccess: '오류 내용이 복사되었습니다.',
        copyFailed: '오류 내용을 복사하지 못했습니다.',
        reload: '새로고침',
        home: '홈으로',
        unknown: '알 수 없는 오류가 발생했습니다.',
      },
      routerNotFound: {
        title: '페이지를 찾을 수 없습니다',
        back: '뒤로',
        home: '홈으로',
      },
    },
  },
} as const;

export type WebCoreLocale = keyof typeof webCoreLocaleResources;
