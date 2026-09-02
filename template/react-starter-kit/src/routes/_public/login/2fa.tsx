import { z } from '@pkg/shared/common';
import { createFileRoute, Link, notFound } from '@tanstack/react-router';

import { Card, CardContent } from '#/.generated/shadcn/components/ui';
import { ScreenLayout } from '#/components/layout';
import { useI18n } from '#/hooks';

import { TwoFactorForm } from './-components/two-factor-form';

export const Route = createFileRoute('/_public/login/2fa')({
  validateSearch: z.object({
    challengeId: z.string().catch(''),
    expiresIn: z.number().optional().catch(180),
  }),
  beforeLoad: ({ search }) => {
    if (!search.challengeId) {
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
        <Card className="w-full shadow-xl">
          <CardContent className="grid gap-4 p-6">
            <TwoFactorForm challengeId={challengeId} expiresIn={expiresIn ?? 180} />
          </CardContent>
        </Card>
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
          {t('auth.backToLogin')}
        </Link>
      </ScreenLayout.Addon>
    </ScreenLayout>
  );
}
