import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Loader2, LogOut } from 'lucide-react';
import type { IconName } from 'lucide-react/dynamic';
import type { ReactNode } from 'react';

import { useAuthControllerLogoutV1 } from '#/.generated/api/endpoints/auth/auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { AppIcon } from '#/components/app';
import { ScreenLayout } from '#/components/layout';

type OnboardingLayoutProps = {
  icon?: IconName
  title: ReactNode
  description?: ReactNode
  footer?: ReactNode
  children: ReactNode
};

export function OnboardingLayout({ icon, title, description, footer, children }: OnboardingLayoutProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logoutMutation = useAuthControllerLogoutV1();

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync({ data: {} });
    }
    finally {
      queryClient.clear();
      await navigate({ to: '/login', replace: true });
    }
  };

  return (
    <ScreenLayout>
      <ScreenLayout.Content>
        <Card className="
          flex w-full max-w-2xl flex-col justify-between shadow-xl
        "
        >
          <CardHeader className="flex items-center justify-between gap-4">
            <div className="grid gap-1">
              <div className="flex items-center gap-2">
                {icon && <AppIcon name={icon} className="size-5 text-primary" />}
                <CardTitle className="text-xl font-bold">{title}</CardTitle>
              </div>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
          </CardHeader>
          <CardContent className="grid flex-1 gap-4 overflow-hidden p-6">{children}</CardContent>
          {footer && <CardFooter>{footer}</CardFooter>}
        </Card>
      </ScreenLayout.Content>
      <ScreenLayout.Addon>
        <button
          type="button"
          disabled={logoutMutation.isPending}
          className="
            flex items-center gap-1.5 text-xs text-muted-foreground
            transition-colors
            hover:text-foreground
            disabled:opacity-50
          "
          onClick={() => void logout()}
        >
          {logoutMutation.isPending
            ? <Loader2 className="size-3.5 animate-spin" />
            : (
              <LogOut className="size-3.5" />
            )}
          로그인으로 돌아가기
        </button>
      </ScreenLayout.Addon>
    </ScreenLayout>
  );
}
