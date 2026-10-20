import { useI18n } from '#context/i18n';
import { Card, CardContent } from '#ui';

export function LoadingRouter() {
  const { t } = useI18n();
  return (
    <div
      className="
        fixed inset-0 z-50 grid place-items-center bg-background/80 p-6
        backdrop-blur-sm
      "
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Card className="w-fit">
        <CardContent className="
          flex items-center justify-center gap-3 px-5 py-4
        "
        >
          <span
            aria-hidden="true"
            className="
              size-5 shrink-0 animate-web-core-loading-spin rounded-full
              border-2 border-muted-foreground/30 border-t-primary
            "
          />
          <p className="m-0 leading-5">{t('core.globalLoading.loading')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
