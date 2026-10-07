import { createFileRoute, Link } from '@tanstack/react-router';

import { getAuthControllerGetEnabledProvidersQueryOptions } from '#/.generated/api/endpoints/auth/auth';
import { ScreenLayout, ScreenSectionCard } from '#/components/layout';
import { useHashTab, useI18n } from '#/hooks';

import { CredentialForm } from './-components/credential-form';

const LOGIN_TABS = ['login', 'register'] as const;
type LoginTab = typeof LOGIN_TABS[number];

export const Route = createFileRoute('/_public/login/')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(getAuthControllerGetEnabledProvidersQueryOptions());
  },
  component: LoginPageComponent,
});

function LoginPageComponent() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useHashTab<LoginTab>(LOGIN_TABS, 'login');

  return (
    <ScreenLayout>
      <ScreenLayout.Content>
        <ScreenSectionCard className="w-full shadow-xl">
          <ScreenSectionCard.Content className="p-6">
            <CredentialForm
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </ScreenSectionCard.Content>
        </ScreenSectionCard>
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
