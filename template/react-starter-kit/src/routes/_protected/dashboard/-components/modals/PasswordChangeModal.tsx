import { Eye, EyeOff, Key } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { useAppForm } from '#/components/form';
import { useAuth } from '#/core/auth/useAuth';

type PasswordChangeModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
};

export function PasswordChangeModal({ open, onOpenChange }: PasswordChangeModalProps) {
  const { user, changePassword } = useAuth();
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
        setPwError('현재 비밀번호를 입력해주세요.');
        return;
      }
      if (value.newPassword.length < 8) {
        setPwError('새 비밀번호는 최소 8자 이상이어야 합니다.');
        return;
      }
      if (value.newPassword !== value.confirmPassword) {
        setPwError('새 비밀번호가 일치하지 않습니다.');
        return;
      }

      await changePassword({
        currentPassword: value.currentPassword,
        newPassword: value.newPassword,
        confirmPassword: value.confirmPassword,
      });

      passwordForm.reset();
      onOpenChange(false);
      toast.success('비밀번호가 성공적으로 변경되었습니다.');
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          setPwError(null);
          passwordForm.reset();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Key className="size-5 shrink-0 text-orange-500" />
            <span>비밀번호 변경</span>
          </DialogTitle>
        </DialogHeader>

        <passwordForm.AppForm>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void passwordForm.handleSubmit();
            }}
            className="grid gap-4"
          >
            {/* Hidden username input for browser accessibility compliance */}
            <input
              type="text"
              name="username"
              value={user?.email ?? ''}
              readOnly
              autoComplete="username"
              className="hidden"
              aria-hidden="true"
            />
            <passwordForm.AppField name="currentPassword">
              {(field) => (
                <field.Input
                  type={showCurrentPw ? 'text' : 'password'}
                  label="현재 비밀번호"
                  placeholder="현재 비밀번호 입력"
                  autoComplete="current-password"
                  rightSide={(
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="
                        text-zinc-400
                        hover:text-zinc-600
                        dark:hover:text-zinc-200
                      "
                    >
                      {showCurrentPw
                        ? <EyeOff className="size-4" />
                        : (
                          <Eye className="size-4" />
                        )}
                    </button>
                  )}
                />
              )}
            </passwordForm.AppField>

            <passwordForm.AppField name="newPassword">
              {(field) => (
                <field.Input
                  type={showNewPw ? 'text' : 'password'}
                  label="새 비밀번호 (최소 8자)"
                  placeholder="새 비밀번호 입력"
                  autoComplete="new-password"
                  rightSide={(
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="
                        text-zinc-400
                        hover:text-zinc-600
                        dark:hover:text-zinc-200
                      "
                    >
                      {showNewPw
                        ? <EyeOff className="size-4" />
                        : (
                          <Eye className="size-4" />
                        )}
                    </button>
                  )}
                />
              )}
            </passwordForm.AppField>

            <passwordForm.AppField name="confirmPassword">
              {(field) => (
                <field.Input
                  type="password"
                  label="새 비밀번호 확인"
                  placeholder="새 비밀번호 다시 입력"
                  autoComplete="new-password"
                />
              )}
            </passwordForm.AppField>

            {pwError && (
              <div className="
                rounded-xl border border-destructive/30 bg-destructive/10 p-3
                text-xs font-semibold text-destructive
              "
              >
                {pwError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                취소
              </Button>
              <Button type="submit">
                비밀번호 변경 완료
              </Button>
            </div>
          </form>
        </passwordForm.AppForm>
      </DialogContent>
    </Dialog>
  );
}
