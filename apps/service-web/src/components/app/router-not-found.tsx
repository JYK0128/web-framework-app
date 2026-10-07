import { useRouter } from '@tanstack/react-router';

import { Button, Card, CardContent, CardFooter } from '#/.generated/shadcn/components/ui';
import { LinkButton, ScreenLayout } from '#/components/layout';

export function RouterNotFound() {
  const router = useRouter();

  return (
    <ScreenLayout>
      <ScreenLayout.Content>
        <Card className="w-full shadow-xl">
          <CardContent className="
            grid justify-items-center gap-2 p-6 py-8 text-center
          "
          >
            <p className="text-6xl font-bold text-primary">404</p>
            <h1 className="text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
          </CardContent>
          <CardFooter className="gap-3">
            <Button className="flex-1" variant="outline" onClick={() => router.history.back()}>뒤로</Button>
            <LinkButton className="flex-1" variant="outline" to="/">홈으로</LinkButton>
          </CardFooter>
        </Card>
      </ScreenLayout.Content>
    </ScreenLayout>
  );
}
