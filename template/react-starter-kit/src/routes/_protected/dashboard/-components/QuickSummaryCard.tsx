import { format } from 'date-fns';
import { Key } from 'lucide-react';
import { useMemo } from 'react';

import type { TermAgreementItemDto } from '#/.generated/api/model';
import { Button, Card, CardContent } from '#/.generated/shadcn/components/ui';
import { useAuth } from '#/core/auth/useAuth';

type QuickSummaryCardProps = {
  onOpenPasswordChangeModal: () => void
  agreements?: TermAgreementItemDto[]
};

export function QuickSummaryCard({ onOpenPasswordChangeModal, agreements = [] }: QuickSummaryCardProps) {
  const { user } = useAuth();

  const passwordUpdatedAt = useMemo(() => {
    const val = user?.passwordUpdatedAt;
    if (!val) return null;
    return new Date(val);
  }, [user]);

  const totalAgreements = agreements.length;
  const agreedCount = agreements.filter((a) => a.isAgreed).length;
  const isTwoFactorEnabled = Boolean(user?.twoFactorEnabled);

  return (
    <Card className="p-6">
      <CardContent className="grid gap-4 p-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold flex-1">계정 상태 요약</h3>
          <Button
            variant="link"
            size="xs"
            onClick={onOpenPasswordChangeModal}
            className="h-auto p-0 shrink-0"
          >
            <Key className="size-3.5" />
            <span>비밀번호 변경</span>
          </Button>
        </div>

        <div className="
          grid grid-cols-1 gap-4
          sm:grid-cols-3
        "
        >
          <div className="grid gap-1 rounded-xl border bg-muted/50 p-4">
            <div className="text-2xs text-muted-foreground">마지막 비밀번호 변경</div>
            <div className="text-sm font-bold">
              {passwordUpdatedAt || user?.createdAt ? format(passwordUpdatedAt ?? new Date(user!.createdAt), 'yyyy.MM.dd') : '정보 없음'}
            </div>
          </div>

          <div className="grid gap-1 rounded-xl border bg-muted/50 p-4">
            <div className="text-2xs text-muted-foreground">약관 동의 완료</div>
            <div className="text-sm font-bold">
              {agreedCount}
              개 항목 / 총
              {totalAgreements}
              개
            </div>
          </div>

          <div className="grid gap-1 rounded-xl border bg-muted/50 p-4">
            <div className="text-2xs text-muted-foreground">보안 강화 권장</div>
            <div className="text-sm font-bold">
              {isTwoFactorEnabled ? '최고 수준 완료' : '2FA 설정 필요'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
