import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';

import { Card, CardContent } from '#/.generated/shadcn/components/ui';
import { ScreenLayout } from '#/components/layout';
import { useI18n } from '#/hooks';

import { CredentialForm } from './-components/credential-form';

export const Route = createFileRoute('/_public/login/')({
  component: LoginPageComponent,
});

function LoginPageComponent() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  return (
    <ScreenLayout>
      <ScreenLayout.Content>
        <Card className="w-full shadow-xl">
          <CardContent className="p-6">
            <CredentialForm
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </CardContent>
        </Card>
      </ScreenLayout.Content>

      <ScreenLayout.Addon>
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
      </ScreenLayout.Addon>
    </ScreenLayout>
  );
}
