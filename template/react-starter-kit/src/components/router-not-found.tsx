import { useI18n } from '@pkg/shared/web';
import { Link, useRouter } from '@tanstack/react-router';

import { Button } from '#.generated/shadcn/components/ui';

export function RouterNotFound() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <div className="
      flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center
    "
    >
      <div className="space-y-2">
        <p className="text-4xl font-extrabold tracking-tight">404</p>
        <h1 className="text-xl font-bold">{t('page_not_found')}</h1>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => void router.history.back()}>
          {t('retry')}
        </Button>
        <Link
          to="/"
          className="
            text-sm font-medium text-primary underline underline-offset-4
          "
        >
          {t('go_home')}
        </Link>
      </div>
    </div>
  );
}
