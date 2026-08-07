import { format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle, Button } from '#/.generated/shadcn/components/ui';
import { useAuth } from '#/core/auth/useAuth';

type PasswordChangeBannerProps = {
  onChangeClick: () => void
};

export function PasswordChangeBanner({ onChangeClick }: PasswordChangeBannerProps) {
  const { user, deferPassword } = useAuth();

  const isPasswordChangeRequired = user?.isPasswordChangeRequired ?? false;

  const passwordUpdatedAt = useMemo(() => {
    const val = user?.passwordUpdatedAt;
    if (!val) return null;
    return new Date(val);
  }, [user]);

  const handleDeferPasswordChange = async () => {
    try {
      await deferPassword();
      toast.info('비밀번호 변경 알림이 30일 동안 연기되었습니다.');
    }
    catch {
      toast.error('비밀번호 변경 연기에 실패했습니다.');
    }
  };

  if (!isPasswordChangeRequired) return null;

  return (
    <Alert className="
      mb-6 flex flex-col gap-4
      sm:flex-row sm:items-center sm:justify-between
    "
    >
      <div className="flex flex-1 items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-500" />
        <div className="grid gap-0.5">
          <AlertTitle className="font-bold">비밀번호 변경 주기 알림 (90일 경과)</AlertTitle>
          <AlertDescription className="text-xs">
            소중한 계정 보안을 위해 주기적인 비밀번호 변경을 권장합니다. 마지막 변경일:
            {' '}
            {passwordUpdatedAt || user?.createdAt ? format(passwordUpdatedAt ?? new Date(user!.createdAt), 'yyyy.MM.dd') : '정보 없음'}
          </AlertDescription>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="sm" onClick={() => void handleDeferPasswordChange()}>
          30일 후 변경
        </Button>
        <Button size="sm" onClick={onChangeClick}>
          지금 변경하기
        </Button>
      </div>
    </Alert>
  );
}
