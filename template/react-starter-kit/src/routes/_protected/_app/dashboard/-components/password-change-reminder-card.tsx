import { useI18n } from '@pkg/shared/web';

import { useAuthControllerDeferPasswordChange } from '#/.generated/api/endpoints/auth/auth';
import type { AuthPrincipalResponse } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { ActionCard } from '#/components/app/action-card';
import { PasswordChangeDialog } from '#/routes/_protected/_app/profile/-components/password-change-dialog';

type PasswordChangeReminderCardProps = {
  user: AuthPrincipalResponse
  onDeferred: () => void
  onPasswordChanged: () => void
};

export function PasswordChangeReminderCard({
  user,
  onDeferred,
  onPasswordChanged,
}: PasswordChangeReminderCardProps) {
  const { t } = useI18n();
  const deferPasswordMutation = useAuthControllerDeferPasswordChange();

  const handleDefer = async () => {
    try {
      await deferPasswordMutation.mutateAsync();
      onDeferred();
    }
    catch {
      // Handled globally.
    }
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
        <PasswordChangeDialog
          user={user}
          onPasswordChanged={onPasswordChanged}
        />
      </ActionCard.Actions>
    </ActionCard>
  );
}
