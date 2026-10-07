import { useInfiniteQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { getServiceTermsControllerGetAgreementHistoryV1QueryKey, serviceTermsControllerGetAgreementHistoryV1 } from '#/.generated/api/endpoints/service-terms/service-terms';
import type { ServiceAgreementHistoryItemDto, ServiceTermAgreementItem } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { Modal, type ModalComponentProps } from '#/components/modal';
import { receptionOptionLabel } from '#/components/terms/reception-options';

export function AgreementHistoryModal({ term, open, onOpenChange }: ModalComponentProps & { term: ServiceTermAgreementItem }) {
  const [selected, setSelected] = useState<ServiceAgreementHistoryItemDto | null>(null);
  const query = useInfiniteQuery({
    queryKey: getServiceTermsControllerGetAgreementHistoryV1QueryKey({ groupId: term.groupId, limit: 20 }),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) => serviceTermsControllerGetAgreementHistoryV1({ groupId: term.groupId, limit: 20, cursor: pageParam }, undefined, signal),
    getNextPageParam: (page) => page.hasNextPage ? page.endCursor ?? undefined : undefined,
    enabled: Boolean(open),
  });
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <Modal.Content size="lg">
        <Modal.Header>
          <Modal.Title>
            {term.title}
            {' '}
            동의 이력
          </Modal.Title>
          <Modal.Description>동의 여부와 수신 옵션의 변경 기록입니다.</Modal.Description>
        </Modal.Header>
        <Modal.Body className="
          scroll-y max-h-[min(600px,calc(100vh-12rem))] grid gap-3
        "
        >
          {selected
            ? (
              <div className="grid gap-3">
                <p>
                  v
                  {selected.version}
                  {' '}
                  ·
                  {selected.isAgreed ? '동의' : '미동의'}
                  {' '}
                  ·
                  {new Date(selected.createdAt).toLocaleString()}
                </p>
                {Object.entries(selected.metadata?.options ?? {}).map(([key, value]) => (
                  <p key={key}>
                    {receptionOptionLabel(key)}
                    :
                    {' '}
                    {value ? '수신 동의' : '수신 안 함'}
                  </p>
                ))}
                <div className="
                  whitespace-pre-wrap rounded-md border p-4 text-sm
                "
                >
                  {selected.content}
                </div>
                <Button variant="ghost" onClick={() => setSelected(null)}>목록으로</Button>
              </div>
            )
            : (
              <>
                {query.isPending && <p>이력을 불러오는 중입니다.</p>}
                {query.isError && <Button variant="outline" onClick={() => void query.refetch()}>다시 불러오기</Button>}
                {query.data?.pages.flatMap((page) => page.items).map((item) => (
                  <div
                    key={item.id}
                    className="
                      flex items-center justify-between gap-3 rounded-md border
                      p-3
                    "
                  >
                    <div>
                      <p className="text-sm">
                        v
                        {item.version}
                        {' '}
                        ·
                        {item.isAgreed ? '동의' : '미동의'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setSelected(item)}>내용 보기</Button>
                  </div>
                ))}
                {query.isSuccess && query.data.pages[0]?.items.length === 0 && <p>동의 이력이 없습니다.</p>}
                {query.hasNextPage && <Button variant="outline" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>더 보기</Button>}
              </>
            )}
        </Modal.Body>
        <Modal.Footer><Button variant="outline" onClick={() => onOpenChange?.(false)}>닫기</Button></Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
