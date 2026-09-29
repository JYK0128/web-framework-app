import type { ServiceTermItemDto } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { Modal, type ModalComponentProps } from '#/components/modal';

export function ServiceTermViewModal({ term, open, onOpenChange }: ModalComponentProps & { term: ServiceTermItemDto }) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <Modal.Content
        size="xl"
        className="
          max-h-[calc(100vh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto]
          sm:max-w-3xl
        "
      >
        <Modal.Header>
          <Modal.Title>약관 상세</Modal.Title>
          <Modal.Description>약관 제목과 내용을 확인합니다.</Modal.Description>
        </Modal.Header>
        <Modal.Body className="scroll-y">
          <div className="grid gap-4 py-2">
            <section className="grid gap-4 rounded-lg border bg-muted/20 p-4">
              <div className="grid gap-2 border-b pb-4">
                <span className="text-xs font-medium text-muted-foreground">약관 제목</span>
                <h3 className="
                  text-base font-semibold wrap-break-word text-foreground
                "
                >
                  {term.title}
                </h3>
                <div className="
                  flex flex-wrap items-center gap-2 text-xs
                  text-muted-foreground
                "
                >
                  <span>
                    v
                    {term.version}
                  </span>
                  <span>·</span>
                  <span>{term.isPublished ? '게시됨' : '초안'}</span>
                  <span>·</span>
                  <span>{term.isRequired ? '필수 동의' : '선택 동의'}</span>
                </div>
              </div>
              <div className="grid gap-2 border-b pb-4">
                <h4 className="text-xs font-medium text-muted-foreground">게시일</h4>
                <p className="text-sm">{term.publishedAt ? new Date(term.publishedAt).toLocaleString('ko-KR') : '미정'}</p>
                <h4 className="text-xs font-medium text-muted-foreground">고지 여부</h4>
                <p className="text-sm">{term.isNoticeRequired ? '고지' : '고지 안 함'}</p>
                <h4 className="text-xs font-medium text-muted-foreground">사유</h4>
                <p className="text-sm wrap-break-word">{term.reason || '—'}</p>
                <h4 className="text-xs font-medium text-muted-foreground">요약</h4>
                <p className="text-sm whitespace-pre-wrap wrap-break-word">{term.summary || '—'}</p>
              </div>
              <div className="grid gap-2">
                <h4 className="text-xs font-medium text-muted-foreground">약관 내용</h4>
                <p className="
                  text-sm/6 whitespace-pre-wrap wrap-break-word text-foreground
                "
                >
                  {term.content}
                </p>
              </div>
            </section>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>닫기</Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
