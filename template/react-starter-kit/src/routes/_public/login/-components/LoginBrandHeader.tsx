import { ShieldCheck } from 'lucide-react';

type LoginBrandHeaderProps = {
  pending2FA: boolean
  pendingTerms: boolean
  mode: 'login' | 'register'
};

function getHeaderTitle(pending2FA: boolean, pendingTerms: boolean, mode: 'login' | 'register') {
  if (pending2FA) return '2단계 인증 (2FA)';
  if (pendingTerms) return '서비스 약관 동의';
  return mode === 'login' ? '반갑습니다!' : '계정 생성하기';
}

function getHeaderDescription(pending2FA: boolean, pendingTerms: boolean, mode: 'login' | 'register') {
  if (pending2FA) return '인증 앱(Authenticator)에서 생성된 6자리 코드를 입력하세요.';
  if (pendingTerms) return '서비스 이용을 위해 아래 필수 약관에 동의해주세요.';
  return mode === 'login' ? '이메일 및 비밀번호를 사용하여 로그인하세요.' : '새로운 서비스 계정을 등록하세요.';
}

export function LoginBrandHeader({ pending2FA, pendingTerms, mode }: LoginBrandHeaderProps) {
  return (
    <div className="grid justify-items-center gap-2 text-center">
      <div className="
        flex size-12 items-center justify-center rounded-2xl bg-primary
        text-primary-foreground shadow-md
      "
      >
        <ShieldCheck className="size-6 shrink-0" />
      </div>
      <div className="grid gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {getHeaderTitle(pending2FA, pendingTerms, mode)}
        </h1>
        <p className="text-xs text-muted-foreground">
          {getHeaderDescription(pending2FA, pendingTerms, mode)}
        </p>
      </div>
    </div>
  );
}
