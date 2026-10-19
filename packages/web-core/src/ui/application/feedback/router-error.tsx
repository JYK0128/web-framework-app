import { ApplicationError } from '@pkg/shared/common';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { AlertTriangle, Copy, Home, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { useI18n } from '#context/i18n';
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '#ui';
import { Link, ScreenLayout } from '#ui/template';

export function RouterError({ error }: Partial<ErrorComponentProps<unknown>> & { error: unknown }) {
  const { i18n } = useI18n();
  const message = getErrorMessage(error, i18n);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success(i18n.t('routerError.copySuccess'));
    }
    catch {
      toast.error(i18n.t('routerError.copyFailed'));
    }
  };

  return (
    <ScreenLayout.Root>
      <ScreenLayout.Content>
        <Card className="w-full shadow-xl">
          <CardHeader>
            <AlertTriangle className="size-8 text-destructive" />
            <CardTitle>{i18n.t('routerError.title')}</CardTitle>
            <CardDescription>{i18n.t('routerError.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="
                max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-md
                bg-muted p-3 pr-11 text-xs text-muted-foreground
              "
              >
                {message}
              </pre>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="absolute right-1.5 top-1.5 text-muted-foreground"
                onClick={() => void handleCopy()}
                disabled={!message}
                aria-label={i18n.t('routerError.copy')}
                title={i18n.t('routerError.copy')}
              >
                <Copy />
              </Button>
            </div>
          </CardContent>
          <CardFooter className="gap-3">
            <Button className="flex-1" onClick={() => window.location.reload()}>
              <RefreshCw />
              {i18n.t('routerError.reload')}
            </Button>
            <Link className="flex-1" variant="outline" to="/">
              <Home />
              {i18n.t('routerError.home')}
            </Link>
          </CardFooter>
        </Card>
      </ScreenLayout.Content>
    </ScreenLayout.Root>
  );
}

function getErrorMessage(error: unknown, i18n: ReturnType<typeof useI18n>['i18n']): string {
  if (error instanceof ApplicationError) return error.code;
  if (error instanceof Error) return getStableErrorCode(error) ?? error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const code = 'code' in error && typeof error.code === 'string' ? error.code : undefined;
    if (code) return code;
    const message = 'message' in error && typeof error.message === 'string' ? error.message : undefined;
    if (message) return getStableErrorCode({ message }) ?? message;
    return JSON.stringify(error);
  }
  return i18n.t('routerError.unknown');
}

function getStableErrorCode(error: { message: string }): string | undefined {
  return /\b[A-Z][A-Z0-9_]{2,}\b(?=$|\s)/.exec(error.message)?.[0];
}
