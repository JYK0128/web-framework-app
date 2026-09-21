import { Loader2, RefreshCw, UserRound } from 'lucide-react';

import { useUsersControllerGetUserByIdV1 } from '#/.generated/api/endpoints/users/users';
import { Button } from '#/.generated/shadcn/components/ui';
import { SectionCard } from '#/components/layout';
import { Modal, type ModalComponentProps } from '#/components/modal';

type AdminDetailModalProps = ModalComponentProps<void> & {
  userId: string
};

export function AdminDetailModal({ userId, open, onOpenChange, close }: AdminDetailModalProps) {
  const detailQuery = useUsersControllerGetUserByIdV1(userId, {
    query: {
      enabled: open,
    },
  });
  const user = detailQuery.data?.data;

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
            관리자 상세 정보
          </Modal.Title>
          <Modal.Description>선택한 관리자 계정의 보안 및 계정 정보입니다.</Modal.Description>
        </Modal.Header>

        <Modal.ScrollBody className="p-5">
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
              <p>관리자 정보를 불러오지 못했습니다.</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void detailQuery.refetch()}>
                <RefreshCw className="size-4" />
                {' '}
                다시 시도
              </Button>
            </div>
          )}
          {user && (
            <div className="grid gap-4">
              <SectionCard textSize="sm" title={user.name} description={user.email}>
                <SectionCard.Content className="grid gap-2 text-sm">
                  <InfoRow label="관리자 ID" value={user.id} mono />
                  <InfoRow label="역할" value={user.roleLabel} />
                  <InfoRow label="역할 코드" value={user.roleCode} mono />
                  <InfoRow label="상태" value={getStatusLabel(user.deleted, user.banned)} />
                  <InfoRow label="2FA" value={user.twoFactorEnabled ? '사용 중' : '미사용'} />
                  <InfoRow label="로그인 제공자" value={user.providers.join(', ') || '없음'} />
                  <InfoRow label="가입일" value={formatDate(user.createdAt)} />
                  <InfoRow label="최근 로그인" value={user.lastLoginAt ? formatDate(user.lastLoginAt) : '기록 없음'} />
                  <InfoRow label="비밀번호 변경일" value={user.passwordUpdatedAt ? formatDate(user.passwordUpdatedAt) : '기록 없음'} />
                </SectionCard.Content>
              </SectionCard>

              <SectionCard textSize="sm" title="권한 및 보안" icon="shield-check">
                <SectionCard.Content className="grid gap-2 text-sm">
                  <InfoRow label="비밀번호 상태" value={user.hasPassword ? '설정됨' : '미설정'} />
                  <InfoRow label="정지 사유" value={typeof user.banReason === 'string' ? user.banReason : '없음'} />
                  <InfoRow label="정지 만료일" value={user.banExpires ? formatDate(user.banExpires) : '없음'} />
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
