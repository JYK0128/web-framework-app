import { useI18n } from '@pkg/shared/web';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { MailCheck } from 'lucide-react';

import { Button, Card, CardContent } from '#/.generated/shadcn/components/ui';

export const Route = createFileRoute('/_protected/onboarding/email')({
  beforeLoad: ({ context }) => {
    if (context.user?.emailVerified) throw redirect({ to: '/onboarding/term' });
  },
  component: EmailOnboardingPage,
});

function EmailOnboardingPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user } = Route.useRouteContext();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="grid justify-items-center gap-5 p-8 text-center">
          <MailCheck className="size-10 text-primary" />
          <div className="grid gap-2">
            <h1 className="text-xl font-bold">{t('onboarding.emailTitle')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('onboarding.emailDescription', { email: user.email })}
            </p>
          </div>
          <Button
            type="button"
            className="w-full"
            onClick={() => void navigate({ to: '/onboarding/term' })}
          >
            {t('onboarding.skipEmailVerification')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
