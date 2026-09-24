import { createFileRoute } from '@tanstack/react-router';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { LinkButton, ScreenLayout } from '#/components/layout';

export const Route = createFileRoute('/_public/')({
  component: () => (
    <ScreenLayout>
      <ScreenLayout.Content>
        <Card className="w-full shadow-xl">
          <CardHeader>
            <CardTitle>운영자 웹</CardTitle>
            <CardDescription>운영자 프론트엔드 기본 골자가 준비되었습니다.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            인증, API, 테마, 전역 오류 처리와 라우팅 기반을 포함합니다.
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <LinkButton variant="outline" to="/profile">프로필 열기</LinkButton>
            <LinkButton to="/login">로그인</LinkButton>
          </CardFooter>
        </Card>
      </ScreenLayout.Content>
      <ScreenLayout.Addon>운영자 웹</ScreenLayout.Addon>
    </ScreenLayout>
  ),
});
