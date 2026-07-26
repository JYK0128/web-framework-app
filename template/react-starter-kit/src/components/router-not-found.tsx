import { useI18n } from '@pkg/shared/web';
import { Link, useRouter } from '@tanstack/react-router';

import { Button } from '#/.generated/shadcn/components/ui';

export function RouterNotFound() {
  const router = useRouter();
  const { t } = useI18n();

  const goBack = () => {
    if (router.history.canGoBack()) {
      router.history.back();
      return;
    }

    void router.navigate({ to: '/' });
  };

  return (
    <main className="grid min-h-full place-items-center bg-muted/30 p-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <p className="text-6xl font-semibold tracking-tight">404</p>
        <h1 className="text-2xl font-semibold">{t('page.notFound.title')}</h1>
        <p className="text-muted-foreground">{t('page.notFound.description')}</p>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={goBack}>
            {t('common.goBack')}
          </Button>
          <Link
            to="/"
            className="
              text-sm font-medium text-primary underline underline-offset-4
            "
          >
            {t('page.notFound.goHome')}
          </Link>
        </div>
      </div>
    </main>
  );
}
