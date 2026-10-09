import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { Button, Skeleton } from '#/.generated/shadcn/components/ui';
import { PageSection, SectionCard } from '#/components/layout';
import { listPublicNotices } from '#/features/content/public-content.api';

export const Route = createFileRoute('/_public/_app/notices/')({ component: NoticesPage });

function NoticesPage() {
  const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ['public-notices', page], queryFn: ({ signal }) => listPublicNotices(page, signal) });
  return (
    <div className="
      size-full px-6 py-8
      md:px-8
    "
    >
      <PageSection icon="megaphone" title="공지사항" description="서비스의 주요 안내와 긴급 공지를 확인하세요.">
        <PageSection.Content className="
          mx-auto grid size-full w-full max-w-4xl grid-rows-[minmax(0,1fr)]
          gap-4 pt-2
        "
        >
          <SectionCard textSize="sm">
            <SectionCard.Content className="
              grid h-full content-start gap-0 overflow-y-auto
            "
            >
              {query.isLoading && (
                <div className="grid gap-3 p-4">
                  {[1, 2, 3].map((item) => (
                    <Skeleton
                      key={item}
                      className="h-16 w-full"
                    />
                  ))}
                </div>
              )}
              {query.isError && <p className="p-6 text-sm text-destructive">공지사항을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}
              {!query.isLoading && !query.isError && query.data?.items.length === 0 && (
                <p className="p-6 text-sm text-muted-foreground">
                  등록된 공지사항이 없습니다.
                </p>
              )}
              {query.data?.items.map((notice) => (
                <details
                  key={notice.id}
                  className="
                    group border-b
                    last:border-b-0
                  "
                >
                  <summary className="
                    flex cursor-pointer list-none flex-wrap items-center gap-2
                    px-5 py-4
                  "
                  >
                    {notice.importance !== 'normal' && (
                      <span className={`
                        rounded-full px-2 py-1 text-xs font-semibold
                        ${notice.importance === 'urgent'
                        ? `bg-destructive/10 text-destructive`
                        : `
                          bg-amber-500/10 text-amber-700
                          dark:text-amber-300
                        `}
                      `}
                      >
                        {notice.importance === 'urgent' ? '긴급' : '중요'}
                      </span>
                    )}
                    {notice.isPinned && (
                      <span className="text-xs font-semibold text-primary">
                        고정
                      </span>
                    )}
                    <span className="min-w-0 flex-1 font-medium">{notice.title}</span>
                    <time className="text-xs text-muted-foreground">{notice.publishedAt ? new Date(notice.publishedAt).toLocaleDateString('ko-KR') : ''}</time>
                  </summary>
                  <div className="
                    whitespace-pre-wrap border-t bg-muted/20 p-5 text-sm/7
                    text-muted-foreground
                  "
                  >
                    {notice.content}
                  </div>
                </details>
              ))}
              {!!query.data?.items.length && (
                <div className="flex items-center justify-between p-4">
                  <Button variant="outline" size="sm" disabled={page <= 1 || query.isFetching} onClick={() => setPage((current) => current - 1)}>이전</Button>
                  <span className="text-xs text-muted-foreground">
                    {page}
                    {' '}
                    /
                    {' '}
                    {query.data.totalPages || 1}
                  </span>
                  <Button variant="outline" size="sm" disabled={!query.data.hasNextPage || query.isFetching} onClick={() => setPage((current) => current + 1)}>다음</Button>
                </div>
              )}
            </SectionCard.Content>
          </SectionCard>
        </PageSection.Content>
      </PageSection>
    </div>
  );
}
