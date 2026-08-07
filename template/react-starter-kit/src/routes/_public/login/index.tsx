import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { Card, CardContent } from '#/.generated/shadcn/components/ui';
import { useAuth } from '#/core/auth/useAuth';

import { CredentialForm } from './-components/CredentialForm';
import { LoginBrandHeader } from './-components/LoginBrandHeader';
import { TwoFactorForm } from './-components/TwoFactorForm';

export const Route = createFileRoute('/_public/login/')({
  component: LoginPageComponent,
});

function LoginPageComponent() {
  const navigate = useNavigate();
  const { isAuthenticated, is2FAPending } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  useEffect(() => {
    if (!isAuthenticated || is2FAPending) return;
    void navigate({ to: '/onboarding' });
  }, [isAuthenticated, is2FAPending, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="grid w-full max-w-md gap-6">
        <LoginBrandHeader
          pending2FA={is2FAPending}
          pendingTerms={false}
          mode={activeTab}
        />

        <Card>
          <CardContent className="grid gap-4 p-6">
            {is2FAPending
              ? <TwoFactorForm />
              : (
                <CredentialForm
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                />
              )}
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
            ← 메인 화면으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
