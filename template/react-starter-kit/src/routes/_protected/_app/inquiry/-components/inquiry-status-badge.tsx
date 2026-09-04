import type { InquiryStatus } from '#/.generated/api/model';
import { Badge } from '#/.generated/shadcn/components/ui';
import { useI18n } from '#/hooks';

export function InquiryStatusBadge({
  status,
  className,
}: {
  status: InquiryStatus
  className?: string
}) {
  const { t } = useI18n();

  if (status === 'answered') {
    return (
      <Badge
        variant="default"
        className={`
          bg-sky-600
          hover:bg-sky-600
          text-white font-medium shadow-none border-transparent
          ${className ?? ''}
        `}
      >
        {t('inquiry.answered')}
      </Badge>
    );
  }
  if (status === 'closed') {
    return (
      <Badge
        variant="outline"
        className={`
          text-muted-foreground font-medium border-border/80
          ${className ?? ''}
        `}
      >
        {t('inquiry.closed')}
      </Badge>
    );
  }
  return (
    <Badge
      variant="secondary"
      className={`
        bg-amber-500/15 text-amber-700
        dark:text-amber-400
        font-medium border-amber-500/30
        ${className ?? ''}
      `}
    >
      {t('inquiry.pending')}
    </Badge>
  );
}
