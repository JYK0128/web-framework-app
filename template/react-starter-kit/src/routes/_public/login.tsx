import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { useAuth } from '#/core/auth/useAuth';

export const Route = createFileRoute('/_public/login')({
  component: LoginPageComponent,
});

function LoginPageComponent() {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    pending2FA,
    pendingTerms,
    login,
    register,
    verify2FA,
    agreeTerms,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [agreedTermIds, setAgreedTermIds] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated and no challenges pending, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && !pending2FA && !pendingTerms) {
      void navigate({ to: '/dashboard' });
    }
  }, [isAuthenticated, pending2FA, pendingTerms, navigate]);

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login({ email, password });
      } else {
        await register({ email, password, name });
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setErrorMsg(errorObj.response?.data?.message || '인증 처리에 실패했습니다. 입력 정보를 확인해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await verify2FA(otpCode);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setErrorMsg(errorObj.response?.data?.message || '2FA 인증 코드가 유효하지 않습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTermsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingTerms?.terms) return;
    setErrorMsg(null);

    // Ensure all required terms are agreed
    const missingRequired = pendingTerms.terms.some(
      (term) => term.isRequired && !agreedTermIds[term.id],
    );
    if (missingRequired) {
      setErrorMsg('필수 약관에 동의해야 서비스를 이용하실 수 있습니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = pendingTerms.terms.map((term) => ({
        termId: term.id,
        isAgreed: !!agreedTermIds[term.id],
      }));
      await agreeTerms(payload);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setErrorMsg(errorObj.response?.data?.message || '약관 동의 처리에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-orange-600 font-extrabold text-white shadow-lg dark:bg-orange-500">
            <ShieldCheck className="size-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            {pending2FA
              ? '2단계 인증 (2FA)'
              : pendingTerms
                ? '서비스 약관 동의'
                : mode === 'login'
                  ? '반갑습니다!'
                  : '계정 생성하기'}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {pending2FA
              ? '인증 앱(Authenticator)에서 생성된 6자리 코드를 입력하세요.'
              : pendingTerms
                ? '서비스 이용을 위해 아래 필수 약관에 동의해주세요.'
                : mode === 'login'
                  ? '이메일 및 비밀번호를 사용하여 로그인하세요.'
                  : '새로운 서비스 계정을 등록하세요.'}
          </p>
        </div>

        {/* Card Container */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white/90 p-8 shadow-xl backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/90">
          {errorMsg && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          {/* 1. 2FA Challenge Flow */}
          {pending2FA ? (
            <form onSubmit={handle2FASubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  2FA 보안 인증 코드
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 size-5 text-zinc-400" />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2.5 pl-11 pr-4 text-center text-lg font-mono font-bold tracking-widest text-zinc-900 outline-none transition focus:border-orange-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-100 dark:focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otpCode.length !== 6}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 text-sm font-bold text-white shadow-md transition hover:bg-orange-700 disabled:opacity-50 dark:bg-orange-500 dark:hover:bg-orange-600"
              >
                {isSubmitting ? '인증 중...' : '보안 인증 확인'}
                <ArrowRight className="size-4" />
              </button>
            </form>
          ) : pendingTerms ? (
            /* 2. Pending Terms Agreement Flow */
            <form onSubmit={handleTermsSubmit} className="space-y-5">
              <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                {pendingTerms.terms.map((term) => (
                  <div
                    key={term.id}
                    className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 transition hover:border-orange-200 dark:border-zinc-800 dark:bg-zinc-950/40"
                  >
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!agreedTermIds[term.id]}
                        onChange={(e) =>
                          setAgreedTermIds((prev) => ({
                            ...prev,
                            [term.id]: e.target.checked,
                          }))
                        }
                        className="mt-0.5 size-4 rounded text-orange-600 focus:ring-orange-500"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {term.title}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                              term.isRequired
                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                                : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                            }`}
                          >
                            {term.isRequired ? '필수' : '선택'}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 line-clamp-2 dark:text-zinc-400">
                          {term.content}
                        </p>
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 text-sm font-bold text-white shadow-md transition hover:bg-orange-700 disabled:opacity-50 dark:bg-orange-500 dark:hover:bg-orange-600"
              >
                {isSubmitting ? '동의 처리 중...' : '약관 동의 완료 및 시작하기'}
                <Check className="size-4" />
              </button>
            </form>
          ) : (
            /* 3. Credential Login / Register Form */
            <form onSubmit={handleCredentialSubmit} className="space-y-4">
              {/* Tab Selector */}
              <div className="flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-extrabold transition ${
                    mode === 'login'
                      ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  로그인
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-extrabold transition ${
                    mode === 'register'
                      ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  회원가입
                </button>
              </div>

              {mode === 'register' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    이름
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 size-4 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="홍길동"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2.5 pl-10 pr-4 text-xs font-medium outline-none transition focus:border-orange-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-100 dark:focus:border-orange-500"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  이메일 주소
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 size-4 text-zinc-400" />
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2.5 pl-10 pr-4 text-xs font-medium outline-none transition focus:border-orange-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-100 dark:focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  비밀번호
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 size-4 text-zinc-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2.5 pl-10 pr-4 text-xs font-medium outline-none transition focus:border-orange-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-100 dark:focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 text-xs font-bold text-white shadow-md transition hover:bg-orange-700 disabled:opacity-50 dark:bg-orange-500 dark:hover:bg-orange-600"
              >
                {isSubmitting
                  ? '처리 중...'
                  : mode === 'login'
                    ? '로그인'
                    : '회원가입 계정 생성'}
                <ArrowRight className="size-4" />
              </button>

              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                </div>
                <span className="relative bg-white px-3 text-[10px] font-bold text-zinc-400 uppercase tracking-wider dark:bg-zinc-900">
                  또는
                </span>
              </div>

              <a
                href="/api/v1/auth/google"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50/60 py-2.5 text-xs font-bold text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                Google 계정으로 계속하기
              </a>
            </form>
          )}
        </div>

        {/* Back Home Link */}
        <div className="text-center">
          <a
            href="/"
            className="text-xs font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            ← 메인 화면으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}
