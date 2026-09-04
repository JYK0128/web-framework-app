import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Loader2, LogOut } from 'lucide-react';
import type { IconName } from 'lucide-react/dynamic';
import type { ReactNode } from 'react';

import { getAuthControllerUserProfileQueryKey, useAuthControllerLogout } from '#/.generated/api/endpoints/auth/auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { AppIcon } from '#/components/app';
import { ScreenLayout } from '#/components/layout';
import { useI18n } from '#/hooks';

type OnboardingLayoutProps = {
  icon?: IconName
  title: ReactNode
  description?: ReactNode
  badgeContent?: ReactNode
  footer?: ReactNode
  children: ReactNode
};

export function OnboardingLayout({
  icon,
  title,
  description,
  badgeContent,
  footer,
  children,
}: OnboardingLayoutProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const logoutMutation = useAuthControllerLogout();
  const isLoggingOut = logoutMutation.isPending;

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    }
    catch {
      // Proceed with client-side cleanup regardless of network error
    }
    finally {
      await queryClient.invalidateQueries({
        queryKey: getAuthControllerUserProfileQueryKey(),
      });
      void navigate({ to: '/login' });
    }
  };

  return (
    <ScreenLayout>
      <ScreenLayout.Content>
        <Card className="flex w-full flex-col justify-between shadow-xl">
          <CardHeader className="flex items-center justify-between gap-4">
            <div className="grid gap-1">
              <div className="flex items-center gap-2">
                {icon && (
                  <AppIcon
                    name={icon}
                    className="size-5 text-primary"
                  />
                )}
                {title && <CardTitle className="text-xl font-bold">{title}</CardTitle>}
              </div>
              {description && <CardDescription>{description}</CardDescription>}
            </div>

            {badgeContent && (
              <div className="flex items-center gap-2">
                {badgeContent}
              </div>
            )}
          </CardHeader>

          <CardContent className="grid flex-1 gap-4 overflow-hidden p-6">
            {children}
          </CardContent>

          {footer && (
            <CardFooter>
              {footer}
            </CardFooter>
          )}
        </Card>
      </ScreenLayout.Content>

      <ScreenLayout.Addon>
        <button
          type="button"
          onClick={() => {
            void handleLogout();
          }}
          disabled={isLoggingOut}
          className="
            flex items-center gap-1.5 text-xs text-muted-foreground
            hover:text-foreground
            transition-colors
            disabled:opacity-50
          "
        >
          {isLoggingOut
            ? (
              <Loader2 className="size-3.5 animate-spin" />
            )
            : (
              <LogOut className="size-3.5" />
            )}
          <span>{t('onboarding.goToLogin')}</span>
        </button>
      </ScreenLayout.Addon>
    </ScreenLayout>
  );
}
