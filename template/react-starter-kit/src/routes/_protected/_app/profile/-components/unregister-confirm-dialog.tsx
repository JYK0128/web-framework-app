import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Check, Copy, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { getAuthControllerUserProfileQueryKey, useAuthControllerUserUnregister } from '#/.generated/api/endpoints/auth/auth';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { type DialogComponentProps } from '#/components/dialog';
import { FormLayout, useAppForm } from '#/components/form';
import { ActionCard } from '#/components/layout';
import { useI18n } from '#/hooks';

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

type UnregisterConfirmDialogProps = DialogComponentProps<void>;

export function UnregisterConfirmDialog({
  open,
  onOpenChange,
}: UnregisterConfirmDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const unregisterMutation = useAuthControllerUserUnregister();
  const { t } = useI18n();

  const [challengeCode, setChallengeCode] = useState<string>(() => generateChallengeCode());
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const refreshChallenge = () => {
    setChallengeCode(generateChallengeCode());
    setIsCopied(false);
  };

  const handleDialogOpenChange = (isOpen: boolean) => {
    onOpenChange?.(isOpen);
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

  const isInputValid = (input: string) => {
    const trimmed = input.trim().toUpperCase();
    return trimmed === challengeCode || trimmed === t('profile.deleteConfirmationText').toUpperCase();
  };

  const unregisterForm = useAppForm({
    defaultValues: {
      confirmText: '',
    },
    onSubmit: async ({ value }) => {
      if (!isInputValid(value.confirmText)) return;

      try {
        await unregisterMutation.mutateAsync();
      }
      catch {
        // 탈퇴 처리 에러 발생 시에도 클라이언트 캐시 정리 및 이동을 보장
      }
      finally {
        queryClient.removeQueries({ queryKey: getAuthControllerUserProfileQueryKey() });
        await navigate({ to: '/login', replace: true });
        queryClient.clear();
      }
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={handleDialogOpenChange}
    >
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-destructive">
            {t('profile.deleteAccountTitle')}
          </DialogTitle>
        </DialogHeader>

        <unregisterForm.AppForm>
          <FormLayout
            onSubmit={() => void unregisterForm.handleSubmit()}
            className="grid gap-4"
          >
            <p className="text-xs text-muted-foreground">
              {t('profile.deleteAccountDescription')}
            </p>

            <ActionCard
              variant="destructive"
              icon="alert-triangle"
              iconColor="text-destructive"
              title={challengeCode}
              description={t('profile.challengeCode')}
            >
              <ActionCard.Actions>
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
              </ActionCard.Actions>
            </ActionCard>

            <unregisterForm.AppField name="confirmText">
              {(field) => (
                <field.Input
                  placeholder={t('profile.codePlaceholder', { code: challengeCode })}
                  autoComplete="off"
                />
              )}
            </unregisterForm.AppField>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange?.(false)}
              >
                {t('app.dialog.cancel')}
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
            </DialogFooter>
          </FormLayout>
        </unregisterForm.AppForm>
      </DialogContent>

    </Dialog>
  );
}
