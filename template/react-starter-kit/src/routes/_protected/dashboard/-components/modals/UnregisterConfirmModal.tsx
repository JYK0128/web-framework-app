import { useI18n } from '@pkg/shared/web';
import { useNavigate } from '@tanstack/react-router';
import { Check, Copy, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { useAppForm } from '#/components/form';
import { useAuth } from '#/core/auth/useAuth';

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
  const { unregister } = useAuth();
  const { i18n } = useI18n();
  const isEnglish = i18n.language?.startsWith('en');

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
      toast.success(isEnglish ? 'Challenge code copied to clipboard' : '챌린지 코드가 복사되었습니다.');
      setTimeout(() => setIsCopied(false), 2000);
    }
    catch {
      toast.error(isEnglish ? 'Failed to copy code' : '복사에 실패했습니다.');
    }
  };

  const isInputValid = (input?: string) => {
    if (!input) return false;
    const trimmed = input.trim().toUpperCase();
    return trimmed === challengeCode || trimmed === 'DELETE' || input.trim() === '탈퇴합니다';
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
            {isEnglish ? 'Delete Account Confirmation' : '회원 탈퇴 확인 (Challenge)'}
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
              {isEnglish
                ? 'To prevent accidental deletion, please type the challenge code below or click to copy & paste it.'
                : '실수 및 무단 회원 탈퇴를 방지하기 위해, 아래 생성된 챌린지 코드를 입력창에 똑같이 입력해주세요.'}
            </p>

            <div className="
              flex items-center justify-between rounded-xl border
              border-destructive/20 bg-destructive/5 p-3.5
            "
            >
              <div className="grid gap-0.5">
                <span className="text-2xs font-medium text-muted-foreground">
                  {isEnglish ? 'Security Challenge Code' : '보안 챌린지 코드'}
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
                  title={isEnglish ? 'New code' : '새 코드 생성'}
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
                        <span>{isEnglish ? 'Copied' : '복사됨'}</span>
                      </>
                    )
                    : (
                      <>
                        <Copy className="size-3.5" />
                        <span>{isEnglish ? 'Copy Code' : '코드 복사'}</span>
                      </>
                    )}
                </Button>
              </div>
            </div>

            <unregisterForm.AppField name="confirmText">
              {(field) => (
                <field.Input
                  placeholder={isEnglish ? `Type ${challengeCode}` : `코드 입력: ${challengeCode}`}
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
                {isEnglish ? 'Cancel' : '취소'}
              </Button>
              <unregisterForm.Subscribe selector={(state) => state.values.confirmText}>
                {(confirmText) => (
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={!isInputValid(confirmText)}
                  >
                    {isEnglish ? 'Confirm Delete' : '회원 탈퇴 확정'}
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
