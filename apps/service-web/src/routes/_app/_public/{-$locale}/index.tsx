import { PreviewCard } from '@base-ui/react/preview-card';
import { useI18n } from '@pkg/web-core/context';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowDown, ArrowRight, ArrowUpRight, Bot, Boxes, Check, Copy, Layers3, Orbit, Workflow } from 'lucide-react';
import { useState } from 'react';

import { getI18n } from '~/i18n/i18n';
import { browserEnv } from '~/lib/browser-env';

const adminWebUrl = browserEnv.adminWebUrl;

const locales = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
] as const;

export const Route = createFileRoute('/_app/_public/{-$locale}/')({
  head: () => {
    const { t } = getI18n();
    return {
      meta: [
        { title: t('service.landing.metaTitle') },
        { name: 'description', content: t('service.landing.metaDescription') },
        { property: 'og:title', content: t('service.landing.metaTitle') },
        { property: 'og:description', content: t('service.landing.metaDescription') },
        { property: 'og:type', content: 'website' },
      ],
    };
  },
  component: ServiceHome,
});

function ServiceHome() {
  const { t } = useI18n();
  const steps = ['stepOne', 'stepTwo', 'stepThree'] as const;
  const assets = ['assetOne', 'assetTwo', 'assetThree'] as const;
  const [isDemoAccountOpen, setIsDemoAccountOpen] = useState(false);
  const [demoTab, setDemoTab] = useState<'service' | 'admin'>('service');
  const [copiedCredential, setCopiedCredential] = useState<'id' | 'password' | null>(null);
  const scrollToApproach = () => {
    document.getElementById('approach')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const scrollToTop = () => {
    document.querySelector<HTMLElement>('.landing-page')?.parentElement?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const copyCredential = async (value: string, key: 'id' | 'password') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedCredential(key);
      window.setTimeout(() => setCopiedCredential(null), 2000);
    }
    catch {
      setCopiedCredential(null);
    }
  };
  const demoAccounts = [
    { value: 'service', email: t('service.landing.demoServiceEmail'), href: '/login' },
    { value: 'admin', email: t('service.landing.demoAdminEmail'), href: adminWebUrl },
  ] as const;
  const activeDemoAccount = demoAccounts.find(({ value }) => value === demoTab) ?? demoAccounts[0];

  return (
    <div className="landing-page">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero-grid" aria-hidden="true" />
        <div className="landing-wrap landing-hero-content">
          <p className="landing-eyebrow">
            <span className="landing-eyebrow-dot" />
            {t('service.landing.eyebrow')}
          </p>
          <h1 id="landing-title">
            {t('service.landing.heroTitle')}
            <br />
            <span>{t('service.landing.heroAccent')}</span>
          </h1>
          <p className="landing-lede">{t('service.landing.heroDescription')}</p>
          <div className="landing-actions">
            <button className="landing-button landing-button-primary" type="button" onClick={scrollToApproach}>
              {t('service.landing.explore')}
              <ArrowDown size={16} />
            </button>
            <PreviewCard.Root open={isDemoAccountOpen} onOpenChange={setIsDemoAccountOpen}>
              <PreviewCard.Trigger
                delay={0}
                closeDelay={200}
                render={(
                  <div className="
                    landing-button landing-button-quiet landing-demo-trigger
                  "
                  >
                    <span className="landing-demo-link">
                      {t('service.landing.tryDemo')}
                      <ArrowDown size={16} />
                    </span>
                  </div>
                )}
              />
              <PreviewCard.Portal>
                <PreviewCard.Positioner
                  side="bottom"
                  align="start"
                  sideOffset={8}
                  className="z-50"
                >
                  <PreviewCard.Popup className="
                    w-72 max-w-[calc(100vw-2rem)] rounded-lg border bg-popover
                    p-3.5 text-popover-foreground shadow-xl ring-1
                    ring-foreground/10
                  "
                  >
                    <p className="mb-1 text-xs font-bold">{t('service.landing.demoAccountTitle')}</p>
                    <p className="mb-3 text-[11px] text-muted-foreground">{t('service.landing.demoAccountHint')}</p>
                    <div
                      role="tablist"
                      aria-label={t('service.landing.demoAccountTitle')}
                      className="
                        grid w-full grid-cols-2 gap-1 rounded-lg bg-muted p-1
                      "
                    >
                      <button
                        id="demo-tab-service"
                        type="button"
                        role="tab"
                        aria-selected={demoTab === 'service'}
                        aria-controls="demo-account-panel"
                        tabIndex={demoTab === 'service' ? 0 : -1}
                        onClick={() => setDemoTab('service')}
                        onKeyDown={(event) => {
                          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                            event.preventDefault();
                            const nextTab = demoTab === 'service' ? 'admin' : 'service';
                            setDemoTab(nextTab);
                            document.getElementById(`demo-tab-${nextTab}`)?.focus();
                          }
                        }}
                        className={`
                          rounded-md px-3 py-2 text-xs font-semibold
                          transition-colors
                          ${demoTab === 'service'
      ? `bg-background text-foreground shadow-sm`
      : `
        text-muted-foreground
        hover:text-foreground
      `}
                        `}
                      >
                        {t('service.landing.demoServiceTab')}
                      </button>
                      <button
                        id="demo-tab-admin"
                        type="button"
                        role="tab"
                        aria-selected={demoTab === 'admin'}
                        aria-controls="demo-account-panel"
                        tabIndex={demoTab === 'admin' ? 0 : -1}
                        onClick={() => setDemoTab('admin')}
                        onKeyDown={(event) => {
                          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                            event.preventDefault();
                            const nextTab = demoTab === 'service' ? 'admin' : 'service';
                            setDemoTab(nextTab);
                            document.getElementById(`demo-tab-${nextTab}`)?.focus();
                          }
                        }}
                        className={`
                          rounded-md px-3 py-2 text-xs font-semibold
                          transition-colors
                          ${demoTab === 'admin'
      ? `bg-background text-foreground shadow-sm`
      : `
        text-muted-foreground
        hover:text-foreground
      `}
                        `}
                      >
                        {t('service.landing.demoAdminTab')}
                      </button>
                    </div>
                    <div
                      id="demo-account-panel"
                      role="tabpanel"
                      aria-labelledby={`demo-tab-${demoTab}`}
                      className="mt-3 w-full min-w-0"
                    >
                      <div className="
                        space-y-1.5 rounded-md bg-muted/60 p-2 text-xs font-mono
                      "
                      >
                        <div className="
                          flex w-full min-w-0 items-center gap-2 border-b
                          border-border/60 pb-1
                        "
                        >
                          <span className="
                            w-7 shrink-0 text-[10px] font-sans
                            text-muted-foreground
                          "
                          >
                            ID
                          </span>
                          <span className="
                            min-w-0 flex-1 truncate font-semibold
                          "
                          >
                            {activeDemoAccount.email}
                          </span>
                          <button
                            type="button"
                            onClick={() => void copyCredential(activeDemoAccount.email, 'id')}
                            aria-label={t('service.landing.copyId')}
                            title={t('service.landing.copyId')}
                            className="
                              shrink-0 p-0.5 text-muted-foreground
                              hover:text-foreground
                            "
                          >
                            {copiedCredential === 'id'
                              ? (
                                <Check className="size-3 text-emerald-500" />
                              )
                              : (
                                <Copy className="size-3" />
                              )}
                          </button>
                        </div>
                        <div className="
                          flex w-full min-w-0 items-center gap-2 pt-0.5
                        "
                        >
                          <span className="
                            w-7 shrink-0 text-[10px] font-sans
                            text-muted-foreground
                          "
                          >
                            PW
                          </span>
                          <span className="
                            min-w-0 flex-1 truncate font-semibold
                          "
                          >
                            {t('service.landing.demoAccountPassword')}
                          </span>
                          <button
                            type="button"
                            onClick={() => void copyCredential(t('service.landing.demoAccountPassword'), 'password')}
                            aria-label={t('service.landing.copyPassword')}
                            title={t('service.landing.copyPassword')}
                            className="
                              shrink-0 p-0.5 text-muted-foreground
                              hover:text-foreground
                            "
                          >
                            {copiedCredential === 'password'
                              ? (
                                <Check className="size-3 text-emerald-500" />
                              )
                              : (
                                <Copy className="size-3" />
                              )}
                          </button>
                        </div>
                      </div>
                      {demoTab === 'service'
                        ? (
                          <Link
                            to="/login"
                            className="
                              mt-3 inline-flex w-full items-center
                              justify-center gap-2 rounded-md bg-primary px-3
                              py-2 text-xs font-semibold text-primary-foreground
                              hover:opacity-90
                            "
                          >
                            {t('service.landing.demoOpenService')}
                            <ArrowUpRight className="size-3.5" />
                          </Link>
                        )
                        : (
                          <a
                            href={activeDemoAccount.href}
                            className="
                              mt-3 inline-flex w-full items-center
                              justify-center gap-2 rounded-md bg-primary px-3
                              py-2 text-xs font-semibold text-primary-foreground
                              hover:opacity-90
                            "
                          >
                            {t('service.landing.demoOpenAdmin')}
                            <ArrowUpRight className="size-3.5" />
                          </a>
                        )}
                    </div>
                  </PreviewCard.Popup>
                </PreviewCard.Positioner>
              </PreviewCard.Portal>
            </PreviewCard.Root>
          </div>
          <div className="landing-proof">
            <span className="landing-proof-line" />
            {t('service.landing.heroNote')}
          </div>
          <div className="landing-deck-visual" aria-hidden="true">
            <div className="landing-deck-sheet landing-deck-sheet-back">
              <div className="landing-deck-meta">
                <span>FIELD NOTES</span>
                <span>03 / 04</span>
              </div>
              <div className="landing-deck-back-title">
                {t('service.landing.assetsTitle')}
                <br />
                <em>{t('service.landing.assetsAccent')}</em>
              </div>
              <div className="landing-deck-columns">
                <span />
                <span />
                <span />
              </div>
              <div className="landing-deck-baseline" />
            </div>
            <div className="landing-deck-sheet landing-deck-sheet-mid">
              <div className="landing-deck-meta">
                <span>OPERATING MODEL</span>
                <span>02 / 04</span>
              </div>
              <div className="landing-deck-flow">
                <span><Boxes size={15} /></span>
                <i />
                <span><Workflow size={15} /></span>
                <i />
                <span><Bot size={15} /></span>
              </div>
              <div className="landing-deck-mid-lines">
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="landing-deck-sheet landing-deck-sheet-front">
              <div className="landing-deck-meta">
                <span>SYSTEM / 01</span>
                <span>FOUNDATION</span>
              </div>
              <div className="landing-deck-cover-title">
                {t('service.landing.stepOneTitle')}
                <br />
                <em>{t('service.landing.stepTwoTitle')}</em>
              </div>
              <div className="landing-deck-modules">
                <span>
                  01&nbsp;
                  {t('service.landing.assetOneTitle')}
                </span>
                <span>
                  02&nbsp;
                  {t('service.landing.assetTwoTitle')}
                </span>
                <span>
                  03&nbsp;
                  {t('service.landing.assetThreeTitle')}
                </span>
              </div>
              <div className="landing-deck-footer">
                <span>SERVICE WEB</span>
                <span><Layers3 size={13} /></span>
              </div>
            </div>
            <span className="landing-deck-index">{t('service.landing.orbitLabel')}</span>
          </div>
          <div className="landing-scroll-cue" aria-hidden="true">
            <span />
            {t('service.landing.scroll')}
          </div>
        </div>
      </section>

      <section className="landing-section landing-problem" id="approach" aria-labelledby="problem-title">
        <div className="landing-wrap landing-two-column">
          <div>
            <p className="landing-kicker">
              01 /
              {t('service.landing.problemKicker')}
            </p>
            <h2 id="problem-title">
              {t('service.landing.problemTitle')}
              <br />
              <span>{t('service.landing.problemAccent')}</span>
            </h2>
          </div>
          <div className="landing-copy-block">
            <p>{t('service.landing.problemBody')}</p>
            <div className="landing-pain-list">
              {(['painOne', 'painTwo', 'painThree'] as const).map((key, index) => (
                <div className="landing-pain" key={key}>
                  <span>
                    0
                    {index + 1}
                  </span>
                  <p>{t(`service.landing.${key}`)}</p>
                  <ArrowRight size={15} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-foundation" aria-labelledby="foundation-title">
        <div className="landing-wrap">
          <div className="landing-section-heading">
            <div>
              <p className="landing-kicker">
                02 /
                {t('service.landing.foundationKicker')}
              </p>
              <h2 id="foundation-title">{t('service.landing.foundationTitle')}</h2>
            </div>
            <p>{t('service.landing.foundationDescription')}</p>
          </div>
          <div className="landing-foundation-grid">
            {steps.map((key, index) => {
              const Icon = [Boxes, Workflow, Orbit][index];
              return (
                <article className="landing-foundation-card" key={key}>
                  <div className="landing-card-top">
                    <span>
                      0
                      {index + 1}
                    </span>
                    <span className="landing-card-icon">
                      {Icon && <Icon />}
                    </span>
                  </div>
                  <h3>{t(`service.landing.${key}Title`)}</h3>
                  <p>{t(`service.landing.${key}Body`)}</p>
                  <div className="landing-card-rule" />
                </article>
              );
            })}
          </div>
          <div className="landing-foundation-foot">
            <span>{t('service.landing.foundationFoot')}</span>
            <span className="landing-foot-mark">
              S / 01
            </span>
          </div>
        </div>
      </section>

      <section className="landing-section landing-ai" aria-labelledby="ai-title">
        <div className="landing-wrap landing-two-column landing-ai-layout">
          <div className="landing-ai-art" aria-hidden="true">
            <div className="ai-grid" />
            <div className="ai-center"><Bot size={31} strokeWidth={1.4} /></div>
            <div className="ai-path ai-path-one" />
            <div className="ai-path ai-path-two" />
            <span className="ai-chip ai-chip-one">01&nbsp; / &nbsp;REQUEST</span>
            <span className="ai-chip ai-chip-two">02&nbsp; / &nbsp;ROUTE</span>
            <span className="ai-chip ai-chip-three">03&nbsp; / &nbsp;REVIEW</span>
            <span className="ai-dot ai-dot-one" />
            <span className="ai-dot ai-dot-two" />
            <span className="ai-dot ai-dot-three" />
          </div>
          <div className="landing-ai-content">
            <p className="landing-kicker">
              03 /
              {t('service.landing.aiKicker')}
            </p>
            <h2 id="ai-title">
              {t('service.landing.aiTitle')}
              <br />
              <span>{t('service.landing.aiAccent')}</span>
            </h2>
            <p className="landing-ai-lede">{t('service.landing.aiDescription')}</p>
            <ul className="landing-check-list">
              {(['aiRuleOne', 'aiRuleTwo', 'aiRuleThree'] as const).map((key) => (
                <li key={key}>
                  <span><Check size={13} /></span>
                  {t(`service.landing.${key}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="landing-section landing-assets" aria-labelledby="assets-title">
        <div className="landing-wrap">
          <div className="landing-section-heading landing-assets-heading">
            <div>
              <p className="landing-kicker">
                04 /
                {t('service.landing.assetsKicker')}
              </p>
              <h2 id="assets-title">
                {t('service.landing.assetsTitle')}
                <br />
                <span>{t('service.landing.assetsAccent')}</span>
              </h2>
            </div>
            <p>{t('service.landing.assetsDescription')}</p>
          </div>
          <div className="landing-assets-row">
            {assets.map((key, index) => (
              <article className="landing-asset" key={key}>
                <span className="landing-asset-index">
                  0
                  {index + 1}
                </span>
                <div>
                  <h3>{t(`service.landing.${key}Title`)}</h3>
                  <p>{t(`service.landing.${key}Body`)}</p>
                </div>
                <ArrowUpRight size={16} />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-close" aria-labelledby="close-title">
        <div className="landing-wrap landing-close-content">
          <p className="landing-kicker">{t('service.landing.closeKicker')}</p>
          <h2 id="close-title">
            {t('service.landing.closeTitle')}
            <br />
            <span>{t('service.landing.closeAccent')}</span>
          </h2>
          <p>{t('service.landing.closeDescription')}</p>
          <button className="landing-button landing-button-light" type="button" onClick={scrollToTop}>
            {t('service.landing.backToTop')}
            <ArrowUpRight size={16} />
          </button>
          <div className="landing-close-mark" aria-hidden="true"><Layers3 size={26} /></div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-wrap landing-footer-content">
          <div className="landing-footer-brand">
            <span><Layers3 size={15} /></span>
            Service Web
          </div>
          <p>{t('service.landing.footer')}</p>
          <nav
            aria-label={t('service.landing.language')}
            className="landing-languages"
          >
            {locales.map(({ code, label }) => <Link key={code} to="/{-$locale}" params={{ locale: code }} onClick={() => void getI18n().changeLanguage(code)}>{label}</Link>)}
          </nav>
        </div>
      </footer>
    </div>
  );
}
