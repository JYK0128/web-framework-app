import { type ErrorComponentProps, Link } from '@tanstack/react-router';
import { AlertTriangle, Copy, Home, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { ScreenLayout } from '#/components/layout';
import { useI18n } from '#/hooks';

export interface RouterErrorProps extends Partial<ErrorComponentProps<unknown>> {
  error: unknown
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error) return JSON.stringify(error);
  return '';
}

export function RouterError({ error, reset }: RouterErrorProps) {
  const errorMessage = getErrorMessage(error);
  const { i18n, t } = useI18n();
  const language = i18n.language;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(errorMessage);
      toast.success(t('app.routerError.copied'));
    }
    catch {
      toast.error(t('app.routerError.copyFailed'));
    }
  };

  return (
    <ScreenLayout>
      <ScreenLayout.Content>
        <Card className="w-full flex flex-col justify-between shadow-xl">
          <CardHeader className="
            text-center
            sm:text-left
          "
          >
            <div className="
              flex size-12 items-center justify-center rounded-full
              bg-destructive/10 text-destructive mb-2 mx-auto
              sm:mx-0
            "
            >
              <AlertTriangle className="size-6" />
            </div>
            <CardTitle className="text-destructive text-lg font-bold">
              {t('app.routerError.title')}
            </CardTitle>
            <CardDescription className="
              whitespace-pre-line text-xs text-muted-foreground
            "
            >
              {t('app.routerError.hint')}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 overflow-hidden p-6 pt-0">
            <ErrorDetails message={errorMessage} onCopy={() => void handleCopy()} copyLabel={t('app.routerError.copy')} />
          </CardContent>

          <CardFooter className="flex w-full items-center justify-center gap-3">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (reset) reset();
                else window.location.reload();
              }}
              className="flex-1 gap-1.5"
            >
              <RefreshCw className="size-4" />
              {t('app.routerError.reload')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              render={(
                <Link
                  to="/{-$locale}"
                  params={{ locale: language }}
                />
              )}
              className="flex-1 gap-1.5"
            >
              <Home className="size-4" />
              {t('app.routerError.home')}
            </Button>
          </CardFooter>
        </Card>
      </ScreenLayout.Content>
    </ScreenLayout>
  );
}

function ErrorDetails({ copyLabel, message, onCopy }: Readonly<{ copyLabel: string, message: string, onCopy: () => void }>) {
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="relative">
      <pre
        className="
          max-h-40 overflow-auto rounded-md bg-muted p-2.5 pr-10 font-mono
          text-xs text-muted-foreground
        "
      >
        {message}
      </pre>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="absolute top-1.5 right-1.5 text-muted-foreground"
        onClick={onCopy}
        disabled={!message}
        aria-label={copyLabel}
        title={copyLabel}
      >
        <Copy />
      </Button>
    </div>
  );
}
