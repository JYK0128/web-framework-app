import { useI18n } from '@pkg/shared/web';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { useState } from 'react';

import { Card, CardContent } from '#/.generated/shadcn/components/ui';

import { CredentialForm } from './-components/CredentialForm';
import { LoginBrandHeader } from './-components/LoginBrandHeader';

export const Route = createFileRoute('/_public/login/')({
  beforeLoad: ({ context }) => {
    const user = context.authSession?.user;
    if (user) {
      if (user.role === 'admin' || user.role === 'super-admin') {
        throw redirect({ to: '/admin', replace: true });
      }
      throw redirect({ to: '/profile', replace: true });
    }
  },
  component: LoginPageComponent,
});

function LoginPageComponent() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="grid w-full max-w-md gap-6">
        <LoginBrandHeader
          mode={activeTab}
        />

        <Card>
          <CardContent className="grid gap-4 p-6">
            <CredentialForm
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </CardContent>
        </Card>

        <div className="text-center">
          <Link
            to="/"
            className="
              text-xs text-muted-foreground
              hover:text-foreground
              transition-colors
            "
          >
            ←
            {' '}
            {t('auth.backToHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}
