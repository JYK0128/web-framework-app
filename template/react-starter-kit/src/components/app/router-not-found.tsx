import { Link, useRouter } from '@tanstack/react-router';

import { Button, Card, CardContent, CardFooter } from '#/.generated/shadcn/components/ui';
import { ScreenLayout } from '#/components/layout';
import { useI18n } from '#/hooks';

export function RouterNotFound() {
  const router = useRouter();
  const { i18n, t } = useI18n();
  const language = i18n.language;

  const goBack = () => {
    if (router.history.canGoBack()) {
      router.history.back();
      return;
    }

    void router.navigate({
      to: '/{-$locale}',
      params: { locale: language },
    });
  };

  return (
    <ScreenLayout>
      <ScreenLayout.Content>
        <Card className="w-full flex flex-col justify-between shadow-xl">
          <CardContent className="
            grid justify-items-center gap-2 text-center p-6 py-8
          "
          >
            <p className="text-6xl font-bold tracking-tight text-primary">404</p>
            <h1 className="text-2xl font-bold">{t('page.notFound.title')}</h1>
            <p className="text-xs text-muted-foreground">{t('page.notFound.description')}</p>
          </CardContent>

          <CardFooter className="flex w-full items-center justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={goBack}
              className="flex-1"
            >
              {t('common.goBack')}
            </Button>
            <Button
              size="sm"
              render={(
                <Link
                  to="/{-$locale}"
                  params={{ locale: language }}
                />
              )}
              className="flex-1"
            >
              {t('common.home')}
            </Button>
          </CardFooter>
        </Card>
      </ScreenLayout.Content>
    </ScreenLayout>
  );
}
