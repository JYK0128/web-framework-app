import { useI18n } from '@pkg/shared/web';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { AlertTriangle, Megaphone } from 'lucide-react';

import { getNoticesControllerGetNoticeFeedQueryKey, useNoticesControllerGetNoticeFeed, useNoticesControllerMarkNoticeRead } from '#/.generated/api/endpoints/notices/notices';
import { Badge, Button, Card, CardContent } from '#/.generated/shadcn/components/ui';

/**
 * Banner
 *
 * 대시보드 상단에 표시되는 우선순위 공지 배너입니다.
 *
 * - priority > 0 인 공지 중 아직 읽지 않은 항목 1건을 자동 선택하여 표시합니다.
 * - priority >= 2 이면 "긴급" 뱃지 + 경고 아이콘, priority == 1 이면 "중요" 뱃지 + 메가폰 아이콘을 렌더링합니다.
 * - "자세히 보기" 버튼: /notice 페이지로 이동합니다.
 * - "확인" 버튼: 해당 공지를 읽음 처리(PATCH) 후 배너를 닫습니다.
 * - 표시할 미읽음 우선순위 공지가 없으면 null을 반환하여 레이아웃 공간을 차지하지 않습니다.
 */
export function NoticeBanner() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data } = useNoticesControllerGetNoticeFeed({ limit: 100 });
  const markReadMutation = useNoticesControllerMarkNoticeRead();
  const notice = data?.items.find((item) => !item.isRead && item.priority > 0);

  if (!notice) return null;

  const handleConfirm = async () => {
    try {
      await markReadMutation.mutateAsync({ id: notice.id });
      await queryClient.invalidateQueries({ queryKey: getNoticesControllerGetNoticeFeedQueryKey() });
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
          <Button size="sm" onClick={() => void handleConfirm()} disabled={markReadMutation.isPending}>
            {t('notices.confirmRead')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
