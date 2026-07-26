import { useI18n } from '@pkg/shared/web';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft, CheckCircle2, FileText, Globe } from 'lucide-react';

import { LocaleSwitcher } from '#/components/locale-switcher';

export const Route = createFileRoute('/{-$locale}/detail')({
  head: () => ({
    meta: [
      { title: 'SSG Detail i18n Page — React Starter Kit' },
      { name: 'description', content: 'SSG sub-page static pre-rendering and i18n test.' },
    ],
  }),
  component: LocalizedDetailPage,
});

function LocalizedDetailPage() {
  const { t, language } = useI18n();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="
        sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-md
        dark:border-zinc-800 dark:bg-zinc-950/80
      "
      >
        <div className="
          mx-auto flex h-16 max-w-5xl items-center justify-between px-4
          sm:px-6
        "
        >
          <Link
            to="/{-$locale}"
            params={{ locale: language }}
            className="
              inline-flex items-center gap-2 text-sm font-bold text-zinc-600
              transition-colors
              hover:text-orange-600
              dark:text-zinc-400
              dark:hover:text-orange-400
            "
          >
            <ArrowLeft className="size-4" />
            <span>{t('common.goBack', '뒤로 가기')}</span>
          </Link>

          <LocaleSwitcher />
        </div>
      </header>

      <main className="
        mx-auto w-full max-w-5xl flex-1 px-4 py-12
        sm:px-6
      "
      >
        <div className="
          rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm
          dark:border-zinc-800 dark:bg-zinc-900
          sm:p-12
        "
        >
          <div className="
            inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1
            text-xs font-bold text-orange-700
            dark:bg-orange-950/60 dark:text-orange-300
          "
          >
            <FileText className="size-3.5" />
            <span>SSG Sub-Route</span>
          </div>

          <h1 className="
            mt-4 text-3xl font-black tracking-tight text-zinc-900
            dark:text-zinc-100
            sm:text-4xl
          "
          >
            {t('ssg.detailTitle', 'SSG 다국어 상세 검증 페이지')}
          </h1>

          <p className="
            mt-3 text-base text-zinc-600
            dark:text-zinc-400
          "
          >
            {t(
              'ssg.detailDescription',
              '이 페이지는 /{locale}/detail 경로로 생성된 사전 렌더링 서브 SSG 페이지입니다.',
            )}
          </p>

          <div className="
            mt-8 grid gap-4
            sm:grid-cols-2
          "
          >
            <div className="
              rounded-2xl border border-zinc-100 bg-zinc-50 p-6
              dark:border-zinc-800 dark:bg-zinc-950/50
            "
            >
              <div className="
                flex items-center gap-2 text-sm font-bold text-orange-600
                dark:text-orange-400
              "
              >
                <CheckCircle2 className="size-4" />
                <span>{t('ssg.detailCardTitle', '정적 렌더링 런타임 상태')}</span>
              </div>
              <p className="
                mt-2 text-xs/relaxed text-zinc-600
                dark:text-zinc-400
              "
              >
                {t(
                  'ssg.detailCardDesc',
                  'i18n 언어 상태 및 빌드 타임스탬프가 정상 작동하고 있습니다.',
                )}
              </p>
            </div>

            <div className="
              rounded-2xl border border-zinc-100 bg-zinc-50 p-6
              dark:border-zinc-800 dark:bg-zinc-950/50
            "
            >
              <div className="
                flex items-center gap-2 text-sm font-bold text-zinc-800
                dark:text-zinc-200
              "
              >
                <Globe className="
                  size-4 text-orange-600
                  dark:text-orange-400
                "
                />
                <span>Locale Path Info</span>
              </div>
              <ul className="
                mt-2 space-y-1 text-xs text-zinc-600
                dark:text-zinc-400
              "
              >
                <li>
                  Active i18n Language:
                  {' '}
                  <code className="
                    font-mono font-bold text-orange-600
                    dark:text-orange-400
                  "
                  >
                    {language}
                  </code>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
