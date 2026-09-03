import { formatDate } from '@pkg/shared/common';
import * as PortOne from '@portone/browser-sdk/v2';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, Lock, Phone, ShieldAlert, ShieldOff } from 'lucide-react';
import type { IconName } from 'lucide-react/dynamic';
import { type ReactNode, useState } from 'react';

import { getAuthControllerUserProfileQueryKey, useAuthControllerTurnOff2FA, useAuthControllerVerifyIdentityPhoneChange } from '#/.generated/api/endpoints/auth/auth';
import type { AuthPrincipalResponse, VerifyIdentityPhoneChangeResponseDto } from '#/.generated/api/model';
import { Badge, Button, Separator } from '#/.generated/shadcn/components/ui';
import { ActionCard, SectionCard } from '#/components/app';
import { confirm } from '#/components/app/system-dialog';
import { env } from '#/env';
import { useI18n } from '#/hooks';
import { EmailChangeDialog } from '#/routes/_protected/_app/profile/-components/email-change-dialog';
import { PasswordChangeDialog } from '#/routes/_protected/_app/profile/-components/password-change-dialog';
import { UnregisterConfirmDialog } from '#/routes/_protected/_app/profile/-components/unregister-confirm-dialog';

type ProfileOverviewTabProps = { contextUser: AuthPrincipalResponse };

export function ProfileOverviewTab({ contextUser }: ProfileOverviewTabProps) {
  const { t } = useI18n();
  const [user, setUser] = useState(contextUser);
  const queryClient = useQueryClient();
  const turnOff2FAMutation = useAuthControllerTurnOff2FA();
  const verifyIdentityMutation = useAuthControllerVerifyIdentityPhoneChange();

  const updateUser = (data: { name?: string, phoneNumber?: string, email?: string }) => {
    setUser((currentUser) => ({
      ...currentUser,
      ...(data.name ? { name: data.name } : {}),
      ...(data.phoneNumber ? { phoneNumber: data.phoneNumber, phoneNumberVerified: true } : {}),
      ...(data.email ? { email: data.email, emailVerified: true } : {}),
    }));
  };

  const handlePasswordChanged = () => {
    setUser((currentUser) => ({
      ...currentUser,
      isPasswordChangeRequired: false,
      passwordUpdatedAt: new Date().toISOString(),
    }));
  };

  const portOneIdentityFlowMutation = useMutation({
    mutationFn: async () => {
      if (!env.VITE_PORTONE_STORE_ID || !env.VITE_PORTONE_IDENTITY_VERIFICATION_CHANNEL_KEY) {
        throw new Error(t('profile.portoneEnvMissing'));
      }

      const response = await PortOne.requestIdentityVerification({
        storeId: env.VITE_PORTONE_STORE_ID,
        identityVerificationId: `idv_${crypto.randomUUID()}`,
        channelKey: env.VITE_PORTONE_IDENTITY_VERIFICATION_CHANNEL_KEY,
        windowType: { pc: 'IFRAME', mobile: 'IFRAME' },
        redirectUrl: window.location.href,
      });

      if (!response) return;
      if (response.code) {
        if (response.code.toUpperCase().includes('CANCEL')) return;
        throw new Error(response.message || response.code);
      }

      const data: VerifyIdentityPhoneChangeResponseDto = await verifyIdentityMutation.mutateAsync({
        data: { identityVerificationId: response.identityVerificationId },
      });
      updateUser({ name: data.name, phoneNumber: data.phoneNumber });
      await queryClient.invalidateQueries({ queryKey: getAuthControllerUserProfileQueryKey() });
    },
  });

  const handleTurnOff2FA = async () => {
    const isConfirmed = await confirm({
      title: t('profile.disableTwoFactorTitle'),
      description: t('profile.disableTwoFactorDescription'),
      confirmLabel: t('profile.disableTwoFactor'),
      cancelLabel: t('common.cancel'),
      tone: 'danger',
    });
    if (!isConfirmed) return;
    await turnOff2FAMutation.mutateAsync();
    setUser((currentUser) => ({ ...currentUser, twoFactorEnabled: false }));
  };

  return (
    <ProfileSecurityCard
      user={user}
      onPasswordChanged={handlePasswordChanged}
      onEmailChanged={(email) => updateUser({ email })}
      onEnabled={() => setUser((currentUser) => ({ ...currentUser, twoFactorEnabled: true }))}
      onTurnOff2FA={() => void handleTurnOff2FA()}
      onVerifyIdentity={() => portOneIdentityFlowMutation.mutate()}
      isIdentityVerifying={portOneIdentityFlowMutation.isPending || verifyIdentityMutation.isPending}
    />
  );
}

type ProfileSecurityCardProps = {
  user: AuthPrincipalResponse
  onPasswordChanged: () => void
  onEmailChanged: (email: string) => void
  onEnabled: () => void
  onTurnOff2FA: () => void
  onVerifyIdentity: () => void
  isIdentityVerifying?: boolean
};

function CheckpointRow({
  icon,
  iconColor,
  title,
  description,
  action,
}: {
  icon: IconName
  iconColor: string
  title: string
  description: string
  action: ReactNode
}) {
  return (
    <ActionCard
      icon={icon}
      iconColor={iconColor}
      title={title}
      description={description}
      variant="ghost"
      className="h-full"
    >
      <ActionCard.Actions>{action}</ActionCard.Actions>
    </ActionCard>
  );
}

function SecurityScoreBadge({ passedCount }: { passedCount: number }) {
  const { t } = useI18n();
  const isExcellent = passedCount === 4;
  const isWarning = passedCount <= 2;
  let badgeVariant: 'default' | 'destructive' | 'secondary' = 'secondary';
  if (isExcellent) badgeVariant = 'default';
  else if (isWarning) badgeVariant = 'destructive';

  return (
    <Badge variant={badgeVariant} className="text-xs font-semibold gap-1">
      {isExcellent
        ? <CheckCircle2 className="size-3" />
        : (
          <ShieldAlert className="size-3" />
        )}
      <span>{isExcellent ? t('profile.securityComplete') : t('profile.securityRecommendation')}</span>
      <span className="opacity-80">
        (
        {passedCount}
        /4)
      </span>
    </Badge>
  );
}

function TwoFactorAction({
  isTwoFactorEnabled,
  onTurnOff2FA,
  onEnabled,
}: {
  isTwoFactorEnabled: boolean
  onTurnOff2FA: () => void
  onEnabled: () => void
}) {
  const { t } = useI18n();

  return isTwoFactorEnabled
    ? (
      <Button
        variant="outline"
        size="sm"
        className="
          h-7.5 gap-1 text-xs text-destructive
          hover:bg-destructive/10
          dark:hover:bg-destructive/20
          shrink-0 cursor-pointer
        "
        onClick={onTurnOff2FA}
      >
        <ShieldOff className="size-3" />
        <span>{t('profile.disableTwoFactor')}</span>
      </Button>
    )
    : (
      <Button
        variant="outline"
        size="sm"
        className="
          h-7.5 gap-1 text-xs text-amber-600 border-amber-300/80
          hover:bg-amber-50
          dark:border-amber-700
          dark:hover:bg-amber-950/30
          shrink-0 cursor-pointer
        "
        onClick={onEnabled}
      >
        <Lock className="size-3" />
        {t('profile.startTwoFactorSetup')}
      </Button>
    );
}

function ProfileSecurityCard({
  user,
  onPasswordChanged,
  onEmailChanged,
  onEnabled,
  onTurnOff2FA,
  onVerifyIdentity,
  isIdentityVerifying = false,
}: ProfileSecurityCardProps) {
  const { t } = useI18n();
  const isPhoneVerified = Boolean(user.phoneNumberVerified);
  const isEmailVerified = Boolean(user.emailVerified);
  const isTwoFactorEnabled = Boolean(user.twoFactorEnabled);
  const isPasswordChangeRequired = Boolean(user.isPasswordChangeRequired);
  const passwordUpdatedAt = user.passwordUpdatedAt ? new Date(user.passwordUpdatedAt) : null;
  const passedCount = [isPhoneVerified, isEmailVerified, isTwoFactorEnabled, !isPasswordChangeRequired].filter(Boolean).length;
  const passwordDescription = passwordUpdatedAt
    ? `${t('profile.lastPasswordChange')}: ${formatDate(passwordUpdatedAt, 'yyyy.MM.dd')}`
    : t('profile.passwordChangeDescription');

  return (
    <SectionCard textSize="sm" title={t('profile.securityChecklistTitle')} description={t('profile.securityChecklistDesc')}>
      <SectionCard.Actions><SecurityScoreBadge passedCount={passedCount} /></SectionCard.Actions>
      <SectionCard.Content>
        <div className="grid grid-cols-1 gap-2 p-2">
          <div className="grid content-start gap-2 text-xs">
            <CheckpointRow
              icon="phone"
              iconColor={isPhoneVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}
              title={t('profile.phoneNumber')}
              description={user.phoneNumber || t('profile.phoneNotSet')}
              action={(
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7.5 gap-1 text-xs shrink-0 cursor-pointer"
                  onClick={onVerifyIdentity}
                  disabled={isIdentityVerifying}
                >
                  {isIdentityVerifying
                    ? (
                      <>
                        <Loader2 className="size-3 animate-spin" />
                        <span>{t('profile.verifyingIdentity')}</span>
                      </>
                    )
                    : (
                      <>
                        <Phone className="size-3 text-primary" />
                        <span>{isPhoneVerified ? t('profile.changePhoneNumber') : t('profile.identityVerificationAction')}</span>
                      </>
                    )}
                </Button>
              )}
            />
            <CheckpointRow
              icon="mail"
              iconColor={isEmailVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}
              title={t('profile.emailAccount')}
              description={user.email}
              action={<EmailChangeDialog currentEmail={user.email} onEmailChanged={onEmailChanged} />}
            />
            <CheckpointRow
              icon="key-round"
              iconColor={!isPasswordChangeRequired ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}
              title={t('profile.changePassword')}
              description={passwordDescription}
              action={<PasswordChangeDialog user={user} onPasswordChanged={onPasswordChanged} />}
            />
            <CheckpointRow
              icon={isTwoFactorEnabled ? 'shield-check' : 'triangle-alert'}
              iconColor={isTwoFactorEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}
              title={t('profile.twoFactorTitle')}
              description={isTwoFactorEnabled ? t('profile.twoFactorActive') : t('profile.twoFactorSetupDescriptionShort')}
              action={<TwoFactorAction isTwoFactorEnabled={isTwoFactorEnabled} onTurnOff2FA={onTurnOff2FA} onEnabled={onEnabled} />}
            />
            <Separator className="my-1" />
            <CheckpointRow
              icon="triangle-alert"
              iconColor="text-destructive"
              title={t('profile.dangerZone')}
              description={t('profile.deleteWarning')}
              action={<UnregisterConfirmDialog />}
            />
          </div>
        </div>
      </SectionCard.Content>
    </SectionCard>
  );
}
