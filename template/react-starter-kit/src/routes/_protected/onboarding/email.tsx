import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { MailCheck } from 'lucide-react';

import { Button, Card, CardContent } from '#/.generated/shadcn/components/ui';

export const Route = createFileRoute('/_protected/onboarding/email')({
  beforeLoad: ({ context }) => {
    if (context.user?.emailVerified) throw redirect({ to: '/onboarding/term' });
  },
  component: EmailOnboardingPage,
});

function EmailOnboardingPage() {
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();

  if (!user || user.emailVerified) return null;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="grid justify-items-center gap-5 p-8 text-center">
          <MailCheck className="size-10 text-primary" />
          <div className="grid gap-2">
            <h1 className="text-xl font-bold">이메일 인증이 필요합니다</h1>
            <p className="text-sm text-muted-foreground">
              <span>{user.email}</span>
              {' 주소의 이메일 인증을 완료하면 더 안전하게 서비스를 이용할 수 있습니다.'}
            </p>
          </div>
          <Button
            type="button"
            className="w-full"
            onClick={() => void navigate({ to: '/onboarding/term' })}
          >
            다음에 하기
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
