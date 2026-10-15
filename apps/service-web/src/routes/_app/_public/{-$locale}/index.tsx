import { LocaleSwitcher } from '@pkg/web-core/application';
import { useI18n } from '@pkg/web-core/i18n';
import { Link, SectionCard } from '@pkg/web-core/template';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/_public/{-$locale}/')({
  component: ServiceHome,
});

function ServiceHome() {
  const { t } = useI18n();
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
            <div className="flex justify-end">
              <LocaleSwitcher />
            </div>
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
