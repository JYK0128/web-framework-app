import { useI18n } from '@pkg/shared/web';

import { Badge } from '#/.generated/shadcn/components/ui';

export function ProfileHeader() {
  const { t } = useI18n();

  return (
    <header className="mb-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{t('profile.title')}</h1>
          <Badge variant="secondary" className="shrink-0">{t('profile.verifiedBadge')}</Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {t('profile.subtitle')}
        </p>
      </div>

    </header>
  );
}
