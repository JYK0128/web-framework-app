import { useI18n } from '#context/i18n';
import { Button, Card, CardContent, CardFooter } from '#ui';
import { Link, ScreenLayout } from '#ui/template';

export function RouterNotFound({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();

  return (
    <ScreenLayout.Root>
      <ScreenLayout.Content>
        <Card className="w-full shadow-xl">
          <CardContent className="
            grid justify-items-center gap-2 p-6 py-8 text-center
          "
          >
            <p className="text-6xl font-bold text-primary">404</p>
            <h1 className="text-2xl font-bold">{t('routerNotFound.title')}</h1>
          </CardContent>
          <CardFooter className="gap-3">
            <Button className="flex-1" variant="outline" onClick={onBack}>{t('routerNotFound.back')}</Button>
            <Link className="flex-1" variant="outline" to="/">{t('routerNotFound.home')}</Link>
          </CardFooter>
        </Card>
      </ScreenLayout.Content>
    </ScreenLayout.Root>
  );
}
