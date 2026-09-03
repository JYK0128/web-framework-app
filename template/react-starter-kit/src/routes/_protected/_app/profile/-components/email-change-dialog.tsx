import { Clock, Eye, EyeOff, Mail, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { useAuthControllerIssueEmailChangeChallenge } from '#/.generated/api/endpoints/auth/auth';
import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input } from '#/.generated/shadcn/components/ui';
import { type DialogComponentProps } from '#/components/app';
import { FormLayout, useAppForm } from '#/components/form';
import { useCountdown, useI18n } from '#/hooks';

type EmailChangeDialogProps = DialogComponentProps<string> & {
  currentEmail: string
};

export function EmailChangeDialog({
  currentEmail,
  open,
  onOpenChange,
  close,
}: EmailChangeDialogProps) {
  const { t } = useI18n();
  const issueChallengeMutation = useAuthControllerIssueEmailChangeChallenge();
  const countdown = useCountdown();

  const [isSent, setIsSent] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const emailForm = useAppForm({
    defaultValues: {
      newEmail: '',
      currentPassword: '',
    },
    onSubmit: async ({ value }) => {
      const cleanEmail = value.newEmail.trim().toLowerCase();

      const res = await issueChallengeMutation.mutateAsync({
        data: {
          newEmail: cleanEmail,
          currentPassword: value.currentPassword || undefined,
        },
      });

      setSentEmail(cleanEmail);
      setIsSent(true);
      countdown.start(res.expiresIn || 900);
    },
  });

  const handleClose = useCallback(() => {
    setIsSent(false);
    setSentEmail('');
    countdown.reset();
    emailForm.reset();
    onOpenChange?.(false);
  }, [countdown, emailForm, onOpenChange]);

  // BroadcastChannel listener for cross-tab magic link verification completion
  useEffect(() => {
    if (!open || typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const channel = new BroadcastChannel('email-change-sync');
    channel.onmessage = (event: MessageEvent<{ type?: string, email?: string }>) => {
      if (event.data?.type === 'EMAIL_CHANGED' && event.data.email) {
        close?.(event.data.email);
        handleClose();
      }
    };
    return () => {
      channel.close();
    };
  }, [open, close, handleClose]);

  const handleResend = async () => {
    const res = await issueChallengeMutation.mutateAsync({
      data: {
        newEmail: sentEmail,
        currentPassword: emailForm.getFieldValue('currentPassword') || undefined,
      },
    });
    countdown.start(res.expiresIn || 900);
  };

  const isExpired = isSent && countdown.isExpired;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
      }}
    >
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Mail className="size-5 shrink-0 text-primary" />
            <span>{t('profile.emailModalTitle')}</span>
          </DialogTitle>
          <DialogDescription>
            {isSent ? t('profile.verificationEmailSentDesc') : t('profile.emailModalDesc')}
          </DialogDescription>
        </DialogHeader>

        {!isSent
          ? (
            <emailForm.AppForm>
              <FormLayout
                onSubmit={() => void emailForm.handleSubmit()}
                className="grid gap-4"
              >
                {/* Hidden username input for browser accessibility compliance */}
                <Input
                  type="text"
                  name="username"
                  value={currentEmail}
                  readOnly
                  autoComplete="username"
                  className="hidden"
                  aria-hidden="true"
                />

                <emailForm.AppField name="newEmail">
                  {(field) => (
                    <field.Input
                      type="email"
                      label={t('profile.newEmailLabel')}
                      placeholder={t('profile.newEmailPlaceholder')}
                      autoComplete="email"
                      required
                    />
                  )}
                </emailForm.AppField>

                <emailForm.AppField name="currentPassword">
                  {(field) => (
                    <field.Input
                      type={showCurrentPw ? 'text' : 'password'}
                      label={t('profile.currentPassword')}
                      placeholder={t('profile.currentPasswordPlaceholder')}
                      autoComplete="current-password"
                      required
                      rightSide={(
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowCurrentPw(!showCurrentPw)}
                          className="
                            size-8 text-muted-foreground
                            hover:text-foreground
                          "
                          aria-label={t('profile.currentPassword')}
                        >
                          {showCurrentPw
                            ? <EyeOff className="size-4" />
                            : <Eye className="size-4" />}
                        </Button>
                      )}
                    />
                  )}
                </emailForm.AppField>

                <DialogFooter className="">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                  >
                    {t('dialog.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={issueChallengeMutation.isPending}
                  >
                    {issueChallengeMutation.isPending
                      ? t('common.sending')
                      : t('profile.sendVerificationEmail')}
                  </Button>
                </DialogFooter>
              </FormLayout>
            </emailForm.AppForm>
          )

          : (
            <div className="grid gap-5">
              <div className="
                flex flex-col items-center justify-center gap-3 rounded-lg
                border border-border/70 bg-muted/30 text-center
              "
              >
                <div className="
                  flex size-12 items-center justify-center rounded-full
                  bg-primary/10 text-primary
                "
                >
                  <Mail className="size-6" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    {sentEmail}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('profile.verificationEmailInstructions')}
                  </p>
                </div>
              </div>

              <div className="
                flex items-center justify-between rounded-md border text-xs
              "
              >
                <span className="text-muted-foreground">{t('profile.linkValidity')}</span>
                <Badge
                  variant={isExpired ? 'destructive' : 'secondary'}
                  className="font-mono text-xs font-semibold gap-1"
                >
                  <Clock className="size-3" />
                  <span>{isExpired ? t('profile.expired') : countdown.formattedTime}</span>
                </Badge>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={issueChallengeMutation.isPending}
                  onClick={() => void handleResend()}
                  className="gap-1.5 text-xs"
                >
                  <RefreshCw className={`
                    size-3.5
                    ${issueChallengeMutation.isPending ? 'animate-spin' : ''}
                  `}
                  />
                  <span>{t('profile.resendVerificationEmail')}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                >
                  {t('dialog.close')}
                </Button>
              </DialogFooter>
            </div>
          )}

      </DialogContent>
    </Dialog>
  );
}
