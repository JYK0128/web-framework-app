import { useI18n } from '@pkg/shared/web';
import { useNavigate } from '@tanstack/react-router';
import { Check, Copy, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useAuthControllerUserUnregister } from '#/.generated/api/endpoints/auth/auth';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { useAppForm } from '#/components/form';

type UnregisterConfirmModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
};

function generateChallengeCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const randomValues = new Uint32Array(4);
  crypto.getRandomValues(randomValues);

  let result = 'DEL-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(randomValues[i] % chars.length);
  }
  return result;
}

export function UnregisterConfirmModal({ open, onOpenChange }: UnregisterConfirmModalProps) {
  const navigate = useNavigate();
  const { mutateAsync: unregister } = useAuthControllerUserUnregister();
  const { t } = useI18n();

  const [challengeCode, setChallengeCode] = useState<string>(() => generateChallengeCode());
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const refreshChallenge = () => {
    setChallengeCode(generateChallengeCode());
    setIsCopied(false);
  };

  const handleModalOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (isOpen) {
      refreshChallenge();
    }
    else {
      unregisterForm.reset();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(challengeCode);
      setIsCopied(true);
      toast.success(t('profile.challengeCopied'));
      setTimeout(() => setIsCopied(false), 2000);
    }
    catch {
      toast.error(t('profile.copyFailed'));
    }
  };

  const isInputValid = (input?: string) => {
    if (!input) return false;
    const trimmed = input.trim().toUpperCase();
    return trimmed === challengeCode || trimmed === t('profile.deleteConfirmationText').toUpperCase();
  };

  const unregisterForm = useAppForm({
    defaultValues: {
      confirmText: '',
    },
    onSubmit: async ({ value }) => {
      if (!isInputValid(value.confirmText)) return;

      await unregister();
      void navigate({ to: '/login' });
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={handleModalOpenChange}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-destructive">
            {t('profile.deleteAccountTitle')}
          </DialogTitle>
        </DialogHeader>

        <unregisterForm.AppForm>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void unregisterForm.handleSubmit();
            }}
            className="grid gap-4"
          >
            <p className="text-xs text-muted-foreground">
              {t('profile.deleteAccountDescription')}
            </p>

            <div className="
              flex items-center justify-between rounded-xl border
              border-destructive/20 bg-destructive/5 p-3.5
            "
            >
              <div className="grid gap-0.5">
                <span className="text-2xs font-medium text-muted-foreground">
                  {t('profile.challengeCode')}
                </span>
                <span className="
                  font-mono text-lg font-extrabold tracking-widest
                  text-destructive
                "
                >
                  {challengeCode}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={refreshChallenge}
                  title={t('profile.newCode')}
                >
                  <RefreshCw className="size-3.5 text-muted-foreground" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleCopy()}
                  className="gap-1.5 font-sans text-xs"
                >
                  {isCopied
                    ? (
                      <>
                        <Check className="size-3.5 text-emerald-500" />
                        <span>{t('profile.copied')}</span>
                      </>
                    )
                    : (
                      <>
                        <Copy className="size-3.5" />
                        <span>{t('profile.copyCode')}</span>
                      </>
                    )}
                </Button>
              </div>
            </div>

            <unregisterForm.AppField name="confirmText">
              {(field) => (
                <field.Input
                  placeholder={t('profile.codePlaceholder', { code: challengeCode })}
                  autoComplete="off"
                />
              )}
            </unregisterForm.AppField>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('dialog.cancel')}
              </Button>
              <unregisterForm.Subscribe selector={(state) => state.values.confirmText}>
                {(confirmText) => (
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={!isInputValid(confirmText)}
                  >
                    {t('profile.confirmDelete')}
                  </Button>
                )}
              </unregisterForm.Subscribe>
            </div>
          </form>
        </unregisterForm.AppForm>
      </DialogContent>
    </Dialog>
  );
}
