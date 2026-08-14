import { useI18n } from '@pkg/shared/web';
import { createFileRoute, Link } from '@tanstack/react-router';

import { Card, CardContent } from '#/.generated/shadcn/components/ui';

import { LoginBrandHeader } from './-components/LoginBrandHeader';
import { TwoFactorForm } from './-components/TwoFactorForm';

export const Route = createFileRoute('/_public/login/2fa')({
  component: TwoFactorPageComponent,
});

function TwoFactorPageComponent() {
  const { t } = useI18n();

  return (
    <div className="
      flex min-h-screen items-center justify-center bg-muted/30 p-4
    "
    >
      <div className="grid w-full max-w-sm gap-5">
        <LoginBrandHeader
          mode="twoFactor"
        />

        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            <TwoFactorForm />
          </CardContent>
        </Card>

        <div className="text-center">
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
        </div>
      </div>
    </div>
  );
}
