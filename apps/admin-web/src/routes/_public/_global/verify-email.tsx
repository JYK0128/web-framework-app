import { z } from '@pkg/shared/common';
import { useI18n } from '@pkg/web-core/i18n';
import { ScreenLayout } from '@pkg/web-core/template';
import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { ShieldCheck } from 'lucide-react';

import { useAuthControllerVerifyEmailV1 } from '#/.generated/api/endpoints/auth/auth';
import { Button, Card, CardContent } from '#/.generated/shadcn/components/ui';

export const Route = createFileRoute('/_public/_global/verify-email')({
  validateSearch: z.object({
    challengeId: z.string().optional(),
    token: z.string().optional(),
  }),
  beforeLoad: ({ search }) => {
    if (!search.challengeId?.trim() || !search.token?.trim()) throw notFound();
  },
  component: EmailVerificationPage,
});

function EmailVerificationPage() {
  const { t } = useI18n();
  const { challengeId = '', token = '' } = Route.useSearch();
  const verifyMutation = useAuthControllerVerifyEmailV1();

  const verify = () => {
    verifyMutation.mutate({ data: { challengeId, token } });
  };

  return (
    <ScreenLayout.Root>
      <ScreenLayout.Content size="md">
        <Card className="grid size-full grid-rows-[minmax(0,1fr)] shadow-xl">
          <CardContent className="
            grid grid-rows-[auto_minmax(0,1fr)_auto] gap-5 p-6
          "
          >
            <div className="grid justify-items-center gap-2 text-center">
              <div className="
                flex size-12 items-center justify-center rounded-2xl bg-primary
                text-primary-foreground
              "
              >
                <ShieldCheck className="size-6" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">{t('app.auth.verifyEmail.title')}</h1>
              <p className="text-sm text-muted-foreground">
                {t('app.auth.verifyEmail.description')}
              </p>
            </div>

            <div className="scroll-y">
              {verifyMutation.isSuccess
                ? <p role="status" className="text-center text-sm text-primary">{t('app.auth.verifyEmail.continue')}</p>
                : (
                  <Button onClick={verify} disabled={verifyMutation.isPending}>
                    {verifyMutation.isPending ? t('app.auth.verifyEmail.pending') : t('app.auth.verifyEmail.complete')}
                  </Button>
                )}
            </div>

            <Link
              to="/login"
              className="
                text-center text-sm text-muted-foreground underline
                underline-offset-4
              "
            >
              {t('app.auth.verifyEmail.back')}
            </Link>
          </CardContent>
        </Card>
      </ScreenLayout.Content>
    </ScreenLayout.Root>
  );
}
