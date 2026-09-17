import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { type SyntheticEvent, useState } from 'react';

import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input, Label } from '#/.generated/shadcn/components/ui';
import { ScreenLayout } from '#/components/layout';
import { currentUserQueryOptions, login } from '#/core/api/auth';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const [userId, setUserId] = useState('demo-user');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const loginMutation = useMutation({
    mutationFn: login,
    meta: { successMessage: '로그인했습니다.' },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: currentUserQueryOptions().queryKey });
      await navigate({ to: '/app' });
    },
  });

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    event.preventDefault();
    loginMutation.mutate(userId.trim());
  };

  return (
    <ScreenLayout>
      <ScreenLayout.Content>
        <Card className="w-full shadow-xl">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>로그인</CardTitle>
              <CardDescription>BFF 세션을 생성합니다.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Label htmlFor="userId">사용자 ID</Label>
              <Input
                id="userId"
                name="userId"
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                autoComplete="username"
                required
              />
            </CardContent>
            <CardFooter className="justify-end">
              <Button type="submit" disabled={loginMutation.isPending || !userId.trim()}>
                {loginMutation.isPending ? '로그인 중...' : '로그인'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </ScreenLayout.Content>
    </ScreenLayout>
  );
}
