import { Loader2, RefreshCw } from 'lucide-react';
import { useState } from 'react';

import { useCustomersControllerGetCustomerPiiV1, useCustomersControllerGetCustomerV1 } from '#/.generated/api/endpoints/customers/customers';
import { Button } from '#/.generated/shadcn/components/ui';
import { Action } from '#/components/auth/action';
import { Modal, type ModalComponentProps } from '#/components/modal';

type CustomerDetailModalProps = ModalComponentProps<void> & { customerId: string, canReadPii: boolean };

export function CustomerDetailModal({ customerId, canReadPii, open, onOpenChange, close }: CustomerDetailModalProps) {
  const detailQuery = useCustomersControllerGetCustomerV1(customerId, { query: { enabled: open } });
  const piiQuery = useCustomersControllerGetCustomerPiiV1(customerId, { query: { enabled: false } });
  const [showPii, setShowPii] = useState(false);
  const customer = detailQuery.data?.data;
  const revealedCustomer = piiQuery.data?.data;
  const visibleCustomer = showPii && revealedCustomer ? revealedCustomer : customer;
  let revealLabel = showPii ? '개인정보 숨기기' : '개인정보 보기';
  if (piiQuery.isFetching) revealLabel = '조회 중...';

  const handleRevealPii = async () => {
    if (showPii) {
      setShowPii(false);
      return;
    }
    const result = await piiQuery.refetch();
    if (result.data) setShowPii(true);
  };

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange?.(nextOpen);
        if (!nextOpen) close?.();
      }}
    >
      <Modal.Content
        size="xl"
        className="
          max-h-[calc(100vh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto]
          sm:max-w-3xl
        "
      >
        <Modal.Header>
          <div className="flex items-center justify-between gap-3 pr-8">
            <Modal.Title>고객 상세 정보</Modal.Title>
            <Action
              permission="customer:read_pii"
              render={(
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canReadPii || piiQuery.isFetching}
                  onClick={() => void handleRevealPii()}
                >
                  {revealLabel}
                </Button>
              )}
            />
          </div>
          <Modal.Description>선택한 고객의 계정과 멤버십 정보를 확인합니다.</Modal.Description>
        </Modal.Header>
        <Modal.Body className="scroll-y">
          {detailQuery.isLoading && (
            <div className="
              flex items-center justify-center gap-2 p-8 text-sm
              text-muted-foreground
            "
            >
              <Loader2 className="size-4 animate-spin" />
              불러오는 중...
            </div>
          )}
          {detailQuery.isError && (
            <div className="
              grid justify-items-center gap-3 p-8 text-center text-sm
              text-destructive
            "
            >
              <p>고객 정보를 불러오지 못했습니다.</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void detailQuery.refetch()}>
                <RefreshCw className="size-4" />
                다시 시도
              </Button>
            </div>
          )}
          {visibleCustomer && (
            <div className="grid gap-5 py-2 pr-1">
              <section className="grid gap-4 rounded-lg border bg-muted/20 p-4">
                <div className="grid gap-1 border-b pb-3">
                  <h3 className="text-sm font-semibold">{visibleCustomer.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {visibleCustomer.email}
                  </p>
                </div>
                <div className="grid gap-2 text-sm">
                  <InfoRow label="고객 ID" value={visibleCustomer.id} mono />
                  <InfoRow label="상태" value={visibleCustomer.banned ? '이용 정지' : '정상'} />
                  <InfoRow label="이메일 인증" value={visibleCustomer.emailVerified ? '인증됨' : '미인증'} />
                  <InfoRow label="가입일" value={formatDate(visibleCustomer.createdAt)} />
                  <InfoRow label="수정일" value={formatDate(visibleCustomer.updatedAt)} />
                </div>
              </section>
              <section className="grid gap-4 rounded-lg border bg-muted/20 p-4">
                <h3 className="text-sm font-semibold">멤버십</h3>
                <div className="grid gap-2 text-sm">
                  <InfoRow label="등급" value={visibleCustomer.roleLabel ?? '미지정'} />
                  <InfoRow label="등급 코드" value={visibleCustomer.roleCode ?? '미지정'} mono />
                </div>
              </section>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer><Button type="button" variant="outline" onClick={() => close?.()}>닫기</Button></Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}

function InfoRow({ label, value, mono = false }: { label: string, value: string, mono?: boolean }) {
  return (
    <div className="
      grid grid-cols-[8rem_minmax(0,1fr)] gap-3 border-b py-1.5
      last:border-b-0
    "
    >
      <span className="text-muted-foreground">{label}</span>
      <span className={mono
        ? `truncate font-mono text-xs`
        : `wrap-break-word`}
      >
        {value}
      </span>
    </div>
  );
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('ko-KR');
}
