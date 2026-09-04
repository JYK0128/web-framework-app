import { ShieldCheck } from 'lucide-react';

import { useI18n } from '#/hooks';

type LoginBrandHeaderProps = {
  mode: 'login' | 'register' | 'twoFactor'
};

export function LoginBrandHeader({ mode }: LoginBrandHeaderProps) {
  const { t } = useI18n();
  const content = {
    login: {
      title: t('login.welcome'),
      description: t('login.loginDescription'),
    },
    register: {
      title: t('login.createAccount'),
      description: t('login.registerDescription'),
    },
    twoFactor: {
      title: t('login.twoFactorTitle'),
      description: t('login.twoFactorDescription'),
    },
  }[mode];

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
          {content.title}
        </h1>
        <p className="text-xs text-muted-foreground">
          {content.description}
        </p>
      </div>
    </div>
  );
}
