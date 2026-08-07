import { ArrowRight, Lock, Mail, User } from 'lucide-react';
import { toast } from 'sonner';

import { Button, buttonVariants, Separator, Tabs, TabsContent, TabsList, TabsTrigger } from '#/.generated/shadcn/components/ui';
import { useAppForm } from '#/components/form';
import { useAuth } from '#/core/auth/useAuth';

type CredentialFormProps = {
  activeTab: 'login' | 'register'
  onTabChange: (tab: 'login' | 'register') => void
};

export function CredentialForm({ activeTab, onTabChange }: CredentialFormProps) {
  const { login, register } = useAuth();

  const loginForm = useAppForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      await login({ email: value.email, password: value.password });
    },
  });

  const registerForm = useAppForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    onSubmit: async ({ value }) => {
      if (value.password !== value.confirmPassword) {
        toast.error('비밀번호가 일치하지 않습니다.');
        return;
      }
      await register({
        email: value.email,
        password: value.password,
        name: value.name,
      });
      toast.success('회원가입이 성공적으로 완료되었습니다.');
      await login({ email: value.email, password: value.password });
    },
  });

  return (
    <Tabs
      value={activeTab}
      onValueChange={(val) => onTabChange(val as 'login' | 'register')}
      className="grid gap-4"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">로그인</TabsTrigger>
        <TabsTrigger value="register">회원가입</TabsTrigger>
      </TabsList>

      {/* 1. Login Tab Content */}
      <TabsContent value="login">
        <loginForm.AppForm>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void loginForm.handleSubmit();
            }}
            className="grid gap-4"
          >
            <loginForm.AppField name="email">
              {(field) => (
                <field.Input
                  type="email"
                  label="이메일 주소"
                  placeholder="user@example.com"
                  autoComplete="username"
                  leftSide={(
                    <Mail className="size-4 text-muted-foreground shrink-0" />
                  )}
                  required
                />
              )}
            </loginForm.AppField>

            <loginForm.AppField name="password">
              {(field) => (
                <field.Input
                  type="password"
                  label="비밀번호"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  leftSide={(
                    <Lock className="size-4 text-muted-foreground shrink-0" />
                  )}
                  required
                />
              )}
            </loginForm.AppField>

            <loginForm.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  <span>{isSubmitting ? '처리 중...' : '로그인'}</span>
                  <ArrowRight className="size-4 shrink-0" />
                </Button>
              )}
            </loginForm.Subscribe>

            <div className="relative flex items-center justify-center my-2">
              <Separator className="w-full" />
              <span className="
                absolute bg-card px-2 text-2xs uppercase text-muted-foreground
                font-semibold
              "
              >
                또는
              </span>
            </div>

            <a
              href="/api/v1/auth/google"
              className={buttonVariants({ variant: 'outline', className: 'w-full' })}
            >
              Google 계정으로 계속하기
            </a>
          </form>
        </loginForm.AppForm>
      </TabsContent>

      {/* 2. Register Tab Content */}
      <TabsContent value="register">
        <registerForm.AppForm>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void registerForm.handleSubmit();
            }}
            className="grid gap-4"
          >
            <registerForm.AppField name="name">
              {(field) => (
                <field.Input
                  type="text"
                  label="이름"
                  placeholder="홍길동"
                  autoComplete="name"
                  leftSide={(
                    <User className="size-4 text-muted-foreground shrink-0" />
                  )}
                  required
                />
              )}
            </registerForm.AppField>

            <registerForm.AppField name="email">
              {(field) => (
                <field.Input
                  type="email"
                  label="이메일 주소"
                  placeholder="user@example.com"
                  autoComplete="username"
                  leftSide={(
                    <Mail className="size-4 text-muted-foreground shrink-0" />
                  )}
                  required
                />
              )}
            </registerForm.AppField>

            <registerForm.AppField name="password">
              {(field) => (
                <field.Input
                  type="password"
                  label="비밀번호"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  leftSide={(
                    <Lock className="size-4 text-muted-foreground shrink-0" />
                  )}
                  required
                />
              )}
            </registerForm.AppField>

            <registerForm.AppField name="confirmPassword">
              {(field) => (
                <field.Input
                  type="password"
                  label="비밀번호 확인"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  leftSide={(
                    <Lock className="size-4 text-muted-foreground shrink-0" />
                  )}
                  required
                />
              )}
            </registerForm.AppField>

            <registerForm.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  <span>{isSubmitting ? '처리 중...' : '회원가입 계정 생성'}</span>
                  <ArrowRight className="size-4 shrink-0" />
                </Button>
              )}
            </registerForm.Subscribe>

            <div className="relative flex items-center justify-center my-2">
              <Separator className="w-full" />
              <span className="
                absolute bg-card px-2 text-2xs uppercase text-muted-foreground
                font-semibold
              "
              >
                또는
              </span>
            </div>

            <a
              href="/api/v1/auth/google"
              className={buttonVariants({ variant: 'outline', className: 'w-full' })}
            >
              Google 계정으로 계속하기
            </a>
          </form>
        </registerForm.AppForm>
      </TabsContent>
    </Tabs>
  );
}
