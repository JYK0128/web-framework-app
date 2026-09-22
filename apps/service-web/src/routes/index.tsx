import { createFileRoute, Link } from '@tanstack/react-router';

import { Button } from '#/.generated/shadcn/components/ui';
import { PublicLayout, SectionCard } from '#/components/layout';

export const Route = createFileRoute('/')({
  component: () => (
    <PublicLayout>
      <div className="
        mx-auto grid size-full w-full max-w-6xl content-center gap-6 px-4 py-10
        md:px-6
      "
      >
        <SectionCard textSize="lg" title="Service Web" description="서비스의 주요 콘텐츠를 먼저 확인해 보세요.">
          <SectionCard.Content className="
            grid gap-4 p-6 text-sm text-muted-foreground
          "
          >
            <p>FAQ와 서비스 약관은 로그인 없이 확인할 수 있습니다. 서비스 기능을 이용하려면 로그인해 주세요.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" render={<Link to="/app" />}>앱 열기</Button>
              <Button render={<Link to="/login" />}>로그인</Button>
            </div>
          </SectionCard.Content>
        </SectionCard>
      </div>
    </PublicLayout>
  ),
});
