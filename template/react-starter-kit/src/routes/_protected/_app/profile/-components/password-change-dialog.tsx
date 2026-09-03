import { useAuthControllerChangePassword } from '#/.generated/api/endpoints/auth/auth';
import type { AuthPrincipalResponse } from '#/.generated/api/model';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input } from '#/.generated/shadcn/components/ui';
import { type DialogComponentProps } from '#/components/app';
import { FormLayout, useAppForm } from '#/components/form';
import { useI18n } from '#/hooks';

type PasswordChangeDialogProps = DialogComponentProps<boolean> & {
  user: AuthPrincipalResponse
};

export function PasswordChangeDialog({
  user,
  open,
  onOpenChange,
  close,
}: PasswordChangeDialogProps) {

  const changePasswordMutation = useAuthControllerChangePassword();
  const { t } = useI18n();
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const passwordForm = useAppForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    onSubmit: async ({ value }) => {
      setPwError(null);

      if (!value.currentPassword) {
        setPwError(t('profile.currentPasswordRequired'));
        return;
      }
      if (value.newPassword !== value.confirmPassword) {
        setPwError(t('profile.newPasswordMismatch'));
        return;
      }

      await changePasswordMutation.mutateAsync({
        data: {
          currentPassword: value.currentPassword,
          newPassword: value.newPassword,
          confirmPassword: value.confirmPassword,
        },
      });

      passwordForm.reset();
      close?.(true);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange?.(isOpen);
        if (!isOpen) {
          setPwError(null);
          passwordForm.reset();
        }
      }}
    >
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <span>{t('profile.passwordModalTitle')}</span>
          </DialogTitle>
        </DialogHeader>

        <passwordForm.AppForm>
          <FormLayout
            onSubmit={() => void passwordForm.handleSubmit()}
            className="grid gap-4"
          >
            {/* Hidden username input for browser accessibility compliance */}
            <Input
              type="text"
              name="username"
              value={user.email}
              readOnly
              autoComplete="username"
              className="hidden"
              aria-hidden="true"
            />
            <passwordForm.AppField name="currentPassword">
              {(field) => (
                <field.Input
                  type={showCurrentPw ? 'text' : 'password'}
                  label={t('profile.currentPassword')}
                  placeholder={t('profile.currentPasswordPlaceholder')}
                  autoComplete="current-password"
                  rightSide={(
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="
                        size-8 text-zinc-400
                        hover:text-zinc-600
                        dark:hover:text-zinc-200
                      "
                      aria-label={t('profile.currentPassword')}
                    >
                      {showCurrentPw
                        ? <EyeOff className="size-4" />
                        : (
                          <Eye className="size-4" />
                        )}
                    </Button>
                  )}
                />
              )}
            </passwordForm.AppField>

            <passwordForm.AppField name="newPassword">
              {(field) => (
                <field.Input
                  type={showNewPw ? 'text' : 'password'}
                  label={t('profile.newPassword')}
                  placeholder={t('profile.newPasswordPlaceholder')}
                  autoComplete="new-password"
                  rightSide={(
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="
                        size-8 text-zinc-400
                        hover:text-zinc-600
                        dark:hover:text-zinc-200
                      "
                      aria-label={t('profile.newPassword')}
                    >
                      {showNewPw
                        ? <EyeOff className="size-4" />
                        : (
                          <Eye className="size-4" />
                        )}
                    </Button>
                  )}
                />
              )}
            </passwordForm.AppField>

            <passwordForm.AppField name="confirmPassword">
              {(field) => (
                <field.Input
                  type="password"
                  label={t('profile.confirmNewPassword')}
                  placeholder={t('profile.confirmNewPasswordPlaceholder')}
                  autoComplete="new-password"
                />
              )}
            </passwordForm.AppField>

            {pwError && (
              <div className="
                rounded-xl border border-destructive/30 bg-destructive/10
                text-xs font-semibold text-destructive
              "
              >
                {pwError}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {t('dialog.cancel')}
              </Button>
              <Button type="submit">
                {t('profile.passwordChangeComplete')}
              </Button>
            </DialogFooter>
          </FormLayout>
        </passwordForm.AppForm>
      </DialogContent>

    </Dialog>
  );
}
