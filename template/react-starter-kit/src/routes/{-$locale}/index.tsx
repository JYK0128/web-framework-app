import { createFileRoute, Link } from '@tanstack/react-router';
import { AlertTriangle, ArrowRight, ArrowUpRight, Check, Code2, Copy, Database, Factory, Globe2, Layers3, LayoutDashboard, Menu, ShieldCheck, Sparkles, Terminal, Zap } from 'lucide-react';
import { type MouseEvent, useEffect, useRef, useState } from 'react';

import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, HoverCard, HoverCardContent, HoverCardTrigger } from '#/.generated/shadcn/components/ui';
import { LocaleSwitcher, ThemeToggle } from '#/components/layout';
import { useI18n } from '#/hooks';

export const Route = createFileRoute('/{-$locale}/')({
  head: () => ({
    meta: [
      { title: 'Service Factory — Ship your next product faster' },
      { name: 'description', content: 'A production-ready React template for launching your next product faster.' },
    ],
  }),
  component: LocalizedIndexPage,
});

function LocalizedIndexPage() {
  const { t, i18n } = useI18n();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const scrollAnimationRef = useRef<number | null>(null);
  const lastScrollTopRef = useRef(0);
  const scrollDirectionRef = useRef<'up' | 'down' | null>(null);
  const directionDistanceRef = useRef(0);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
    catch {
      // Clipboard fallback
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentScrollTop = Math.max(container.scrollTop, 0);
      const scrollDelta = currentScrollTop - lastScrollTopRef.current;
      const headerHeight = headerRef.current?.offsetHeight ?? 0;
      const headerHideThreshold = headerHeight;

      if (currentScrollTop <= headerHideThreshold) {
        setIsHeaderVisible(true);
        scrollDirectionRef.current = null;
        directionDistanceRef.current = 0;
      }
      else if (scrollDelta !== 0) {
        const direction = scrollDelta > 0 ? 'down' : 'up';

        if (scrollDirectionRef.current !== direction) {
          scrollDirectionRef.current = direction;
          directionDistanceRef.current = Math.abs(scrollDelta);
        }
        else {
          directionDistanceRef.current += Math.abs(scrollDelta);
        }

        if (directionDistanceRef.current >= 16 && currentScrollTop > headerHideThreshold) {
          setIsHeaderVisible(direction === 'up');
          directionDistanceRef.current = 0;
        }
      }

      lastScrollTopRef.current = currentScrollTop;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);
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
  const handleHashClick = (event: MouseEvent<HTMLAnchorElement>) => {
    setIsMobileMenuOpen(false);

    const href = event.currentTarget.getAttribute('href');
    const container = scrollContainerRef.current;
    const target = href?.startsWith('#') ? document.getElementById(href.slice(1)) : null;

    if (!container || !target) return;

    event.preventDefault();
    const targetTop = href === '#top'
      ? 0
      : target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
    const startTop = container.scrollTop;
    const distance = targetTop - startTop;
    const duration = 450;
    const startTime = performance.now();

    if (scrollAnimationRef.current !== null) {
      cancelAnimationFrame(scrollAnimationRef.current);
    }

    const animate = (currentTime: number) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easedProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - ((-2 * progress + 2) ** 2) / 2;

      container.scrollTop = startTop + distance * easedProgress;

      if (progress < 1) {
        scrollAnimationRef.current = requestAnimationFrame(animate);
      }
      else {
        scrollAnimationRef.current = null;
      }
    };

    scrollAnimationRef.current = requestAnimationFrame(animate);
    window.history.replaceState(
      null,
      '',
      href === '#top' ? `${window.location.pathname}${window.location.search}` : href,
    );
  };

  return (
    <div
      ref={scrollContainerRef}
      className="
        scroll-y h-full overflow-x-hidden bg-background text-foreground
        selection:bg-orange-500/30
      "
    >
      <header
        ref={headerRef}
        className={`
          sticky top-0 z-10 border-b border-border/70 bg-background/85
          backdrop-blur-xl transition-transform duration-300 ease-out
          will-change-transform
          ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}
        `}
      >
        <div className="
          mx-auto flex h-18 max-w-7xl items-center justify-between px-5
          sm:px-8
        "
        >
          <a
            href="#top"
            onClick={handleHashClick}
            className="flex items-center gap-3"
          >
            <div className="
              flex size-9 items-center justify-center rounded-xl bg-orange-500
              text-zinc-950 shadow-[0_0_24px_rgba(249,115,22,0.3)]
            "
            >
              <Factory className="size-5" />
            </div>
            <span className="
              text-sm font-bold tracking-tight
              sm:text-base
            "
            >
              Service Factory
            </span>
          </a>
          <nav className="
            hidden items-center gap-8 text-sm text-muted-foreground
            md:flex
          "
          >
            <a
              href="#top"
              onClick={handleHashClick}
              className="hover:text-foreground"
            >
              {t('landing.navHome')}
            </a>
            <a
              href="#why"
              onClick={handleHashClick}
              className="hover:text-foreground"
            >
              {t('landing.navWhy')}
            </a>
            <a
              href="#included"
              onClick={handleHashClick}
              className="hover:text-foreground"
            >
              {t('landing.navIncluded')}
            </a>
            <a
              href="#start"
              onClick={handleHashClick}
              className="hover:text-foreground"
            >
              {t('landing.navStart')}
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeToggle />
            <DropdownMenu open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <DropdownMenuTrigger
                render={(
                  <Button
                    size="icon"
                    variant="ghost"
                    className="
                      text-muted-foreground
                      md:hidden
                    "
                    aria-label={t('landing.openMenu')}
                  />
                )}
              >
                <Menu className="size-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="
                  w-[calc(100vw-2.5rem)] max-w-sm p-1
                  md:hidden
                "
              >
                <DropdownMenuItem
                  className="px-3 py-2"
                  render={(
                    <a
                      href="#top"
                      onClick={handleHashClick}
                    />
                  )}
                >
                  {t('landing.navHome')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="px-3 py-2"
                  render={(
                    <a
                      href="#why"
                      onClick={handleHashClick}
                    />
                  )}
                >
                  {t('landing.navWhy')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="px-3 py-2"
                  render={(
                    <a
                      href="#included"
                      onClick={handleHashClick}
                    />
                  )}
                >
                  {t('landing.navIncluded')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="px-3 py-2"
                  render={(
                    <a
                      href="#start"
                      onClick={handleHashClick}
                    />
                  )}
                >
                  {t('landing.navStart')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="
          relative isolate border-b border-border px-5 pb-22 pt-14
          sm:px-8 sm:pt-20
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
                border-orange-300 bg-orange-100 px-3 py-1.5 text-xs
                font-semibold text-orange-700
                dark:border-orange-400/25 dark:bg-orange-400/10
                dark:text-orange-300
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
                <span className="
                  block text-orange-600
                  dark:text-orange-300
                "
                >
                  {t('landing.titleLine2')}
                </span>
              </h1>
              <p className="
                mt-7 max-w-xl text-base/7 text-muted-foreground
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
                <HoverCard>
                  <HoverCardTrigger
                    delay={0}
                    closeDelay={200}
                    className="
                      -m-2.5 p-2.5 inline-block w-full
                      sm:w-auto
                      cursor-default
                    "
                    render={(
                      <Link
                        to="/login"
                        className="
                          w-full
                          sm:w-auto
                          block
                        "
                      >
                        <Button
                          size="lg"
                          className="
                            h-12 w-full bg-orange-500 px-6 font-bold
                            text-orange-950
                            shadow-[0_8px_30px_rgba(249,115,22,0.22)]
                            hover:bg-orange-400
                            cursor-default
                            sm:w-auto
                          "
                        >
                          {t('landing.primaryCta')}
                          <ArrowRight className="ml-2 size-5" />
                        </Button>
                      </Link>
                    )}
                  />
                  <HoverCardContent
                    align="start"
                    side="bottom"
                    sideOffset={8}
                    className="w-72 p-3.5 shadow-xl border-border/80"
                  >
                    <div className="flex items-center gap-2 pb-2">
                      <span className="
                        flex size-6 items-center justify-center rounded-md
                        bg-orange-500/10 text-orange-600
                        dark:text-orange-400
                      "
                      >
                        <Sparkles className="size-3.5" />
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        {t('landing.demoAccountTooltip')}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground pb-2.5">
                      {t('landing.demoAccountHint')}
                    </p>

                    <div className="
                      space-y-1.5 rounded-md bg-muted/60 p-2 text-xs font-mono
                    "
                    >
                      <div className="
                        flex items-center justify-between gap-1 pb-1 border-b
                        border-border/60
                      "
                      >
                        <span className="
                          text-[10px] font-sans text-muted-foreground
                        "
                        >
                          ID
                        </span>
                        <span className="font-semibold text-foreground truncate">{t('landing.demoAccountEmail')}</span>
                        <button
                          type="button"
                          onClick={() => void handleCopy(t('landing.demoAccountEmail'), 'landing-email')}
                          title={t('common.copy')}
                          className="
                            text-muted-foreground
                            hover:text-foreground
                            shrink-0 p-0.5
                          "
                        >
                          {copiedKey === 'landing-email'
                            ? <Check className="size-3 text-emerald-500" />
                            : <Copy className="size-3" />}
                        </button>
                      </div>

                      <div className="
                        flex items-center justify-between gap-1 pt-0.5
                      "
                      >
                        <span className="
                          text-[10px] font-sans text-muted-foreground
                        "
                        >
                          PW
                        </span>
                        <span className="font-semibold text-foreground">{t('landing.demoAccountPassword')}</span>
                        <button
                          type="button"
                          onClick={() => void handleCopy(t('landing.demoAccountPassword'), 'landing-pw')}
                          title={t('common.copy')}
                          className="
                            text-muted-foreground
                            hover:text-foreground
                            shrink-0 p-0.5
                          "
                        >
                          {copiedKey === 'landing-pw'
                            ? <Check className="size-3 text-emerald-500" />
                            : <Copy className="size-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="
                      mt-2.5 flex items-center gap-1.5 rounded-md
                      bg-destructive/10 px-2 py-1.5 text-[11px] font-medium
                      text-destructive
                    "
                    >
                      <AlertTriangle className="
                        size-3.5 shrink-0 text-destructive
                      "
                      />
                      <span>{t('landing.demoAccountResetNotice')}</span>
                    </div>
                  </HoverCardContent>
                </HoverCard>
                <a href="#included" onClick={handleHashClick}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="
                      h-12 w-full border-border bg-muted/50 px-6 text-foreground
                      hover:bg-accent hover:text-accent-foreground
                      sm:w-auto
                    "
                  >
                    {t('landing.secondaryCta')}
                  </Button>
                </a>
              </div>
              <div className="
                mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs
                text-muted-foreground
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
                overflow-hidden rounded-2xl border border-border bg-card
                shadow-2xl shadow-foreground/10
              "
              >
                <div className="
                  flex items-center gap-2 border-b border-border px-4 py-3
                "
                >
                  <span className="size-2.5 rounded-full bg-red-400/80" />
                  <span className="size-2.5 rounded-full bg-yellow-400/80" />
                  <span className="size-2.5 rounded-full bg-green-400/80" />
                  <span className="
                    ml-3 font-mono text-[11px] text-muted-foreground
                  "
                  >
                    starter-kit / dashboard
                  </span>
                </div>
                <div className="grid h-82 grid-cols-[100px_1fr]">
                  <div className="border-r border-border p-3">
                    <div className="
                      mb-6 flex items-center gap-2 text-[10px] font-bold
                      text-orange-700
                      dark:text-orange-300
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
                        ? `
                          bg-orange-100 text-orange-700
                          dark:bg-orange-400/15 dark:text-orange-300
                        `
                        : `text-muted-foreground`}
                        `}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-muted-foreground">GOOD MORNING</div>
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
                            rounded-lg border border-border bg-muted/40 p-2.5
                          "
                        >
                          <div className="text-[9px] text-muted-foreground">{['VISITORS', 'SIGN UPS', 'UPTIME'][index]}</div>
                          <div className="
                            mt-1 text-sm font-bold text-card-foreground
                          "
                          >
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="
                      mt-3 h-24 rounded-lg border border-border bg-linear-to-br
                      from-orange-500/10 to-transparent p-3
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
                border border-border bg-card px-4 py-3 shadow-xl
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
                  <div className="text-[10px] text-muted-foreground">{t('landing.previewStatus')}</div>
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
            border-b border-border px-5 py-20
            sm:px-8
            lg:py-26
          "
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="
                mb-4 text-xs font-bold uppercase tracking-[0.2em]
                text-orange-700
                dark:text-orange-300
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
              <p className="mt-4 text-muted-foreground">{t('landing.whyDescription')}</p>
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
                    rounded-2xl border border-border bg-card p-6
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
                  <p className="mt-2 text-sm/6 text-muted-foreground">{description}</p>
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
                text-orange-700
                dark:text-orange-300
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
              <p className="mt-4 max-w-lg text-muted-foreground">{t('landing.includedDescription')}</p>
              <div className="mt-8 space-y-3">
                {stack.map((item) => (
                  <div
                    key={item}
                    className="
                      flex items-center gap-3 text-sm text-foreground/80
                    "
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
                    group rounded-2xl border border-border bg-card p-5
                    hover:border-orange-400/30
                  "
                >
                  <Icon className="
                    size-5 text-muted-foreground transition-colors
                    group-hover:text-orange-400
                  "
                  />
                  <div className="mt-12 text-base font-bold">
                    {title}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="start"
          className="
            border-t border-border px-5 py-20
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
              <p className="mt-3 text-muted-foreground">{t('landing.ctaDescription')}</p>
            </div>
            <Link to="/login">
              <Button
                size="lg"
                className="
                  shrink-0 bg-orange-500 font-bold text-orange-950
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
        border-t border-border px-5 py-7
        sm:px-8
      "
      >
        <div className="
          mx-auto flex max-w-7xl flex-col justify-between gap-3 text-xs
          text-muted-foreground
          sm:flex-row
        "
        >
          <span>© 2026 Service Factory</span>
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
