import { useI18n } from '@pkg/shared/web';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { AlertTriangle, Megaphone } from 'lucide-react';

import { getNoticesControllerGetNoticeFeedQueryKey, useNoticesControllerGetNoticeFeed, useNoticesControllerMarkNoticeRead } from '#/.generated/api/endpoints/notices/notices';
import { Badge, Button, Card, CardContent } from '#/.generated/shadcn/components/ui';

export function NoticeBanner() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data } = useNoticesControllerGetNoticeFeed({ limit: 100 });
  const markReadMutation = useNoticesControllerMarkNoticeRead();
  const notice = data?.items.find((item) => !item.isRead && (item.isPinned || item.priority > 0));

  if (!notice) return null;

  const handleConfirm = async () => {
    try {
      await markReadMutation.mutateAsync({ id: notice.id });
      await queryClient.invalidateQueries({ queryKey: getNoticesControllerGetNoticeFeedQueryKey() });
      await queryClient.invalidateQueries({ queryKey: ['notice-feed-cursor'] });
    }
    catch {
      return;
    }
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
              {notice.isPinned && <Badge variant="secondary">{t('notices.pinned')}</Badge>}
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
          <Button variant="outline" size="sm" onClick={() => void navigate({ to: '/announcements' })}>
            {t('notices.viewDetails')}
          </Button>
          <Button size="sm" onClick={() => void handleConfirm()} disabled={markReadMutation.isPending}>
            {t('notices.confirmRead')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
