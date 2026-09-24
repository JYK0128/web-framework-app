import { Loader2, RefreshCw, UserRound } from 'lucide-react';

import { useOperatorsControllerGetOperatorByIdV1 } from '#/.generated/api/endpoints/operators/operators';
import { Button } from '#/.generated/shadcn/components/ui';
import { SectionCard } from '#/components/layout';
import { Modal, type ModalComponentProps } from '#/components/modal';

type OperatorDetailModalProps = ModalComponentProps<void> & {
  operatorId: string
};

export function OperatorDetailModal({ operatorId, open, onOpenChange, close }: OperatorDetailModalProps) {
  const detailQuery = useOperatorsControllerGetOperatorByIdV1(operatorId, {
    query: {
      enabled: open,
    },
  });
  const operator = detailQuery.data?.data;

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
            운영자 상세 정보
          </Modal.Title>
          <Modal.Description>선택한 운영자 계정의 보안 및 계정 정보입니다.</Modal.Description>
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
              <p>운영자 정보를 불러오지 못했습니다.</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void detailQuery.refetch()}>
                <RefreshCw className="size-4" />
                {' '}
                다시 시도
              </Button>
            </div>
          )}
          {operator && (
            <div className="grid gap-4">
              <SectionCard textSize="sm" title={operator.name} description={operator.email}>
                <SectionCard.Content className="grid gap-2 text-sm">
                  <InfoRow label="운영자 ID" value={operator.id} mono />
                  <InfoRow label="역할" value={operator.roleLabel} />
                  <InfoRow label="역할 코드" value={operator.roleCode} mono />
                  <InfoRow label="상태" value={getStatusLabel(operator.deleted, operator.banned)} />
                  <InfoRow label="2FA" value={operator.twoFactorEnabled ? '사용 중' : '미사용'} />
                  <InfoRow label="로그인 제공자" value={operator.providers.join(', ') || '없음'} />
                  <InfoRow label="가입일" value={formatDate(operator.createdAt)} />
                  <InfoRow label="최근 로그인" value={operator.lastLoginAt ? formatDate(operator.lastLoginAt) : '기록 없음'} />
                  <InfoRow label="비밀번호 변경일" value={operator.passwordUpdatedAt ? formatDate(operator.passwordUpdatedAt) : '기록 없음'} />
                </SectionCard.Content>
              </SectionCard>

              <SectionCard textSize="sm" title="권한 및 보안" icon="shield-check">
                <SectionCard.Content className="grid gap-2 text-sm">
                  <InfoRow label="비밀번호 상태" value={operator.hasPassword ? '설정됨' : '미설정'} />
                  <InfoRow label="정지 사유" value={typeof operator.banReason === 'string' ? operator.banReason : '없음'} />
                  <InfoRow label="정지 만료일" value={operator.banExpires ? formatDate(operator.banExpires) : '없음'} />
                </SectionCard.Content>
              </SectionCard>

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

function getStatusLabel(deleted: boolean, banned: boolean): string {
  if (deleted) return '삭제됨';
  if (banned) return '정지됨';
  return '활성';
}
