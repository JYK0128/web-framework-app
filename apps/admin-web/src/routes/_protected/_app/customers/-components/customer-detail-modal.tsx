import { Loader2, RefreshCw, UserRound } from 'lucide-react';

import { useCustomersControllerGetCustomerV1 } from '#/.generated/api/endpoints/customers/customers';
import { Button } from '#/.generated/shadcn/components/ui';
import { SectionCard } from '#/components/layout';
import { Modal, type ModalComponentProps } from '#/components/modal';

type CustomerDetailModalProps = ModalComponentProps<void> & {
  customerId: string
};

export function CustomerDetailModal({ customerId, open, onOpenChange, close }: CustomerDetailModalProps) {
  const detailQuery = useCustomersControllerGetCustomerV1(customerId, {
    query: { enabled: open },
  });
  const customer = detailQuery.data?.data;

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange?.(nextOpen);
        if (!nextOpen) close?.();
      }}
    >
      <Modal.Content size="xl" className="max-h-[90vh] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden">
        <Modal.Header>
          <Modal.Title className="flex items-center gap-2 text-lg">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserRound className="size-5" />
            </span>
            고객 상세 정보
          </Modal.Title>
          <Modal.Description>선택한 고객의 계정과 멤버십 정보를 확인합니다.</Modal.Description>
        </Modal.Header>

        <Modal.ScrollBody className="p-5">
          {detailQuery.isLoading && (
            <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              불러오는 중...
            </div>
          )}
          {detailQuery.isError && (
            <div className="grid justify-items-center gap-3 p-8 text-center text-sm text-destructive">
              <p>고객 정보를 불러오지 못했습니다.</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void detailQuery.refetch()}>
                <RefreshCw className="size-4" />
                다시 시도
              </Button>
            </div>
          )}
          {customer && (
            <div className="grid gap-4">
              <SectionCard textSize="sm" title={customer.name} description={customer.email}>
                <SectionCard.Content className="grid gap-2 text-sm">
                  <InfoRow label="고객 ID" value={customer.id} mono />
                  <InfoRow label="상태" value={customer.banned ? '이용 정지' : '정상'} />
                  <InfoRow label="이메일 인증" value={customer.emailVerified ? '인증됨' : '미인증'} />
                  <InfoRow label="가입일" value={formatDate(customer.createdAt)} />
                  <InfoRow label="수정일" value={formatDate(customer.updatedAt)} />
                </SectionCard.Content>
              </SectionCard>
              <SectionCard textSize="sm" title="멤버십" icon="shield-check">
                <SectionCard.Content className="grid gap-2 text-sm">
                  <InfoRow label="등급" value={customer.roleLabel ?? '미지정'} />
                  <InfoRow label="등급 코드" value={customer.roleCode ?? '미지정'} mono />
                </SectionCard.Content>
              </SectionCard>
            </div>
          )}
        </Modal.ScrollBody>

        <Modal.Footer>
          <Button type="button" variant="outline" onClick={() => close?.()}>확인</Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}

function InfoRow({ label, value, mono = false }: { label: string, value: string, mono?: boolean }) {
  return (
    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 border-b py-1.5 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? 'truncate font-mono text-xs' : 'wrap-break-word'}>{value}</span>
    </div>
  );
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('ko-KR');
}
