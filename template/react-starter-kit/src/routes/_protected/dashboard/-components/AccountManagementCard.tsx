import { UserX } from 'lucide-react';
import { useState } from 'react';

import { Button, Card, CardContent } from '#/.generated/shadcn/components/ui';

import { UnregisterConfirmModal } from './modals/UnregisterConfirmModal';

type AccountManagementCardProps = {
  user: {
    id: string
    name?: string | null
    email: string
  }
};

export function AccountManagementCard({ user }: AccountManagementCardProps) {
  const [showUnregisterModal, setShowUnregisterModal] = useState(false);

  return (
    <>
      <div className="grid gap-6">
        <Card className="p-6">
          <CardContent className="grid gap-4 p-0">
            <h3 className="text-base font-bold">계정 상세 정보</h3>

            <div className="grid gap-3 text-xs">
              <div className="flex items-center justify-between border-b py-2">
                <span className="flex-1 text-muted-foreground">이름</span>
                <span className="shrink-0 font-bold">{user.name || '-'}</span>
              </div>
              <div className="flex items-center justify-between border-b py-2">
                <span className="flex-1 text-muted-foreground">이메일 계정</span>
                <span className="shrink-0 font-bold">{user.email}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="flex-1 text-muted-foreground">고유 사용자 ID</span>
                <span className="shrink-0 font-mono font-bold">{user.id}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/30 bg-destructive/5 p-6">
          <CardContent className="grid gap-4 p-0">
            <div className="grid gap-1">
              <h3 className="text-base font-bold text-destructive">위험 구역 (Danger Zone)</h3>
              <p className="text-xs text-muted-foreground">
                회원 탈퇴 시 모든 데이터와 세션이 영구 삭제되며 복구할 수 없습니다.
              </p>
            </div>

            <div className="flex items-center justify-end">
              <Button variant="destructive" size="sm" className="shrink-0" onClick={() => setShowUnregisterModal(true)}>
                <UserX className="size-4" />
                <span>회원 탈퇴</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <UnregisterConfirmModal
        open={showUnregisterModal}
        onOpenChange={setShowUnregisterModal}
      />
    </>
  );
}
