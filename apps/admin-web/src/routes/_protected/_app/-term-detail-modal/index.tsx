import type { TermAgreementItemDto } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { Modal, type ModalComponentProps } from '#/components/modal';

type TermDetailModalProps = ModalComponentProps & {
  term: TermAgreementItemDto
};

export function TermDetailModal({ term, open, onOpenChange }: TermDetailModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <Modal.Content size="lg">
        <Modal.Header>
          <Modal.Title>{term.title}</Modal.Title>
          <Modal.Description>{`v${term.version}`}</Modal.Description>
        </Modal.Header>
        <Modal.Body className="
          scroll-y max-h-[min(600px,calc(100vh-12rem))] whitespace-pre-wrap p-1
          text-sm/6
        "
        >
          {term.content}
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange?.(false)}>닫기</Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
