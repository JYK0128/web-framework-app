import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { authControllerChangePassword, authControllerDeferPasswordChange, authControllerGenerate2FA, authControllerLoginCredential, authControllerLogout, authControllerTurnOff2FA, authControllerTurnOn2FA, authControllerUserRegister, authControllerUserUnregister, authControllerVerify2FAChallenge, getAuthControllerUserProfileQueryKey, useAuthControllerUserProfile } from '#/.generated/api/endpoints/auth/auth';
import { getTermsControllerGetAgreementsQueryKey, termsControllerSetAgreements } from '#/.generated/api/endpoints/terms/terms';
import type { ChangePasswordRequest, LoginRequest, RegisterRequest, SetAgreementsRequestDto, TermAgreementItemDto, TwoFactorTurnOnRequestDto } from '#/.generated/api/model';

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const queryClient = useQueryClient();

  // 2FA 챌린지 진행 중 여부 (로그인 흐름에서만 사용)
  const [is2FAPending, setIs2FAPending] = useState(false);

  const { data: profileResponse, isLoading, refetch } = useAuthControllerUserProfile({
    query: {
      select: (response) => response?.data ?? null,
    },
  });

  // ── Derived State ──────────────────────────────────────────────────────────

  const user = profileResponse?.user ?? null;
  const rawExpiresAt = profileResponse?.expiresAt ?? null;
  const sessionExpiresAt = rawExpiresAt ? new Date(rawExpiresAt) : null;

  const isAuthenticated = !!user;

  // ── Internal Helpers ───────────────────────────────────────────────────────

  const invalidateProfile = () =>
    queryClient.invalidateQueries({ queryKey: getAuthControllerUserProfileQueryKey() });

  const invalidateAgreements = () =>
    queryClient.invalidateQueries({ queryKey: getTermsControllerGetAgreementsQueryKey() });

  /** 로그아웃/탈퇴 시 클라이언트 세션 완전 초기화 */
  const clearSession = () => {
    queryClient.setQueryData(getAuthControllerUserProfileQueryKey(), null);
    setIs2FAPending(false);
  };

  // ── Mutations ──────────────────────────────────────────────────────────────

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      setIs2FAPending(false);
      const res = await authControllerLoginCredential(credentials);
      if (res?.data?.twoFactorRedirect) {
        setIs2FAPending(true);
        return;
      }
      await invalidateProfile();
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterRequest) => {
      setIs2FAPending(false);
      await authControllerUserRegister(data);
    },
  });

  const verify2FAMutation = useMutation({
    // 백엔드가 two_factor 쿠키로 검증 → 프론트 guard 불필요
    mutationFn: async (code: string) => {
      await authControllerVerify2FAChallenge({ code });
      setIs2FAPending(false);
      await invalidateProfile();
    },
  });

  const agreeTermsMutation = useMutation({
    mutationFn: async (agreements: TermAgreementItemDto[]) => {
      await termsControllerSetAgreements({ agreements });
      await Promise.all([invalidateProfile(), invalidateAgreements()]);
    },
  });

  const setAgreementsMutation = useMutation({
    mutationFn: async (dto: SetAgreementsRequestDto) => {
      const res = await termsControllerSetAgreements(dto);
      await invalidateAgreements();
      return res?.data;
    },
  });

  const generate2FAMutation = useMutation({
    mutationFn: async () => {
      const res = await authControllerGenerate2FA();
      return res?.data;
    },
  });

  const turnOn2FAMutation = useMutation({
    mutationFn: async (dto: TwoFactorTurnOnRequestDto) => {
      const res = await authControllerTurnOn2FA(dto);
      await invalidateProfile();
      return res?.data;
    },
  });

  const turnOff2FAMutation = useMutation({
    mutationFn: async () => {
      const res = await authControllerTurnOff2FA();
      await invalidateProfile();
      return res?.data;
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await authControllerLogout();
      }
      finally {
        clearSession();
      }
    },
  });

  const unregisterMutation = useMutation({
    mutationFn: async () => {
      try {
        await authControllerUserUnregister();
      }
      finally {
        clearSession();
      }
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (dto: ChangePasswordRequest) => {
      const res = await authControllerChangePassword(dto);
      await invalidateProfile();
      return res?.data;
    },
  });

  const deferPasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await authControllerDeferPasswordChange();
      await invalidateProfile();
      return res?.data;
    },
  });

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    // ── State
    user,
    isAuthenticated,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
    is2FAPending,
    sessionExpiresAt,
    rawExpiresAt,
    // ── Auth
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    verify2FA: verify2FAMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    unregister: unregisterMutation.mutateAsync,
    refetchUser: refetch,
    // ── Terms
    agreeTerms: agreeTermsMutation.mutateAsync,
    setAgreements: setAgreementsMutation.mutateAsync,
    // ── 2FA Setup
    generate2FA: generate2FAMutation.mutateAsync,
    turnOn2FA: turnOn2FAMutation.mutateAsync,
    turnOff2FA: turnOff2FAMutation.mutateAsync,
    // ── Password
    changePassword: changePasswordMutation.mutateAsync,
    deferPassword: deferPasswordMutation.mutateAsync,
  };
}
