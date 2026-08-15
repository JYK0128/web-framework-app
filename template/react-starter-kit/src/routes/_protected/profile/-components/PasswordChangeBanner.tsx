import { useI18n } from '@pkg/shared/web';
import { format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { useAuthControllerDeferPasswordChange } from '#/.generated/api/endpoints/auth/auth';
import type { UserProfileResponse } from '#/.generated/api/model';
import { Alert, AlertDescription, AlertTitle, Button } from '#/.generated/shadcn/components/ui';

type PasswordChangeBannerProps = {
  user: UserProfileResponse
  onChangeClick: () => void
  onDeferred?: () => void
};

export function PasswordChangeBanner({ user, onChangeClick, onDeferred }: PasswordChangeBannerProps) {
  const { mutateAsync: deferPassword } = useAuthControllerDeferPasswordChange();
  const { t } = useI18n();

  const isPasswordChangeRequired = user.isPasswordChangeRequired;
  const passwordUpdatedAt = user.passwordUpdatedAt ? new Date(user.passwordUpdatedAt) : null;

  const handleDeferPasswordChange = async () => {
    try {
      await deferPassword();
      onDeferred?.();
      toast.info(t('profile.passwordDeferredToast'));
    }
    catch {
      return;
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
          <AlertTitle className="font-bold">{t('profile.passwordBannerTitle')}</AlertTitle>
          <AlertDescription className="text-xs">
            {t('profile.passwordBannerDescription')}
            {' '}
            {passwordUpdatedAt || user.createdAt ? format(passwordUpdatedAt ?? new Date(user.createdAt), 'yyyy.MM.dd') : t('profile.noInfo')}
          </AlertDescription>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="sm" onClick={() => void handleDeferPasswordChange()}>
          {t('profile.deferPasswordChange')}
        </Button>
        <Button size="sm" onClick={onChangeClick}>
          {t('profile.changeNow')}
        </Button>
      </div>
    </Alert>
  );
}
