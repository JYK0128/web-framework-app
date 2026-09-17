import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';

import { getAuthControllerMeQueryKey, useAuthControllerDeferPasswordChange } from '#/.generated/api/endpoints/auth/auth';
import type { AuthPrincipalResponse } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { openModal } from '#/components/modal';
import { ActionCard } from '#/components/layout';
import { useI18n } from '#/hooks';
import { PasswordChangeDialog } from '#/routes/_protected/_app/profile/-components/password-change-dialog';

type PasswordChangeReminderCardProps = {
  user: AuthPrincipalResponse
};

export function PasswordChangeReminderCard({
  user,
}: PasswordChangeReminderCardProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const router = useRouter();
  const deferPasswordMutation = useAuthControllerDeferPasswordChange();

  if (!user.isPasswordChangeRequired) {
    return null;
  }

  const handleSuccess = async () => {
    queryClient.setQueryData<AuthPrincipalResponse>(
      getAuthControllerMeQueryKey(),
      (prev) => (prev ? { ...prev, isPasswordChangeRequired: false } : prev),
    );
    await router.invalidate();
  };

  const handleDefer = async () => {
    try {
      await deferPasswordMutation.mutateAsync({ data: {} });
      await handleSuccess();
    }
    catch {
      // Handled globally.
    }
  };

  const handlePasswordChange = () => {
    void openModal(PasswordChangeDialog, { user }, { modalId: 'password-change-dashboard' }).then((changed) => {
      if (changed) {
        void handleSuccess();
      }
    });
  };

  return (
    <ActionCard
      icon="key-round"
      iconColor="text-amber-600"
      title={t('dashboard.passwordChangeReminder')}
      description={t('dashboard.passwordChangeDescription')}
    >
      <ActionCard.Actions>
        <Button
          variant="ghost"
          onClick={() => void handleDefer()}
          disabled={deferPasswordMutation.isPending}
        >
          {t('dashboard.changeLater')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7.5 gap-1 text-xs shrink-0 cursor-pointer"
          onClick={handlePasswordChange}
        >
          {t('profile.changePassword')}
        </Button>
      </ActionCard.Actions>
    </ActionCard>
  );
}
