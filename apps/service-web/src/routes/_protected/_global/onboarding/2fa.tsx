import { z } from '@pkg/shared/common';
import { createFileRoute } from '@tanstack/react-router';

import { ScreenLayout } from '#/components/layout';
import { TwoFactorSettings } from '#/routes/_protected/_app/profile/-components/two-factor-settings';

export const Route = createFileRoute('/_protected/_global/onboarding/2fa')({
  validateSearch: z.object({ callback: z.string().optional() }),
  component: TwoFactorOnboardingPage,
});

function TwoFactorOnboardingPage() {
  const { user } = Route.useRouteContext();

  return (
    <ScreenLayout>
      <ScreenLayout.Content className="flex items-center justify-center">
        <div className="w-full max-w-md">
          <TwoFactorSettings user={user} />
        </div>
      </ScreenLayout.Content>
      <ScreenLayout.Addon>인증 앱을 등록한 뒤 확인 코드를 입력해 주세요.</ScreenLayout.Addon>
    </ScreenLayout>
  );
}
