import { DateUtil } from '@pkg/shared/common';
import { useInfiniteQuery } from '@tanstack/react-query';

import { getServiceTermsControllerGetRevisionsV1QueryKey, serviceTermsControllerGetRevisionsV1 } from '#/.generated/api/endpoints/service-terms/service-terms';
import { Button, Skeleton } from '#/.generated/shadcn/components/ui';
import { SectionCard } from '#/components/layout';
import { Modal, type ModalComponentProps } from '#/components/modal';

type TermRevisionHistoryModalProps = ModalComponentProps & {
  term: { groupId: string, title: string }
};

export function TermRevisionHistoryModal({ term, open, onOpenChange }: TermRevisionHistoryModalProps) {
  const history = useInfiniteQuery({
    queryKey: getServiceTermsControllerGetRevisionsV1QueryKey(term.groupId, { limit: 10 }),
    queryFn: ({ pageParam, signal }) => serviceTermsControllerGetRevisionsV1(term.groupId, { page: pageParam, limit: 10 }, undefined, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.hasNextPage ? lastPage.page + 1 : undefined,
    enabled: Boolean(open),
  });
  const revisions = history.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <Modal.Content size="lg">
        <Modal.Header>
          <Modal.Title>
            {term.title}
            {' '}
            개정 이력
          </Modal.Title>
          <Modal.Description>게시된 약관의 버전과 변경 내용을 확인합니다.</Modal.Description>
        </Modal.Header>
        <Modal.Body className="
          scroll-y max-h-[min(600px,calc(100vh-12rem))] p-1
        "
        >
          <div className="grid gap-3">
            {history.isPending && <Skeleton className="h-24 w-full" />}
            {revisions.map((revision) => (
              <SectionCard key={revision.id} textSize="sm" icon="file-text" title={`v${revision.version}`} description={`게시일 · ${DateUtil.dateTime.formatLocale(revision.publishedAt)}`}>
                <SectionCard.Content className="grid gap-3 text-sm">
                  <div>
                    <p className="font-medium">개정 사유</p>
                    <p className="whitespace-pre-wrap text-muted-foreground">
                      {revision.reason || '등록된 개정 사유가 없습니다.'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">변경 요약</p>
                    <p className="whitespace-pre-wrap text-muted-foreground">
                      {revision.summary || '등록된 변경 요약이 없습니다.'}
                    </p>
                  </div>
                  <details>
                    <summary className="cursor-pointer font-medium">전문 보기</summary>
                    <div className="
                      mt-3 whitespace-pre-wrap rounded-md border bg-muted/20 p-4
                      text-sm/6
                    "
                    >
                      {revision.content}
                    </div>
                  </details>
                </SectionCard.Content>
              </SectionCard>
            ))}
            {history.isSuccess && revisions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                게시된 개정 이력이 없습니다.
              </p>
            )}
            {history.isError && <Button type="button" variant="outline" onClick={() => void history.refetch()}>개정 이력 다시 불러오기</Button>}
            {history.hasNextPage && <Button type="button" variant="outline" disabled={history.isFetchingNextPage} onClick={() => void history.fetchNextPage()}>이전 버전 더 보기</Button>}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange?.(false)}>닫기</Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
