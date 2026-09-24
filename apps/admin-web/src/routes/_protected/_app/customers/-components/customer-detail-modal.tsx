import { useQueryClient } from '@tanstack/react-query';
import { Loader2, RefreshCw, UserRound } from 'lucide-react';

import { getCustomersControllerGetCustomerV1QueryKey, getCustomersControllerListCustomersV1QueryKey, useCustomersControllerBanCustomerV1, useCustomersControllerDeleteCustomerV1, useCustomersControllerGetCustomerV1, useCustomersControllerUnbanCustomerV1 } from '#/.generated/api/endpoints/customers/customers';
import type { AdminCustomerItem } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';
import { Action } from '#/components/auth/action';
import { SectionCard } from '#/components/layout';
import { Modal, type ModalComponentProps, openModal } from '#/components/modal';

import { CustomerRoleModal } from './customer-role-modal';

type CustomerDetailModalProps = ModalComponentProps<void> & {
  customerId: string
  canUpdate: boolean
  canDelete: boolean
  onChanged?: () => void
};

export function CustomerDetailModal({ customerId, canUpdate, canDelete, open, onOpenChange, close, onChanged }: CustomerDetailModalProps) {
  const queryClient = useQueryClient();
  const detailQuery = useCustomersControllerGetCustomerV1(customerId, {
    query: { enabled: open },
  });
  const customer = detailQuery.data?.data;
  const banMutation = useCustomersControllerBanCustomerV1();
  const unbanMutation = useCustomersControllerUnbanCustomerV1();
  const deleteMutation = useCustomersControllerDeleteCustomerV1();
  const isPending = banMutation.isPending || unbanMutation.isPending || deleteMutation.isPending;

  const refreshCustomer = async () => {
    await Promise.all([
      detailQuery.refetch(),
      queryClient.invalidateQueries({ queryKey: getCustomersControllerGetCustomerV1QueryKey(customerId) }),
      queryClient.invalidateQueries({ queryKey: getCustomersControllerListCustomersV1QueryKey() }),
    ]);
    onChanged?.();
  };

  const toggleBan = () => {
    if (!customer) return;
    const isBanned = customer.banned;
    void confirm({
      title: isBanned ? '고객 정지 해제' : '고객 이용 정지',
      content: `${customer.name} 고객의 이용을 ${isBanned ? '다시 허용' : '정지'}하시겠습니까?`,
      description: isBanned ? '정지 상태가 해제됩니다.' : '고객은 더 이상 로그인할 수 없습니다.',
      confirmLabel: isBanned ? '정지 해제' : '정지',
      tone: isBanned ? 'default' : 'danger',
    }).then(async (confirmed) => {
      if (!confirmed) return;
      if (isBanned) await unbanMutation.mutateAsync({ id: customer.id });
      else await banMutation.mutateAsync({ id: customer.id, data: {} });
      await refreshCustomer();
    });
  };

  const deleteCustomer = () => {
    if (!customer) return;
    void confirm({
      title: '고객 삭제',
      content: `${customer.name} 고객 계정을 삭제하시겠습니까?`,
      description: '삭제된 계정은 서비스 고객 목록에서 제외됩니다.',
      confirmLabel: '삭제',
      tone: 'danger',
    }).then(async (confirmed) => {
      if (!confirmed) return;
      await deleteMutation.mutateAsync({ id: customer.id });
      onChanged?.();
      close?.();
    });
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
          max-h-[90vh] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden
        "
      >
        <Modal.Header>
          <Modal.Title className="flex items-center gap-2 text-lg">
            <span className="
              flex size-10 items-center justify-center rounded-lg bg-primary/10
              text-primary
            "
            >
              <UserRound className="size-5" />
            </span>
            고객 상세 정보
          </Modal.Title>
          <Modal.Description>선택한 고객의 계정과 멤버십 정보를 확인합니다.</Modal.Description>
        </Modal.Header>

        <Modal.Body className="scroll-y p-5">
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
              {(canUpdate || canDelete) && (
                <SectionCard textSize="sm" title="관리 작업" description="서비스 API의 internal 경로를 통해 적용됩니다.">
                  <SectionCard.Content className="flex flex-wrap gap-2">
                    {canUpdate && (
                      <>
                        <Button type="button" variant="outline" disabled={isPending} onClick={toggleBan}>
                          {customer.banned ? '정지 해제' : '이용 정지'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => void openCustomerRoleModal(customer, onChanged)}
                        >
                          멤버십 변경
                        </Button>
                      </>
                    )}
                    <Action
                      permission="customer:delete"
                      render={<Button type="button" variant="destructive" disabled={isPending} onClick={deleteCustomer}>고객 삭제</Button>}
                    />
                  </SectionCard.Content>
                </SectionCard>
              )}
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button type="button" variant="outline" onClick={() => close?.()}>확인</Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}

async function openCustomerRoleModal(customer: AdminCustomerItem, onChanged?: () => void): Promise<void> {
  await openModal(CustomerRoleModal, { customer, onChanged });
}

function InfoRow({ label, value, mono = false }: { label: string, value: string, mono?: boolean }) {
  return (
    <div className="
      grid grid-cols-[8rem_minmax(0,1fr)] gap-3 border-b py-1.5
      last:border-b-0
    "
    >
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? 'truncate font-mono text-xs' : 'wrap-break-word'}>{value}</span>
    </div>
  );
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('ko-KR');
}
