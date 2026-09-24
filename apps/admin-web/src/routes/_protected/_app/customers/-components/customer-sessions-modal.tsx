import { useQueryClient } from '@tanstack/react-query';
import { LogOut, Monitor } from 'lucide-react';

import { getCustomersControllerListCustomerSessionsV1QueryKey, useCustomersControllerListCustomerSessionsV1, useCustomersControllerRevokeCustomerSessionsV1, useCustomersControllerRevokeCustomerSessionV1 } from '#/.generated/api/endpoints/customers/customers';
import { Button } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';
import { Modal, type ModalComponentProps } from '#/components/modal';

type CustomerSessionsModalProps = ModalComponentProps<void> & { customerId: string, customerName: string, canUpdate: boolean };

export function CustomerSessionsModal({ customerId, customerName, canUpdate, open, onOpenChange, close }: CustomerSessionsModalProps) {
  const queryClient = useQueryClient();
  const sessionsQuery = useCustomersControllerListCustomerSessionsV1(customerId, { query: { enabled: open } });
  const revokeSessionMutation = useCustomersControllerRevokeCustomerSessionV1();
  const revokeSessionsMutation = useCustomersControllerRevokeCustomerSessionsV1();
  const isPending = revokeSessionMutation.isPending || revokeSessionsMutation.isPending;
  const sessions = sessionsQuery.data?.data.items ?? [];
  const revokeSession = (familyId?: string) => {
    const all = !familyId;
    void confirm({ title: all ? '전체 세션 해제' : '세션 해제', content: all ? `${customerName} 고객의 모든 로그인 세션을 해제하시겠습니까?` : '선택한 로그인 세션을 해제하시겠습니까?', description: '해제된 세션은 refresh token을 갱신할 수 없습니다.', confirmLabel: '해제', tone: 'danger' }).then(async (confirmed) => {
      if (!confirmed) return;
      if (all) await revokeSessionsMutation.mutateAsync({ id: customerId });
      else await revokeSessionMutation.mutateAsync({ id: customerId, familyId });
      await queryClient.invalidateQueries({ queryKey: getCustomersControllerListCustomerSessionsV1QueryKey(customerId) });
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
      <Modal.Content size="lg">
        <Modal.Header>
          <Modal.Title>로그인 세션</Modal.Title>
          <Modal.Description>현재 활성화된 refresh token 기준 세션입니다.</Modal.Description>
        </Modal.Header>
        <Modal.Body className="scroll-y max-h-[min(32rem,calc(100vh-14rem))]">
          <div className="grid gap-3 py-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{sessionsQuery.isLoading ? '불러오는 중...' : `${sessions.length}개 활성 세션`}</span>
              {canUpdate && sessions.length > 0 && (
                <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => revokeSession()}>
                  <LogOut className="size-4" />
                  전체 해제
                </Button>
              )}
            </div>
            {sessions.map((session) => (
              <div
                key={session.familyId}
                className="
                  flex items-center justify-between gap-3 rounded-lg border p-3
                  text-sm
                "
              >
                <div className="flex items-center gap-2">
                  <Monitor className="size-4 shrink-0 text-muted-foreground" />
                  <div className="grid gap-1">
                    <span>로그인 세션</span>
                    <span className="text-xs text-muted-foreground">
                      {session.rememberMe ? '로그인 유지' : '일반 로그인'}
                      {' '}
                      · 만료
                      {formatDate(session.expiresAt)}
                    </span>
                  </div>
                </div>
                {canUpdate && <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={() => revokeSession(session.familyId)}>해제</Button>}
              </div>
            ))}
            {!sessionsQuery.isLoading && sessions.length === 0 && (
              <p className="
                rounded-lg border border-dashed p-6 text-center text-sm
                text-muted-foreground
              "
              >
                활성 세션이 없습니다.
              </p>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer><Button type="button" variant="outline" onClick={() => close?.()}>닫기</Button></Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('ko-KR');
}
