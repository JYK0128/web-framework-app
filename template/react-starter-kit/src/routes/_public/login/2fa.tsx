import { z } from '@pkg/shared/common';
import { createFileRoute, Link, notFound } from '@tanstack/react-router';

import { ScreenLayout, ScreenSectionCard } from '#/components/layout';
import { useI18n } from '#/hooks';

import { TwoFactorForm } from './-components/two-factor-form';

export const Route = createFileRoute('/_public/login/2fa')({
  validateSearch: z.object({
    challengeId: z.string(),
    expiresIn: z.number(),
  }),
  beforeLoad: ({ search }) => {
    if (!search.challengeId || search.expiresIn <= 0) {
      throw notFound();
    }
  },
  component: TwoFactorPageComponent,
});

function TwoFactorPageComponent() {
  const { t } = useI18n();
  const { challengeId, expiresIn } = Route.useSearch();

  return (
    <ScreenLayout>
      <ScreenLayout.Content>
        <ScreenSectionCard className="w-full shadow-xl">
          <ScreenSectionCard.Content className="grid gap-4 p-6">
            <TwoFactorForm challengeId={challengeId} expiresIn={expiresIn} />
          </ScreenSectionCard.Content>
        </ScreenSectionCard>
      </ScreenLayout.Content>

      <ScreenLayout.Addon>
        <Link
          to="/login"
          className="
            text-xs text-muted-foreground
            hover:text-foreground
            transition-colors
          "
        >
          ←
          {' '}
          {t('login.backToLogin')}
        </Link>
      </ScreenLayout.Addon>
    </ScreenLayout>
  );
}
