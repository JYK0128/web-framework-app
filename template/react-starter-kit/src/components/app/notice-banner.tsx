import { useI18n } from '@pkg/shared/web';
import { useNavigate } from '@tanstack/react-router';
import { AlertTriangle, Megaphone, X } from 'lucide-react';
import { useState } from 'react';

import { useNoticesControllerGetNoticeFeed } from '#/.generated/api/endpoints/notices/notices';
import { Badge, Button, Card, CardContent } from '#/.generated/shadcn/components/ui';

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

  return (
    <Card className="border-primary/25 bg-primary/5 shadow-xs">
      <CardContent className="
        flex flex-col gap-4 p-4
        sm:flex-row sm:items-center sm:justify-between
      "
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className="
            flex size-9 shrink-0 items-center justify-center rounded-lg
            bg-primary/10 text-primary
          "
          >
            {notice.priority >= 2
              ? <AlertTriangle className="size-4" />
              : (
                <Megaphone className="size-4" />
              )}
          </div>
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge variant={notice.priority >= 2 ? 'destructive' : 'outline'}>
                {notice.priority >= 2 ? t('notices.urgent') : t('notices.important')}
              </Badge>
            </div>
            <h2 className="truncate text-sm font-semibold">{notice.title}</h2>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{notice.content}</p>
          </div>
        </div>
        <div className="
          flex shrink-0 gap-2
          sm:self-center
        "
        >
          <Button variant="outline" size="sm" onClick={() => void navigate({ to: '/notice' })}>
            {t('notices.viewDetails')}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDismiss} title={t('common.close')}>
            <X className="size-4" />
            <span className="sr-only">{t('common.close')}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
