import { useAuthControllerDeferPasswordChange } from '#/.generated/api/endpoints/auth/auth';
import type { AuthPrincipalResponse } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { ActionCard, openDialog } from '#/components/app';
import { useI18n } from '#/hooks';
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
        <Button
          variant="outline"
          size="sm"
          className="h-7.5 gap-1 text-xs shrink-0 cursor-pointer"
          onClick={() => {
            void openDialog(PasswordChangeDialog, { user }, { dialogId: 'password-change-dashboard' }).then((changed) => {
              if (changed) onPasswordChanged();
            });
          }}
        >
          {t('profile.changePassword')}
        </Button>
      </ActionCard.Actions>
    </ActionCard>
  );
}
