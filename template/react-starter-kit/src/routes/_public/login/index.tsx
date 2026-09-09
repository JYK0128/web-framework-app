import { createFileRoute, Link } from '@tanstack/react-router';

import { getAuthControllerGetEnabledProvidersQueryOptions } from '#/.generated/api/endpoints/auth/auth';
import { getSystemConfigControllerGetSystemConfigQueryOptions } from '#/.generated/api/endpoints/system-config/system-config';
import { Card, CardContent } from '#/.generated/shadcn/components/ui';
import { ScreenLayout } from '#/components/layout';
import { useHashTab, useI18n } from '#/hooks';

import { CredentialForm } from './-components/credential-form';

const LOGIN_TABS = ['login', 'register'] as const;
type LoginTab = typeof LOGIN_TABS[number];

export const Route = createFileRoute('/_public/login/')({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(getAuthControllerGetEnabledProvidersQueryOptions()),
      context.queryClient.ensureQueryData(getSystemConfigControllerGetSystemConfigQueryOptions()),
    ]);
  },
  component: LoginPageComponent,
});

function LoginPageComponent() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useHashTab<LoginTab>(LOGIN_TABS, 'login');

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
          {t('login.backToHome')}
        </Link>
      </ScreenLayout.Addon>
    </ScreenLayout>
  );
}
