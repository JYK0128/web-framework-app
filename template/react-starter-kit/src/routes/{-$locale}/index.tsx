import { useI18n } from '@pkg/shared/web';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, ArrowUpRight, Check, Code2, Database, Globe2, Layers3, LayoutDashboard, LogIn, Menu, ShieldCheck, Sparkles, Terminal, Zap } from 'lucide-react';

import { Button } from '#/.generated/shadcn/components/ui';
import { LocaleSwitcher } from '#/components/app/locale-switcher';
import { ThemeToggle } from '#/components/app/theme-toggle';

export const Route = createFileRoute('/{-$locale}/')({
  head: () => ({
    meta: [
      { title: 'React Starter Kit — Ship your next product faster' },
      { name: 'description', content: 'A production-ready React template for launching your next product faster.' },
    ],
  }),
  component: LocalizedIndexPage,
});

function LocalizedIndexPage() {
  const { t, i18n } = useI18n();
  const capabilities = [
    { icon: ShieldCheck, title: t('landing.capabilityAuthTitle'), description: t('landing.capabilityAuthDesc') },
    { icon: LayoutDashboard, title: t('landing.capabilityAdminTitle'), description: t('landing.capabilityAdminDesc') },
    { icon: Globe2, title: t('landing.capabilityI18nTitle'), description: t('landing.capabilityI18nDesc') },
  ];
  const stack = [t('landing.stackOne'), t('landing.stackTwo'), t('landing.stackThree'), t('landing.stackFour')];
  const modules = [
    [Code2, t('landing.moduleCode'), 'React + TypeScript'],
    [Database, t('landing.moduleData'), 'API + ORM ready'],
    [Terminal, t('landing.moduleDeploy'), 'Build → Deploy'],
    [Layers3, t('landing.moduleUi'), 'Tokens included'],
  ] as const;

  return (
    <div className="
      min-h-screen overflow-hidden bg-[#09090b] text-zinc-100
      selection:bg-orange-500/30
    "
    >
      <header className="
        relative z-10 border-b border-white/10 bg-[#09090b]/85 backdrop-blur-xl
      "
      >
        <div className="
          mx-auto flex h-18 max-w-7xl items-center justify-between px-5
          sm:px-8
        "
        >
          <a href="#top" className="flex items-center gap-3">
            <div className="
              flex size-9 items-center justify-center rounded-xl bg-orange-500
              text-zinc-950 shadow-[0_0_24px_rgba(249,115,22,0.3)]
            "
            >
              <Layers3 className="size-5" />
            </div>
            <span className="
              text-sm font-bold tracking-tight
              sm:text-base
            "
            >
              React Starter Kit
            </span>
          </a>
          <nav className="
            hidden items-center gap-8 text-sm text-zinc-400
            md:flex
          "
          >
            <a href="#why" className="hover:text-white">{t('landing.navWhy')}</a>
            <a
              href="#included"
              className="hover:text-white"
            >
              {t('landing.navIncluded')}
            </a>
            <a href="#start" className="hover:text-white">{t('landing.navStart')}</a>
          </nav>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeToggle />
            <Link
              to="/login"
              className="
                hidden
                sm:block
              "
            >
              <Button
                size="sm"
                variant="outline"
                className="
                  border-white/15 bg-white/5 text-zinc-100
                  hover:bg-white/10 hover:text-white
                "
              >
                <LogIn className="mr-2 size-4" />
                {t('auth.login', '로그인')}
              </Button>
            </Link>
            <Button
              size="icon"
              variant="ghost"
              className="
                text-zinc-300
                md:hidden
              "
              aria-label={t('landing.openMenu')}
            >
              <Menu className="size-5" />
            </Button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="
          relative isolate border-b border-white/10 px-5 pb-22 pt-20
          sm:px-8 sm:pt-28
          lg:pb-30
        "
        >
          <div className="
            absolute inset-0 -z-10
            bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.16),transparent_38%)]
          "
          />
          <div className="
            absolute inset-0 -z-10 opacity-30
            bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)]
            bg-size-[64px_64px]
            mask-[linear-gradient(to_bottom,black,transparent_70%)]
          "
          />
          <div className="
            mx-auto grid max-w-7xl items-center gap-14
            lg:grid-cols-[1.05fr_0.95fr] lg:gap-20
          "
          >
            <div>
              <div className="
                mb-7 inline-flex items-center gap-2 rounded-full border
                border-orange-400/25 bg-orange-400/10 px-3 py-1.5 text-xs
                font-semibold text-orange-300
              "
              >
                <Sparkles className="size-3.5" />
                {t('landing.badge')}
              </div>
              <h1 className="
                max-w-3xl text-5xl font-black leading-[1.06] tracking-tighter
                sm:text-7xl
              "
              >
                {t('landing.titleLine1')}
                <span className="block text-orange-400">
                  {t('landing.titleLine2')}
                </span>
              </h1>
              <p className="
                mt-7 max-w-xl text-base/7 text-zinc-400
                sm:text-lg
              "
              >
                {t('landing.description')}
              </p>
              <div className="
                mt-9 flex flex-col gap-3
                sm:flex-row
              "
              >
                <Link to="/login">
                  <Button
                    size="lg"
                    className="
                      h-12 w-full bg-orange-500 px-6 font-bold text-zinc-950
                      shadow-[0_8px_30px_rgba(249,115,22,0.22)]
                      hover:bg-orange-400
                      sm:w-auto
                    "
                  >
                    {t('landing.primaryCta')}
                    <ArrowRight className="ml-2 size-5" />
                  </Button>
                </Link>
                <a href="#included">
                  <Button
                    size="lg"
                    variant="outline"
                    className="
                      h-12 w-full border-white/15 bg-white/5 px-6 text-zinc-100
                      hover:bg-white/10 hover:text-white
                      sm:w-auto
                    "
                  >
                    {t('landing.secondaryCta')}
                  </Button>
                </a>
              </div>
              <div className="
                mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-500
              "
              >
                {[t('landing.trustOne'), t('landing.trustTwo'), t('landing.trustThree')].map((item) => (
                  <span
                    key={item}
                    className="flex items-center gap-1.5"
                  >
                    <Check className="size-3.5 text-orange-400" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-xl">
              <div className="
                absolute -inset-8 -z-10 rounded-full bg-orange-500/10 blur-3xl
              "
              />
              <div className="
                overflow-hidden rounded-2xl border border-white/15 bg-[#111113]
                shadow-2xl shadow-black/50
              "
              >
                <div className="
                  flex items-center gap-2 border-b border-white/10 px-4 py-3
                "
                >
                  <span className="size-2.5 rounded-full bg-red-400/80" />
                  <span className="size-2.5 rounded-full bg-yellow-400/80" />
                  <span className="size-2.5 rounded-full bg-green-400/80" />
                  <span className="ml-3 font-mono text-[11px] text-zinc-500">
                    starter-kit / dashboard
                  </span>
                </div>
                <div className="grid min-h-82 grid-cols-[100px_1fr]">
                  <div className="border-r border-white/10 p-3">
                    <div className="
                      mb-6 flex items-center gap-2 text-[10px] font-bold
                      text-orange-400
                    "
                    >
                      <Layers3 className="size-3.5" />
                      KIT
                    </div>
                    {['Overview', 'Users', 'Analytics', 'Settings'].map((item, index) => (
                      <div
                        key={item}
                        className={`
                          mb-2 rounded-md px-2 py-1.5 text-[10px]
                          ${index === 0
                        ? `bg-orange-500/15 text-orange-300`
                        : `text-zinc-600`}
                        `}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-zinc-500">GOOD MORNING</div>
                        <div className="mt-1 text-lg font-bold">
                          Your dashboard
                        </div>
                      </div>
                      <div className="size-6 rounded-full bg-orange-400/20" />
                    </div>
                    <div className="mt-6 grid grid-cols-3 gap-2">
                      {['24.8k', '1,429', '98.2%'].map((value, index) => (
                        <div
                          key={value}
                          className="
                            rounded-lg border border-white/10 bg-white/3 p-2.5
                          "
                        >
                          <div className="text-[9px] text-zinc-600">{['VISITORS', 'SIGN UPS', 'UPTIME'][index]}</div>
                          <div className="mt-1 text-sm font-bold text-zinc-200">
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="
                      mt-3 h-24 rounded-lg border border-white/10
                      bg-linear-to-br from-orange-500/10 to-transparent p-3
                    "
                    >
                      <div className="flex h-full items-end gap-1.5">
                        {[22, 38, 30, 54, 46, 71, 62, 86, 77, 93, 82, 100].map((height, index) => (
                          <div
                            key={index}
                            className="flex-1 rounded-t-sm bg-orange-400/70"
                            style={{ height: `${height}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="
                absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-xl
                border border-white/15 bg-[#18181b] px-4 py-3 shadow-xl
                sm:flex
              "
              >
                <div className="
                  flex size-8 items-center justify-center rounded-lg
                  bg-green-400/15 text-green-400
                "
                >
                  <Zap className="size-4" />
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500">{t('landing.previewStatus')}</div>
                  <div className="text-xs font-bold">
                    {t('landing.previewReady')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="why"
          className="
            border-b border-white/10 px-5 py-20
            sm:px-8
            lg:py-26
          "
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="
                mb-4 text-xs font-bold uppercase tracking-[0.2em]
                text-orange-400
              "
              >
                {t('landing.whyEyebrow')}
              </p>
              <h2 className="
                text-3xl font-bold tracking-tight
                sm:text-4xl
              "
              >
                {t('landing.whyTitle')}
              </h2>
              <p className="mt-4 text-zinc-400">{t('landing.whyDescription')}</p>
            </div>
            <div className="
              mt-12 grid gap-4
              md:grid-cols-3
            "
            >
              {capabilities.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="
                    rounded-2xl border border-white/10 bg-white/3 p-6
                    transition-colors
                    hover:border-orange-400/30 hover:bg-orange-400/4
                  "
                >
                  <div className="
                    mb-8 flex size-11 items-center justify-center rounded-xl
                    bg-orange-400/10 text-orange-400
                  "
                  >
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-lg font-bold">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm/6 text-zinc-500">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="included"
          className="
            px-5 py-20
            sm:px-8
            lg:py-26
          "
        >
          <div className="
            mx-auto grid max-w-7xl items-center gap-12
            lg:grid-cols-[0.9fr_1.1fr]
          "
          >
            <div>
              <p className="
                mb-4 text-xs font-bold uppercase tracking-[0.2em]
                text-orange-400
              "
              >
                {t('landing.includedEyebrow')}
              </p>
              <h2 className="
                text-3xl font-bold tracking-tight
                sm:text-4xl
              "
              >
                {t('landing.includedTitle')}
              </h2>
              <p className="mt-4 max-w-lg text-zinc-400">{t('landing.includedDescription')}</p>
              <div className="mt-8 space-y-3">
                {stack.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 text-sm text-zinc-300"
                  >
                    <Check className="size-4 text-orange-400" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {modules.map(([Icon, title, label]) => (
                <div
                  key={title}
                  className="
                    group rounded-2xl border border-white/10 bg-white/3 p-5
                    hover:border-orange-400/30
                  "
                >
                  <Icon className="
                    size-5 text-zinc-500 transition-colors
                    group-hover:text-orange-400
                  "
                  />
                  <div className="mt-12 text-base font-bold">
                    {title}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="start"
          className="
            border-t border-white/10 px-5 py-20
            sm:px-8
          "
        >
          <div className="
            mx-auto flex max-w-7xl flex-col items-start justify-between gap-8
            rounded-3xl border border-orange-400/20 bg-linear-to-br
            from-orange-500/15 to-transparent p-8
            sm:p-12
            md:flex-row md:items-center
          "
          >
            <div>
              <p className="
                text-xs font-bold uppercase tracking-[0.2em] text-orange-300
              "
              >
                {t('landing.ctaEyebrow')}
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">
                {t('landing.ctaTitle')}
              </h2>
              <p className="mt-3 text-zinc-400">{t('landing.ctaDescription')}</p>
            </div>
            <Link to="/login">
              <Button
                size="lg"
                className="
                  shrink-0 bg-orange-500 font-bold text-zinc-950
                  hover:bg-orange-400
                "
              >
                {t('landing.primaryCta')}
                <ArrowUpRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <footer className="
        border-t border-white/10 px-5 py-7
        sm:px-8
      "
      >
        <div className="
          mx-auto flex max-w-7xl flex-col justify-between gap-3 text-xs
          text-zinc-500
          sm:flex-row
        "
        >
          <span>© 2026 React Starter Kit</span>
          <span className="flex items-center gap-2">
            <Globe2 className="size-3.5" />
            {i18n.language.toUpperCase()}
            {' '}
            ·
            {t('landing.footer')}
          </span>
        </div>
      </footer>
    </div>
  );
}
