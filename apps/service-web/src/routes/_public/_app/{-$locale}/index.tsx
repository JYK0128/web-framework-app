import { useI18n } from '@pkg/web-core/i18n';
import { getSupportedLocales } from '@pkg/web-core/locale';
import { Link, SectionCard } from '@pkg/web-core/template';
import { createFileRoute, Link as RouterLink } from '@tanstack/react-router';

export const Route = createFileRoute('/_public/_app/{-$locale}/')({
  component: ServiceHome,
});

function ServiceHome() {
  const { i18n, t } = useI18n();
  const locales = getSupportedLocales(i18n);
  return (
    <>
      <div className="
        mx-auto grid size-full w-full max-w-6xl content-center gap-6 px-4 py-10
        md:px-6
      "
      >
        <SectionCard textSize="lg" title="Service Web" description={t('service.home.description')}>
          <SectionCard.Content className="
            grid gap-4 p-6 text-sm text-muted-foreground
          "
          >
            <p>{t('service.home.intro')}</p>
            <nav
              aria-label="Language"
              className="flex justify-end gap-4 text-sm"
            >
              {locales.map(({ code, label }) => (
                <RouterLink
                  key={code}
                  to="/{-$locale}"
                  params={{ locale: code }}
                  onClick={() => void i18n.changeLanguage(code)}
                  className="underline underline-offset-4"
                >
                  {label}
                </RouterLink>
              ))}
            </nav>
            <div className="flex justify-end gap-2">
              <Link variant="outline" to="/qna">{t('service.home.qna')}</Link>
              <Link variant="outline" to="/login">{t('service.navigation.login')}</Link>
            </div>
          </SectionCard.Content>
        </SectionCard>
      </div>
    </>
  );
}
