import type { OperatingHolidayItemDto } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { Modal, type ModalComponentProps } from '#/components/modal';

type HolidayDetailModalProps = ModalComponentProps<boolean> & {
  holiday: OperatingHolidayItemDto & { dayOfWeek: string }
};

export function HolidayDetailModal({ holiday, open, onOpenChange, close }: HolidayDetailModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <Modal.Content size="md">
        <Modal.Header>
          <Modal.Title>휴무일 상세</Modal.Title>
          <Modal.Description>등록된 휴무일 정보를 확인합니다.</Modal.Description>
        </Modal.Header>
        <Modal.Body>
          <dl className="grid gap-4 rounded-lg border bg-muted/20 p-4 text-sm">
            <div className="grid gap-1">
              <dt className="text-muted-foreground">날짜</dt>
              <dd className="font-medium">
                {holiday.date}
              </dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-muted-foreground">휴무일 명칭</dt>
              <dd className="font-medium">
                {holiday.name}
              </dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-muted-foreground">요일</dt>
              <dd className="font-medium">
                {holiday.dayOfWeek}
              </dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-muted-foreground">구분</dt>
              <dd className="font-medium">
                {holiday.type === 'STATUTORY' ? '법정 공휴일' : '특별 지정'}
              </dd>
            </div>
          </dl>
        </Modal.Body>
        <Modal.Footer><Button type="button" variant="outline" onClick={() => close?.(false)}>닫기</Button></Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
