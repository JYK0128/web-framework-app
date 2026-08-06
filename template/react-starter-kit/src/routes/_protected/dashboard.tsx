import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  KeyRound,
  Layers,
  LogOut,
  QrCode,
  RefreshCw,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { agreementsQueryOptions, useAuth } from '#/core/auth/useAuth';

export const Route = createFileRoute('/_protected/dashboard')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(agreementsQueryOptions());
  },
  component: DashboardPageComponent,
});

function DashboardPageComponent() {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    isLoading,
    sessionExpiresAt,
    generate2FA,
    turnOn2FA,
    turnOff2FA,
    logout,
    unregister,
    updateAgreements,
    refetchUser,
  } = useAuth();

  const { data: agreements = [], refetch: refetchAgreements } = useQuery(
    agreementsQueryOptions(),
  );

  // Live session timer state
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');
  const [isRefreshingSession, setIsRefreshingSession] = useState(false);

  // 2FA Setup Dialog state
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<{ secret?: string; qrCode?: string } | null>(null);
  const [setupOtpCode, setSetupOtpCode] = useState('');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [is2FAOperating, setIs2FAOperating] = useState(false);

  // Danger Zone unregister dialog
  const [showUnregisterModal, setShowUnregisterModal] = useState(false);

  // Redirect if unauthenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      void navigate({ to: '/login' });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Live session countdown effect
  useEffect(() => {
    if (!sessionExpiresAt) {
      setTimeLeftStr('무제한 (TTL 없음)');
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const target = sessionExpiresAt.getTime();
      const diff = Math.max(0, Math.floor((target - now) / 1000));

      if (diff === 0) {
        setTimeLeftStr('만료됨');
        return;
      }

      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;
      setTimeLeftStr(`${minutes}분 ${seconds < 10 ? '0' : ''}${seconds}초`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [sessionExpiresAt]);

  const handleRefreshSession = async () => {
    setIsRefreshingSession(true);
    await refetchUser();
    setIsRefreshingSession(false);
  };

  const handleStart2FASetup = async () => {
    setSetupError(null);
    setIs2FAOperating(true);
    try {
      const data = await generate2FA();
      setQrCodeData(data);
      setShow2FAModal(true);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setSetupError(errorObj.response?.data?.message || '2FA 키 생성에 실패했습니다.');
    } finally {
      setIs2FAOperating(false);
    }
  };

  const handleConfirm2FAOn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError(null);
    setIs2FAOperating(true);
    try {
      await turnOn2FA({ token: setupOtpCode });
      setShow2FAModal(false);
      setSetupOtpCode('');
      setQrCodeData(null);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setSetupError(errorObj.response?.data?.message || '2FA 활성화 인증 코드가 올바르지 않습니다.');
    } finally {
      setIs2FAOperating(false);
    }
  };

  const handleTurnOff2FA = async () => {
    if (!confirm('2단계 인증(2FA)을 해제하시겠습니까? 계정 보안이 약화될 수 있습니다.')) return;
    setIs2FAOperating(true);
    try {
      await turnOff2FA();
    } finally {
      setIs2FAOperating(false);
    }
  };

  const handleToggleAgreement = async (termId: string, currentAgreed: boolean) => {
    try {
      await updateAgreements({
        agreements: [{ termId, isAgreed: !currentAgreed }],
      });
      await refetchAgreements();
    } catch {
      alert('약관 동의 상태 변경에 실패했습니다.');
    }
  };

  const handleConfirmUnregister = async () => {
    try {
      await unregister();
      void navigate({ to: '/login' });
    } catch {
      alert('회원 탈퇴 처리에 실패했습니다.');
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex items-center gap-3 text-sm font-bold text-zinc-500">
          <RefreshCw className="size-5 animate-spin text-orange-600" />
          <span>사용자 프로필을 로딩 중입니다...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-orange-600 font-black text-white shadow-xs dark:bg-orange-500">
              <Layers className="size-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                User Dashboard
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                인증 세션 & 보안 관리
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => void logout()}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 shadow-2xs hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <LogOut className="size-3.5" />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8 sm:px-6">
        {/* Welcome Section */}
        <div className="rounded-3xl border border-orange-200/60 bg-linear-to-br from-orange-500/10 via-orange-500/5 to-transparent p-6 dark:border-orange-900/40">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700 dark:bg-orange-950/80 dark:text-orange-300">
                <UserCheck className="size-3.5" />
                인증된 세션 사용자
              </span>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                안녕하세요, {user.name}님!
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {user.email} 계정으로 접속 중입니다.
              </p>
            </div>

            {/* Session TTL Live Timer Badge */}
            <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
              <div className="flex size-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
                <Clock className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                    세션 만료 남은 시간
                  </span>
                  <button
                    onClick={handleRefreshSession}
                    disabled={isRefreshingSession}
                    title="세션 연장 / 갱신"
                    className="text-zinc-400 hover:text-orange-600 dark:hover:text-orange-400"
                  >
                    <RefreshCw className={`size-3.5 ${isRefreshingSession ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="text-lg font-mono font-black text-orange-600 dark:text-orange-400">
                  {timeLeftStr}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Card 1: User Profile Info */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div className="flex size-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <UserCheck className="size-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                프로필 카드 정보
              </h3>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between border-b border-zinc-50 py-2 dark:border-zinc-800/50">
                <span className="font-semibold text-zinc-500 dark:text-zinc-400">식별자 ID</span>
                <span className="font-mono text-zinc-900 dark:text-zinc-200">{user.id}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-50 py-2 dark:border-zinc-800/50">
                <span className="font-semibold text-zinc-500 dark:text-zinc-400">이름</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-200">{user.name}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-50 py-2 dark:border-zinc-800/50">
                <span className="font-semibold text-zinc-500 dark:text-zinc-400">이메일</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-200">{user.email}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-50 py-2 dark:border-zinc-800/50">
                <span className="font-semibold text-zinc-500 dark:text-zinc-400">이메일 검증</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5" />
                  {user.emailVerified ? '검증 완료' : '미검증'}
                </span>
              </div>
              <div className="flex justify-between border-b border-zinc-50 py-2 dark:border-zinc-800/50">
                <span className="font-semibold text-zinc-500 dark:text-zinc-400">계정 생성일</span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300">
                  {new Date(user.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-semibold text-zinc-500 dark:text-zinc-400">최근 업데이트</span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300">
                  {new Date(user.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: 2FA Security Management */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                  <Shield className="size-5" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  2단계 인증 보안 (2FA)
                </h3>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                  user.twoFactorEnabled
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                    : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                {user.twoFactorEnabled ? '활성화됨' : '비활성화'}
              </span>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                {user.twoFactorEnabled
                  ? '현재 계정에 OTP 2단계 인증이 적용되어 로그인 시 추가 인증 코드가 요구됩니다.'
                  : 'Google Authenticator 등의 OTP 앱을 등록하여 로그인 시 보안 수준을 강화하세요.'}
              </p>

              {user.twoFactorEnabled ? (
                <button
                  onClick={handleTurnOff2FA}
                  disabled={is2FAOperating}
                  className="w-full rounded-xl border border-red-200 bg-red-50/50 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300"
                >
                  2단계 인증 (2FA) 비활성화하기
                </button>
              ) : (
                <button
                  onClick={handleStart2FASetup}
                  disabled={is2FAOperating}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
                >
                  <QrCode className="size-4" />
                  <span>2단계 인증(2FA) 설정 시작</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Terms & Agreements Management */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <ShieldCheck className="size-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                약관 및 사용자 동의 관리
              </h3>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {agreements.length === 0 ? (
              <p className="py-4 text-center text-xs text-zinc-400">등록된 약관 항목이 없습니다.</p>
            ) : (
              agreements.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 transition hover:border-zinc-200 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-950/40"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {item.title}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                          item.isRequired
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                            : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        {item.isRequired ? '필수' : '선택'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-1 dark:text-zinc-400">
                      {item.content}
                    </p>
                    {item.agreedAt && (
                      <p className="text-[10px] text-zinc-400">
                        동의 일시: {new Date(item.agreedAt).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => handleToggleAgreement(item.id, item.isAgreed)}
                      disabled={item.isRequired && item.isAgreed} // Required agreements cannot be revoked directly
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                        item.isAgreed
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}
                    >
                      {item.isAgreed ? '동의 완료' : '미동의 (동의하기)'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-3xl border border-red-200/80 bg-red-50/30 p-6 dark:border-red-900/40 dark:bg-red-950/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-900 dark:text-red-200">
                  위험 구간 (Danger Zone)
                </h3>
                <p className="text-xs text-red-600/80 dark:text-red-400/80">
                  계정을 영구 삭제하면 모든 세션 및 정보가 복구 불가능하게 삭제됩니다.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowUnregisterModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
            >
              <UserX className="size-4" />
              <span>회원 탈퇴하기</span>
            </button>
          </div>
        </div>
      </main>

      {/* 2FA Setup Modal */}
      {show2FAModal && qrCodeData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                2단계 인증(2FA) 등록
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                인증 앱(Google Authenticator 등)으로 QR 코드를 스캔하세요.
              </p>
            </div>

            {setupError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
                {setupError}
              </div>
            )}

            <div className="my-6 flex flex-col items-center justify-center space-y-3">
              {qrCodeData.qrCode ? (
                <img
                  src={qrCodeData.qrCode}
                  alt="2FA QR Code"
                  className="size-44 rounded-2xl border border-zinc-200 p-2 shadow-inner dark:border-zinc-800 bg-white"
                />
              ) : (
                <div className="flex size-44 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                  <QrCode className="size-10 text-zinc-400" />
                </div>
              )}

              {qrCodeData.secret && (
                <div className="w-full text-center">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">수동 입력 키</span>
                  <div className="rounded-lg bg-zinc-100 p-1.5 text-xs font-mono font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 select-all">
                    {qrCodeData.secret}
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleConfirm2FAOn} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  생성된 6자리 OTP 코드
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 size-4 text-zinc-400" />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={setupOtpCode}
                    onChange={(e) => setSetupOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-center text-sm font-mono font-bold outline-none transition focus:border-purple-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShow2FAModal(false)}
                  className="flex-1 rounded-xl border border-zinc-200 bg-white py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={is2FAOperating || setupOtpCode.length !== 6}
                  className="flex-1 rounded-xl bg-purple-600 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-purple-700 disabled:opacity-50 dark:bg-purple-500"
                >
                  {is2FAOperating ? '검증 중...' : '등록 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unregister Confirmation Modal */}
      {showUnregisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-red-200 bg-white p-6 shadow-2xl dark:border-red-900/40 dark:bg-zinc-900">
            <div className="text-center space-y-2">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
                <AlertTriangle className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                정말 탈퇴하시겠습니까?
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                회원 탈퇴 시 모든 세션과 개인 계정 정보가 즉시 영구 삭제됩니다.
              </p>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setShowUnregisterModal(false)}
                className="flex-1 rounded-xl border border-zinc-200 bg-white py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmUnregister}
                className="flex-1 rounded-xl bg-red-600 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-red-700 dark:bg-red-500"
              >
                탈퇴 진행
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
