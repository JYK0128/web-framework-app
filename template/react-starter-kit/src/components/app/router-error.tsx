import { useI18n } from '@pkg/shared/web';
import type { ErrorComponentProps } from '@tanstack/react-router';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';

export function RouterError({ error }: ErrorComponentProps) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const { t } = useI18n();

  return (
    <main className="grid min-h-full place-items-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('page.error.title')}</CardTitle>
          <CardDescription>
            {t('page.error.hint')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ErrorDetails message={errorMessage} />
          <Button type="button" onClick={() => window.location.reload()}>
            {t('common.reload')}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

function ErrorDetails({ message }: Readonly<{ message: string }>) {
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <pre className="
      scroll max-h-40 rounded-md bg-muted text-xs whitespace-pre-wrap
    "
    >
      {message}
    </pre>
  );
}
