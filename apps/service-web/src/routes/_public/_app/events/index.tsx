import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { Button, Skeleton } from '#/.generated/shadcn/components/ui';
import { PageSection, SectionCard } from '#/components/layout';
import { listPublicEvents } from '#/features/content/public-content.api';

export const Route = createFileRoute('/_public/_app/events/')({ component: EventsPage });

function EventsPage() {
  const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ['public-events', page], queryFn: ({ signal }) => listPublicEvents(page, signal) });
  return (
    <div className="
      size-full px-6 py-8
      md:px-8
    "
    >
      <PageSection icon="calendar-days" title="이벤트" description="진행 중이거나 예정된 이벤트를 확인하세요.">
        <PageSection.Content className="
          mx-auto grid size-full w-full max-w-4xl grid-rows-[minmax(0,1fr)]
          gap-4 pt-2
        "
        >
          <SectionCard textSize="sm">
            <SectionCard.Content className="
              grid h-full content-start gap-4 overflow-y-auto p-4
            "
            >
              {query.isLoading && [1, 2].map((item) => (
                <Skeleton
                  key={item}
                  className="h-48 w-full"
                />
              ))}
              {query.isError && <p className="p-4 text-sm text-destructive">이벤트를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}
              {!query.isLoading && !query.isError && query.data?.items.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground">
                  등록된 이벤트가 없습니다.
                </p>
              )}
              {query.data?.items.map((event) => (
                <article
                  key={event.id}
                  className="overflow-hidden rounded-xl border"
                >
                  {event.imageUrl && (
                    <img
                      src={event.imageUrl}
                      alt=""
                      className="max-h-80 w-full object-cover"
                    />
                  )}
                  <div className="grid gap-3 p-5">
                    <div className="text-xs font-medium text-muted-foreground">
                      {new Date(event.startsAt).toLocaleDateString('ko-KR')}
                      {' '}
                      –
                      {' '}
                      {new Date(event.endsAt).toLocaleDateString('ko-KR')}
                    </div>
                    <h2 className="text-lg font-semibold">{event.title}</h2>
                    <p className="
                      whitespace-pre-wrap text-sm/7 text-muted-foreground
                    "
                    >
                      {event.content}
                    </p>
                    {event.linkUrl && (
                      <a
                        className="
                          w-fit text-sm font-semibold text-primary underline
                          underline-offset-4
                        "
                        href={event.linkUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        이벤트 자세히 보기
                      </a>
                    )}
                  </div>
                </article>
              ))}
              {!!query.data?.items.length && (
                <div className="flex items-center justify-between">
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
