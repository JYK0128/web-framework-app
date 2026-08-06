import { useMutation, useQuery, useQueryClient, queryOptions } from '@tanstack/react-query';
import {
  authControllerAgreeTerms,
  authControllerGenerate2FA,
  authControllerGetUnagreedTerms,
  authControllerLoginCredential,
  authControllerLogout,
  authControllerTurnOff2FA,
  authControllerTurnOn2FA,
  authControllerUserProfile,
  authControllerUserRegister,
  authControllerUserUnregister,
  authControllerVerify2FAChallenge,
} from '#/.generated/api/endpoints/auth/auth';
import {
  termsControllerGetAgreements,
  termsControllerUpdateAgreements,
} from '#/.generated/api/endpoints/terms/terms';
import type {
  LoginRequest,
  RegisterRequest,
  TermAgreementItemDto,
  TermDto,
  TurnOn2FARequestDto,
  UpdateAgreementsRequestDto,
} from '#/.generated/api/model';
import { useState } from 'react';

export interface Pending2FAState {
  active: boolean;
}

export interface PendingTermsState {
  terms: TermDto[];
}

export const userQueryOptions = () =>
  queryOptions({
    queryKey: ['auth', 'profile'],
    queryFn: async () => {
      try {
        const res = await authControllerUserProfile();
        return res?.data ?? null;
      } catch {
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5분
  });

export const agreementsQueryOptions = () =>
  queryOptions({
    queryKey: ['terms', 'agreements'],
    queryFn: async () => {
      try {
        const res = await termsControllerGetAgreements();
        return res?.data?.terms ?? [];
      } catch {
        return [];
      }
    },
  });

export function useAuth() {
  const queryClient = useQueryClient();
  const [pending2FA, setPending2FA] = useState<Pending2FAState | null>(null);
  const [pendingTerms, setPendingTerms] = useState<PendingTermsState | null>(null);

  const { data: profileResponse, isLoading, refetch } = useQuery(userQueryOptions());

  const user = profileResponse?.user ?? null;
  const rawExpiresAt = profileResponse?.expiresAt ?? null;
  const sessionExpiresAt = rawExpiresAt ? new Date(rawExpiresAt) : null;

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      setPending2FA(null);
      setPendingTerms(null);
      const res = await authControllerLoginCredential(credentials);
      const data = res?.data;

      if (data?.twoFactorRedirect) {
        setPending2FA({ active: true });
        return;
      }

      if (data?.termsRedirect) {
        const termsRes = await authControllerGetUnagreedTerms();
        setPendingTerms({
          terms: termsRes?.data?.terms || [],
        });
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterRequest) => {
      setPendingTerms(null);
      const res = await authControllerUserRegister(data);
      const payload = res?.data;

      if (payload?.termsRedirect) {
        const termsRes = await authControllerGetUnagreedTerms();
        setPendingTerms({
          terms: termsRes?.data?.terms || [],
        });
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
    },
  });

  const verify2FAMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!pending2FA) throw new Error('No 2FA challenge active');

      const res = await authControllerVerify2FAChallenge({
        token: 'http-only-cookie',
        code,
      });
      const payload = res?.data;

      if (payload?.termsRedirect) {
        const termsRes = await authControllerGetUnagreedTerms();
        setPending2FA(null);
        setPendingTerms({
          terms: termsRes?.data?.terms || [],
        });
        return;
      }

      setPending2FA(null);
      await queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
    },
  });

  const agreeTermsMutation = useMutation({
    mutationFn: async (agreements: TermAgreementItemDto[]) => {
      await authControllerAgreeTerms({
        agreements,
        token: 'http-only-cookie',
      });
      setPendingTerms(null);
      await queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
    },
  });

  const generate2FAMutation = useMutation({
    mutationFn: async () => {
      const res = await authControllerGenerate2FA();
      return res?.data;
    },
  });

  const turnOn2FAMutation = useMutation({
    mutationFn: async (dto: TurnOn2FARequestDto) => {
      const res = await authControllerTurnOn2FA(dto);
      await queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
      return res?.data;
    },
  });

  const turnOff2FAMutation = useMutation({
    mutationFn: async () => {
      const res = await authControllerTurnOff2FA();
      await queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
      return res?.data;
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await authControllerLogout();
      } finally {
        queryClient.setQueryData(['auth', 'profile'], null);
        setPending2FA(null);
        setPendingTerms(null);
      }
    },
  });

  const unregisterMutation = useMutation({
    mutationFn: async () => {
      try {
        await authControllerUserUnregister();
      } finally {
        queryClient.setQueryData(['auth', 'profile'], null);
        setPending2FA(null);
        setPendingTerms(null);
      }
    },
  });

  const updateAgreementsMutation = useMutation({
    mutationFn: async (dto: UpdateAgreementsRequestDto) => {
      const res = await termsControllerUpdateAgreements(dto);
      await queryClient.invalidateQueries({ queryKey: ['terms', 'agreements'] });
      return res?.data;
    },
  });

  return {
    user,
    isAuthenticated: !!user,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
    sessionExpiresAt,
    rawExpiresAt,
    pending2FA,
    pendingTerms,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    verify2FA: verify2FAMutation.mutateAsync,
    agreeTerms: agreeTermsMutation.mutateAsync,
    generate2FA: generate2FAMutation.mutateAsync,
    turnOn2FA: turnOn2FAMutation.mutateAsync,
    turnOff2FA: turnOff2FAMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    unregister: unregisterMutation.mutateAsync,
    updateAgreements: updateAgreementsMutation.mutateAsync,
    refetchUser: refetch,
  };
}
