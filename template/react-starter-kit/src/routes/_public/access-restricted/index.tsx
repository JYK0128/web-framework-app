import { createFileRoute, Link } from '@tanstack/react-router';
import { Copy, HelpCircle, Home, KeyRound, Lock, RefreshCw, Scale, ShieldAlert, ShieldX, Timer } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '#/.generated/shadcn/components/ui';
import { ScreenLayout, ScreenSectionCard } from '#/components/layout';
import { useI18n } from '#/hooks';

export const Route = createFileRoute('/_public/access-restricted/')({
  head: () => ({
    meta: [{ title: 'Access Restricted' }],
  }),
  component: AccessRestrictedPage,
});

type RestrictionType = 'TOO_MANY_REQUESTS' | 'USER_BANNED' | 'ACCOUNT_LOCKED' | 'LEGAL' | 'FORBIDDEN' | 'DEFAULT';

function resolveRestrictionType(code?: string | null, status?: string | null): RestrictionType {
  const normalizedCode = code?.toUpperCase();
  const statusCode = Number(status);

  if (normalizedCode === 'TOO_MANY_REQUESTS' || statusCode === 429) {
    return 'TOO_MANY_REQUESTS';
  }
  if (normalizedCode === 'USER_BANNED') {
    return 'USER_BANNED';
  }
  if (normalizedCode === 'ACCOUNT_LOCKED') {
    return 'ACCOUNT_LOCKED';
  }
  if (statusCode === 451 || normalizedCode?.includes('LEGAL')) {
    return 'LEGAL';
  }
  if (normalizedCode === 'FORBIDDEN' || statusCode === 403 || normalizedCode === 'BFF_ACCESS_REQUIRED') {
    return 'FORBIDDEN';
  }
  return 'DEFAULT';
}

function AccessRestrictedPage() {
  const { i18n, t } = useI18n();
  const language = i18n.language;

  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const code = params.get('code');
  const status = params.get('status');
  const callback = params.get('callback') || '/';
  const errorMessage = params.get('message');

  const restrictionType = resolveRestrictionType(code, status);

  const handleCopy = async () => {
    const textToCopy = errorMessage || `Code: ${code ?? 'UNKNOWN'}, Status: ${status ?? 'RESTRICTED'}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.success(t('accessRestricted.common.copied'));
    }
    catch {
      toast.error(t('accessRestricted.common.copyFailed'));
    }
  };

  const handleRetry = () => {
    window.location.href = callback;
  };

  const config = {
    TOO_MANY_REQUESTS: {
      icon: Timer,
      iconClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-500',
      statusClass: 'text-amber-600 dark:text-amber-500',
      status: t('accessRestricted.tooManyRequests.status'),
      title: t('accessRestricted.tooManyRequests.title'),
      description: t('accessRestricted.tooManyRequests.description'),
    },
    USER_BANNED: {
      icon: ShieldAlert,
      iconClass: 'bg-destructive/10 text-destructive',
      statusClass: 'text-destructive',
      status: t('accessRestricted.userBanned.status'),
      title: t('accessRestricted.userBanned.title'),
      description: t('accessRestricted.userBanned.description'),
    },
    ACCOUNT_LOCKED: {
      icon: Lock,
      iconClass: 'bg-destructive/10 text-destructive',
      statusClass: 'text-destructive',
      status: t('accessRestricted.accountLocked.status'),
      title: t('accessRestricted.accountLocked.title'),
      description: t('accessRestricted.accountLocked.description'),
    },
    LEGAL: {
      icon: Scale,
      iconClass: 'bg-destructive/10 text-destructive',
      statusClass: 'text-destructive',
      status: t('accessRestricted.legal.status'),
      title: t('accessRestricted.legal.title'),
      description: t('accessRestricted.legal.description'),
    },
    FORBIDDEN: {
      icon: ShieldX,
      iconClass: 'bg-destructive/10 text-destructive',
      statusClass: 'text-destructive',
      status: t('accessRestricted.forbidden.status'),
      title: t('accessRestricted.forbidden.title'),
      description: t('accessRestricted.forbidden.description'),
    },
    DEFAULT: {
      icon: ShieldAlert,
      iconClass: 'bg-destructive/10 text-destructive',
      statusClass: 'text-destructive',
      status: t('accessRestricted.common.defaultStatus'),
      title: t('accessRestricted.common.defaultTitle'),
      description: t('accessRestricted.common.defaultDescription'),
    },
  }[restrictionType];

  const IconComponent = config.icon;

  return (
    <ScreenLayout>
      <ScreenLayout.Content>
        <ScreenSectionCard className="w-full flex flex-col justify-between shadow-xl">
          <ScreenSectionCard.Content className="
            grid justify-items-center gap-4 text-center p-6 py-8
          "
          >
            <div className={`
              flex size-14 items-center justify-center rounded-full
              ${config.iconClass}
            `}
            >
              <IconComponent className="size-7" aria-hidden="true" />
            </div>
            <div className="grid gap-1.5">
              <p className={`
                text-xs font-semibold
                ${config.statusClass}
              `}
              >
                {config.status}
              </p>
              <h1 className="text-2xl font-bold tracking-tight">{config.title}</h1>
              <p className="
                whitespace-pre-line text-xs text-muted-foreground mt-1
              "
              >
                {config.description}
              </p>
            </div>

            {errorMessage && (
              <div className="w-full mt-2 text-left">
                <div className="relative">
                  <pre className="
                    max-h-36 scroll-y rounded-md bg-muted p-2.5 pr-10 font-mono
                    text-xs text-muted-foreground whitespace-pre-wrap break-all
                  "
                  >
                    {errorMessage}
                  </pre>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="absolute top-1.5 right-1.5 text-muted-foreground"
                    onClick={() => void handleCopy()}
                    aria-label={t('accessRestricted.common.copy')}
                    title={t('accessRestricted.common.copy')}
                  >
                    <Copy className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </ScreenSectionCard.Content>

          <ScreenSectionCard.Footer className="flex w-full items-center justify-center gap-3">
            {restrictionType === 'TOO_MANY_REQUESTS' && (
              <Button
                type="button"
                onClick={handleRetry}
                className="flex-1 gap-1.5"
              >
                <RefreshCw className="size-4" />
                {t('accessRestricted.tooManyRequests.retry')}
              </Button>
            )}

            {restrictionType === 'ACCOUNT_LOCKED' && (
              <Button
                type="button"
                render={(
                  <Link
                    to="/find-account"
                  />
                )}
                className="flex-1 gap-1.5"
              >
                <KeyRound className="size-4" />
                {t('accessRestricted.accountLocked.resetPassword')}
              </Button>
            )}

            {(restrictionType === 'USER_BANNED' || restrictionType === 'FORBIDDEN') && (
              <Button
                type="button"
                render={(
                  <Link
                    to="/support"
                    search={{ ticketId: undefined }}
                  />
                )}
                className="flex-1 gap-1.5"
              >
                <HelpCircle className="size-4" />
                {t('accessRestricted.common.support')}
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              render={(
                <Link
                  to="/{-$locale}"
                  params={{ locale: language }}
                />
              )}
              className="flex-1 gap-1.5"
            >
              <Home className="size-4" />
              {t('accessRestricted.common.home')}
            </Button>
          </ScreenSectionCard.Footer>
        </ScreenSectionCard>
      </ScreenLayout.Content>
    </ScreenLayout>
  );
}
