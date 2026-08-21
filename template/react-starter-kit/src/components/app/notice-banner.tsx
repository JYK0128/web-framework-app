import { useI18n } from '@pkg/shared/web';
import { useNavigate } from '@tanstack/react-router';
import { AlertTriangle, Megaphone, X } from 'lucide-react';
import { useState } from 'react';

import { useNoticesControllerGetNoticeFeed } from '#/.generated/api/endpoints/notices/notices';
import { Badge, Button } from '#/.generated/shadcn/components/ui';

export function NoticeBanner() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [dismissedNoticeIds, setDismissedNoticeIds] = useState<Set<string>>(() => new Set());
  const { data } = useNoticesControllerGetNoticeFeed({ limit: 20 });
  const notice = data?.items.find((item) => item.priority > 0 && !dismissedNoticeIds.has(item.id));

  if (!notice) return null;

  const handleDismiss = () => {
    setDismissedNoticeIds((prev) => new Set(prev).add(notice.id));
  };

  const handleNavigateToDetail = () => {
    void navigate({
      to: '/notice',
      search: { noticeId: notice.id },
    });
  };

  const isUrgent = notice.priority >= 2;

  return (
    <div
      role="alert"
      className={`
        relative flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2 transition-all shadow-xs
        ${isUrgent
          ? 'border-destructive/25 bg-destructive/10 text-foreground'
          : 'border-primary/20 bg-primary/5 text-foreground'
        }
      `}
    >
      <div
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5"
        onClick={handleNavigateToDetail}
      >
        <div className={`flex shrink-0 items-center justify-center rounded-md p-1 ${isUrgent ? 'bg-destructive/15 text-destructive' : 'bg-primary/10 text-primary'}`}>
          {isUrgent ? <AlertTriangle className="size-3.5" /> : <Megaphone className="size-3.5" />}
        </div>
        <Badge
          variant={isUrgent ? 'destructive' : 'outline'}
          className="shrink-0 px-1.5 py-0 text-[11px] font-semibold"
        >
          {isUrgent ? t('notices.urgent') : t('notices.important')}
        </Badge>
        <span className="truncate text-xs sm:text-sm font-medium text-foreground hover:underline">
          {notice.title}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2.5 text-xs font-medium hover:bg-background/60"
          onClick={handleNavigateToDetail}
        >
          {t('notices.viewDetails')}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-foreground"
          onClick={handleDismiss}
          title={t('common.close')}
        >
          <X className="size-3.5" />
          <span className="sr-only">{t('common.close')}</span>
        </Button>
      </div>
    </div>
  );
}
