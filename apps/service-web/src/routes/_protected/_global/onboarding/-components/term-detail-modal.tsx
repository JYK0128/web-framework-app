import { useServiceTermsControllerGetTermV1 } from '#/.generated/api/endpoints/service-terms/service-terms';
import type { ServiceTermAgreementItem } from '#/.generated/api/model';
import { Button, Skeleton } from '#/.generated/shadcn/components/ui';
import { Modal, type ModalComponentProps, openModal } from '#/components/modal';
import { TermRevisionHistoryModal } from '#/routes/_protected/_app/profile/-components/term-revision-history-modal';

type TermDetailModalProps = ModalComponentProps & {
  term: ServiceTermAgreementItem
};

export function OnboardingTermDetailModal({ term, open, onOpenChange }: TermDetailModalProps) {
  const detail = useServiceTermsControllerGetTermV1(term.termId, { query: { enabled: open } });
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
          {detail.isPending && <Skeleton className="h-24 w-full" />}
          {detail.isError && <Button type="button" variant="outline" onClick={() => void detail.refetch()}>약관 다시 불러오기</Button>}
          {detail.data?.content}
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="ghost" size="sm" onClick={() => void openModal(TermRevisionHistoryModal, { term })}>개정 이력</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange?.(false)}>닫기</Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
