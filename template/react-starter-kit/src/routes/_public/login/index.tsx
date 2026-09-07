import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';

import { getAuthControllerGetEnabledProvidersQueryOptions } from '#/.generated/api/endpoints/auth/auth';
import { getSystemConfigControllerGetSystemConfigQueryOptions } from '#/.generated/api/endpoints/system-config/system-config';
import { Card, CardContent } from '#/.generated/shadcn/components/ui';
import { ScreenLayout } from '#/components/layout';
import { QUERY_GC_TIME_30S, QUERY_GC_TIME_120S, QUERY_STALE_TIME_10S, QUERY_STALE_TIME_60S } from '#/configs/query.config';
import { useI18n } from '#/hooks';

import { CredentialForm } from './-components/credential-form';

export const Route = createFileRoute('/_public/login/')({
  loader: async ({ context }) => {
    const [providersData, systemConfig] = await Promise.all([
      context.queryClient.ensureQueryData(getAuthControllerGetEnabledProvidersQueryOptions({
        query: { staleTime: QUERY_STALE_TIME_60S, gcTime: QUERY_GC_TIME_120S },
      })).catch(() => null),
      context.queryClient.ensureQueryData(getSystemConfigControllerGetSystemConfigQueryOptions({
        query: { staleTime: QUERY_STALE_TIME_10S, gcTime: QUERY_GC_TIME_30S },
      })).catch(() => null),
    ]);

    return {
      providers: providersData?.items ?? [],
      systemConfig,
    };
  },
  component: LoginPageComponent,
});

function LoginPageComponent() {
  const { t } = useI18n();
  const loaderData = Route.useLoaderData();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  return (
    <ScreenLayout>
      <ScreenLayout.Content>
        <Card className="w-full shadow-xl">
          <CardContent className="p-6">
            <CredentialForm
              activeTab={activeTab}
              onTabChange={setActiveTab}
              initialProviders={loaderData.providers}
              initialConfig={loaderData.systemConfig}
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
