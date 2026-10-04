import { createFileRoute } from '@tanstack/react-router';

import { LinkButton, SectionCard } from '#/components/layout';
import { useI18n } from '#/hooks';

export const Route = createFileRoute('/_public/_app/{-$locale}/')({
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
            <div className="flex justify-end gap-2">
              <LinkButton variant="outline" to="/qna">{t('service.home.qna')}</LinkButton>
              <LinkButton variant="outline" to="/login">{t('service.navigation.login')}</LinkButton>
            </div>
          </SectionCard.Content>
        </SectionCard>
      </div>
    </>
  );
}
