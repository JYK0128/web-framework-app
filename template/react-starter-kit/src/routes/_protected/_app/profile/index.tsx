import { useI18n } from '@pkg/shared/web';
import * as PortOne from '@portone/browser-sdk/v2';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { User } from 'lucide-react';
import { useMemo, useState } from 'react';

import { getAuthControllerUserProfileQueryKey, useAuthControllerGenerate2FA, useAuthControllerTurnOff2FA, useAuthControllerVerifyIdentityPhoneChange } from '#/.generated/api/endpoints/auth/auth';
import { useTermsControllerGetAgreements } from '#/.generated/api/endpoints/terms/terms';
import type { AgreementDto, VerifyIdentityPhoneChangeResponseDto } from '#/.generated/api/model';
import { confirm } from '#/components/app/system-dialog';
import { env } from '#/env';

import { AgreementHistoryCard } from './-components/AgreementHistoryCard';
import { DeleteAccountCard } from './-components/DeleteAccountCard';
import { EmailChangeModal } from './-components/modals/EmailChangeModal';
import { PasswordChangeModal } from './-components/modals/PasswordChangeModal';
import { TwoFactorSetupModal } from './-components/modals/TwoFactorSetupModal';
import { UnregisterConfirmModal } from './-components/modals/UnregisterConfirmModal';
import { ProfileSummaryCard } from './-components/ProfileSummaryCard';
import { ProfileTabs, type TabType } from './-components/ProfileTabs';
import { TermsAgreementsCard } from './-components/TermsAgreementsCard';

export const Route = createFileRoute('/_protected/_app/profile/')({
  component: ProfilePageComponent,
});

function ProfilePageComponent() {
  const { t } = useI18n();
  const { user: contextUser } = Route.useRouteContext();
  const [user, setUser] = useState(contextUser);
  const { data: agreementsResponse } = useTermsControllerGetAgreements();
  const [agreementOverrides, setAgreementOverrides] = useState<Record<string, boolean>>({});

  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Modals state
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [showEmailChangeModal, setShowEmailChangeModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showUnregisterModal, setShowUnregisterModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | undefined>();
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  const queryClient = useQueryClient();
  const generate2FAMutation = useAuthControllerGenerate2FA();
  const turnOff2FAMutation = useAuthControllerTurnOff2FA();
  const verifyIdentityMutation = useAuthControllerVerifyIdentityPhoneChange();

  const agreements = useMemo<AgreementDto[]>(() => (
    (agreementsResponse?.terms ?? []).map((agreement) => (
      agreement.id in agreementOverrides
        ? { ...agreement, isAgreed: agreementOverrides[agreement.id] }
        : agreement
    ))
  ), [agreementOverrides, agreementsResponse?.terms]);

  const handleAgreementChanged = (termId: string, isAgreed: boolean) => {
    setAgreementOverrides((currentOverrides) => ({
      ...currentOverrides,
      [termId]: isAgreed,
    }));
  };

  const handlePasswordChanged = () => {
    setUser((currentUser) => ({
      ...currentUser,
      isPasswordChangeRequired: false,
      passwordUpdatedAt: new Date().toISOString(),
    }));
  };

  const handleTwoFactorChanged = (enabled: boolean) => {
    setUser((currentUser) => ({
      ...currentUser,
      twoFactorEnabled: enabled,
    }));
  };

  const handleProfileUpdated = (data: { name?: string, phoneNumber?: string, email?: string }) => {
    setUser((currentUser) => ({
      ...currentUser,
      ...(data.name ? { name: data.name } : {}),
      ...(data.phoneNumber ? { phoneNumber: data.phoneNumber, phoneNumberVerified: true } : {}),
      ...(data.email ? { email: data.email, emailVerified: true } : {}),
    }));
  };

  // PortOne Identity Verification Flow
  const isPortOneConfigured = Boolean(env.VITE_PORTONE_STORE_ID && env.VITE_PORTONE_IDENTITY_VERIFICATION_CHANNEL_KEY);
  const portOneIdentityFlowMutation = useMutation({
    mutationFn: async () => {
      if (!isPortOneConfigured) {
        throw new Error(t('profile.portoneEnvMissing'));
      }

      const identityVerificationId = `idv_${crypto.randomUUID()}`;

      const response = await PortOne.requestIdentityVerification({
        storeId: env.VITE_PORTONE_STORE_ID!,
        identityVerificationId,
        channelKey: env.VITE_PORTONE_IDENTITY_VERIFICATION_CHANNEL_KEY!,
        windowType: {
          pc: 'POPUP',
          mobile: 'POPUP',
        },
      });

      if (!response) return;

      if (response.code) {
        if (response.code.toUpperCase().includes('CANCEL')) {
          return;
        }
        throw new Error(response.message || response.code);
      }

      const result = await verifyIdentityMutation.mutateAsync({
        data: {
          identityVerificationId: response.identityVerificationId,
        },
      });

      const data: VerifyIdentityPhoneChangeResponseDto = (result as { data?: VerifyIdentityPhoneChangeResponseDto })?.data || result;

      handleProfileUpdated({
        name: data.name,
        phoneNumber: data.phoneNumber,
      });
      await queryClient.invalidateQueries({ queryKey: getAuthControllerUserProfileQueryKey() });
    },
  });

  const isIdentityVerifying = portOneIdentityFlowMutation.isPending || verifyIdentityMutation.isPending;

  const handleOpen2FASetup = async () => {
    try {
      setIsGeneratingQr(true);
      const res = await generate2FAMutation.mutateAsync();
      const qrUrl = (res as { qrCodeUrl?: string })?.qrCodeUrl || (res as { data?: { qrCodeUrl?: string } })?.data?.qrCodeUrl;
      setQrCodeUrl(qrUrl);
      setShow2FAModal(true);
    }
    finally {
      setIsGeneratingQr(false);
    }
  };

  const handleTurnOff2FA = async () => {
    const isConfirmed = await confirm({
      title: t('profile.disableTwoFactorTitle'),
      description: t('profile.disableTwoFactorDescription'),
      confirmText: t('profile.disableTwoFactor'),
      cancelText: t('common.cancel'),
      variant: 'destructive',
    });

    if (!isConfirmed) return;

    await turnOff2FAMutation.mutateAsync();
    handleTwoFactorChanged(false);
  };

  return (
    <>
      <div className="
        mx-auto grid size-full max-w-7xl grid-rows-[auto_auto_1fr] gap-6
        overflow-hidden pt-6 pl-6 pr-0 pb-0
      "
      >
        {/* Header */}
        <div className="
          flex flex-col gap-4 pr-6
          sm:flex-row sm:items-center sm:justify-between
        "
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="
                flex size-9 items-center justify-center rounded-lg bg-primary/10
                text-primary shadow-xs
              "
              >
                <User className="size-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {t('profile.title')}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('profile.subtitle')}
            </p>
          </div>
        </div>

        <div className="pr-6">
          <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} agreements={agreements} />
        </div>

        <main className="scroll-y pr-6 pb-6">
          {activeTab === 'overview' && (
            <div className="grid gap-6">
              <ProfileSummaryCard
                user={user}
                onOpenPasswordModal={() => setShowPasswordChangeModal(true)}
                onOpenEmailModal={() => setShowEmailChangeModal(true)}
                onOpen2FAModal={() => void handleOpen2FASetup()}
                onTurnOff2FA={() => void handleTurnOff2FA()}
                onVerifyIdentity={() => portOneIdentityFlowMutation.mutate()}
                isIdentityVerifying={isIdentityVerifying}
                isGeneratingQr={isGeneratingQr}
              />

              <DeleteAccountCard
                onOpenDeleteModal={() => setShowUnregisterModal(true)}
              />
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="grid gap-6">
              <TermsAgreementsCard
                agreements={agreements}
                onAgreementChanged={handleAgreementChanged}
              />
              <AgreementHistoryCard />
            </div>
          )}
        </main>
      </div>

      <PasswordChangeModal
        user={user}
        open={showPasswordChangeModal}
        onOpenChange={setShowPasswordChangeModal}
        onPasswordChanged={handlePasswordChanged}
      />

      <EmailChangeModal
        open={showEmailChangeModal}
        onOpenChange={setShowEmailChangeModal}
        currentEmail={user.email}
        onEmailChanged={(newEmail) => handleProfileUpdated({ email: newEmail })}
      />

      <TwoFactorSetupModal
        open={show2FAModal}
        onOpenChange={setShow2FAModal}
        qrCodeUrl={qrCodeUrl}
        onEnabled={() => handleTwoFactorChanged(true)}
      />

      <UnregisterConfirmModal
        open={showUnregisterModal}
        onOpenChange={setShowUnregisterModal}
      />
    </>
  );
}
