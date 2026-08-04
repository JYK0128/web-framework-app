import { useI18n } from '@pkg/shared/web';
import { createFileRoute } from '@tanstack/react-router';
import { CheckCircle2, Cpu, Globe, Layers, ShieldCheck } from 'lucide-react';

import { LocaleSwitcher } from '#/components/app/locale-switcher';

export const Route = createFileRoute('/{-$locale}/')({
  head: () => ({
    meta: [
      { title: 'SSG i18n Test — React Starter Kit' },
      {
        name: 'description',
        content: 'Static Site Generation (SSG) and i18n multi-language routing verification page.',
      },
    ],
  }),
  component: LocalizedIndexPage,
});

function LocalizedIndexPage() {
  const { t, language } = useI18n();

  const features = [
    {
      icon: Cpu,
      title: t('ssg.featureSsgTitle', '고성능 사전 렌더링'),
      description: t(
        'ssg.featureSsgDesc',
        '빌드 시점에 언어별(ko, en) HTML 파일이 생성되어 빠른 반응 속도를 제공합니다.',
      ),
      tag: 'Build Time SSG',
    },
    {
      icon: Globe,
      title: t('ssg.featureI18nTitle', 'i18n 다국어 라우팅'),
      description: t(
        'ssg.featureI18nDesc',
        'URL 경로({-$locale}) 및 useI18n 훅을 통해 반응형 다국어 환경을 제공합니다.',
      ),
      tag: 'Dynamic i18n',
    },
    {
      icon: ShieldCheck,
      title: t('ssg.featureMetaTitle', 'SEO & Meta 데이터'),
      description: t(
        'ssg.featureMetaDesc',
        '각 언어별 타이틀과 메타 스키마를 동적으로 구성합니다.',
      ),
      tag: 'SEO Ready',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Navbar */}
      <header className="
        sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-md
        dark:border-zinc-800 dark:bg-zinc-950/80
      "
      >
        <div className="
          mx-auto flex h-16 max-w-6xl items-center justify-between px-4
          sm:px-6
        "
        >
          <div className="flex items-center gap-3">
            <div className="
              flex size-9 items-center justify-center rounded-xl bg-orange-600
              font-black text-white shadow-xs
              dark:bg-orange-500
            "
            >
              <Layers className="size-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight">SSG i18n Suite</h1>
              <p className="
                text-xs text-zinc-500
                dark:text-zinc-400
              "
              >
                TanStack Start + i18n
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LocaleSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="
        mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-12
        sm:px-6
        lg:py-16
      "
      >
        {/* Status Badge */}
        <div className="
          mx-auto mb-6 inline-flex items-center gap-2 rounded-full border
          border-orange-200 bg-orange-50 px-4 py-1.5 text-xs font-bold
          text-orange-700 shadow-2xs
          dark:border-orange-900/50 dark:bg-orange-950/40 dark:text-orange-300
        "
        >
          <CheckCircle2 className="
            size-4 text-orange-600
            dark:text-orange-400
          "
          />
          <span>{t('ssg.badge', 'SSG 사전 렌더링 검증 완료')}</span>
          <span className="
            ml-1 rounded-sm bg-orange-200/80 px-1.5 py-0.5 text-[10px] uppercase
            font-extrabold text-orange-800
            dark:bg-orange-900 dark:text-orange-200
          "
          >
            {language.toUpperCase()}
          </span>
        </div>

        {/* Hero Section */}
        <div className="text-center">
          <h2 className="
            mx-auto max-w-3xl text-3xl font-black tracking-tight
            sm:text-5xl
            lg:text-6xl
          "
          >
            {t('ssg.title', '정적 사이트 생성 (SSG) 다국어 테스트')}
          </h2>
          <p className="
            mx-auto mt-5 max-w-2xl text-base text-zinc-600
            dark:text-zinc-400
            sm:text-lg
          "
          >
            {t(
              'ssg.description',
              'TanStack Start와 i18n을 기반으로 정적 페이지 pre-rendering 및 다국어 라우팅을 검증합니다.',
            )}
          </p>

        </div>

        {/* Features Grid */}
        <div className="
          mt-16 grid gap-6
          sm:grid-cols-2
          lg:grid-cols-3
        "
        >
          {features.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <div
                key={idx}
                className="
                  group relative flex flex-col justify-between rounded-2xl
                  border border-zinc-200 bg-white p-6 shadow-xs transition-all
                  hover:-translate-y-1 hover:border-orange-500/40
                  hover:shadow-md
                  dark:border-zinc-800 dark:bg-zinc-900
                "
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="
                      flex size-11 items-center justify-center rounded-xl
                      bg-orange-100 text-orange-600 transition-colors
                      group-hover:bg-orange-600 group-hover:text-white
                      dark:bg-orange-950/60 dark:text-orange-400
                      dark:group-hover:bg-orange-500
                    "
                    >
                      <IconComponent className="size-5" />
                    </div>
                    <span className="
                      rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-bold
                      text-zinc-500
                      dark:bg-zinc-800 dark:text-zinc-400
                    "
                    >
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="
                    mt-5 text-lg font-bold tracking-tight text-zinc-900
                    dark:text-zinc-100
                  "
                  >
                    {item.title}
                  </h3>
                  <p className="
                    mt-2 text-sm/relaxed text-zinc-600
                    dark:text-zinc-400
                  "
                  >
                    {item.description}
                  </p>
                </div>

                <div className="
                  mt-6 border-t border-zinc-100 pt-4 text-xs font-semibold
                  text-zinc-400
                  dark:border-zinc-800/80
                "
                >
                  {t('ssg.currentLang', '현재 언어: {{lang}}', { lang: language.toUpperCase() })}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="
        mt-auto border-t border-zinc-200 bg-white py-6
        dark:border-zinc-800 dark:bg-zinc-950
      "
      >
        <div className="
          mx-auto flex max-w-6xl flex-col items-center justify-between gap-4
          px-4 text-xs text-zinc-500
          sm:flex-row sm:px-6
        "
        >
          <p>© 2026 React Starter Kit — SSG & i18n Test Suite</p>
          <div className="flex items-center gap-4">
            <span className="
              font-semibold text-orange-600
              dark:text-orange-400
            "
            >
              Locale:
              {' '}
              {language.toUpperCase()}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
