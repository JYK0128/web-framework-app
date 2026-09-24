import { useEffect } from 'react';

import { useQnaControllerGetV1 } from '#/.generated/api/endpoints/qna/qna';
import type { QnaItem } from '#/.generated/api/model';
import { Button, Skeleton } from '#/.generated/shadcn/components/ui';
import { Modal, type ModalComponentProps } from '#/components/modal';

export type QnaDetailModalProps = ModalComponentProps & { item: QnaItem };

function answerText(answer: QnaItem['answer']): string {
  if (typeof answer === 'string') return answer;
  if (answer && typeof answer === 'object') return JSON.stringify(answer);
  return '';
}

export function QnaDetailModal({ item, open, onOpenChange, close }: QnaDetailModalProps) {
  const query = useQnaControllerGetV1(item.id);
  const detail = query.data?.data;
  const answer = answerText(detail?.answer);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close?.();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [close, open]);

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <Modal.Content className="
        max-h-[calc(100vh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto]
      "
      >
        <Modal.Header>
          <Modal.Title>문의 내역</Modal.Title>
          <Modal.Description>등록한 문의와 답변을 확인합니다.</Modal.Description>
        </Modal.Header>
        <Modal.Body className="scroll-y">
          {query.isLoading && <Skeleton className="h-40 w-full" />}
          {query.isError && <p className="text-sm text-destructive">문의 내용을 불러오지 못했습니다.</p>}
          {detail && (
            <div className="grid gap-4 py-2 pr-1">
              <section className="grid gap-3 rounded-lg border bg-muted/20 p-4">
                <div className="
                  flex flex-wrap items-center justify-between gap-2 border-b
                  pb-3
                "
                >
                  <h3 className="text-sm font-semibold">내 문의</h3>
                  <span className="text-xs text-muted-foreground">{detail.category}</span>
                </div>
                <h4 className="text-base font-semibold wrap-break-word">{detail.title}</h4>
                <p className="text-sm/6 whitespace-pre-wrap wrap-break-word">{detail.content}</p>
              </section>
              <section className="grid gap-3 rounded-lg border p-4">
                <h3 className="text-sm font-semibold">답변</h3>
                {answer.trim()
                  ? <p className="text-sm/6 whitespace-pre-wrap wrap-break-word">{answer}</p>
                  : <p className="text-sm text-muted-foreground">아직 등록된 답변이 없습니다.</p>}
              </section>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="outline" onClick={() => close?.()}>닫기</Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
