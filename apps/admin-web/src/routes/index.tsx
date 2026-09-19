import { createFileRoute, Link } from '@tanstack/react-router';

import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { ScreenLayout } from '#/components/layout';

export const Route = createFileRoute('/')({
  component: () => (
    <ScreenLayout>
      <ScreenLayout.Content>
        <Card className="w-full shadow-xl">
          <CardHeader>
            <CardTitle>Admin Web</CardTitle>
            <CardDescription>관리자 프론트엔드 기본 골자가 준비되었습니다.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            인증, API, 테마, 전역 오류 처리와 라우팅 기반을 포함합니다.
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button variant="outline" render={<Link to="/dashboard" />}>대시보드 열기</Button>
            <Button render={<Link to="/login" />}>로그인</Button>
          </CardFooter>
        </Card>
      </ScreenLayout.Content>
      <ScreenLayout.Addon>Admin Web</ScreenLayout.Addon>
    </ScreenLayout>
  ),
});
